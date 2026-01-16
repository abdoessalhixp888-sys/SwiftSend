const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);

// رفع الحد الأقصى إلى 500 ميجابايت
const io = new Server(server, {
    maxHttpBufferSize: 5e8, 
    pingTimeout: 60000 
});

app.use(express.static('public'));

const activeCodes = {}; 

io.on('connection', (socket) => {
    socket.on('create-code', () => {
        const code = Math.floor(100000 + Math.random() * 900000).toString(); 
        activeCodes[code] = socket.id;
        socket.join(code);
        socket.emit('code-generated', code);
    });

    socket.on('join-by-code', (code) => {
        if (activeCodes[code]) {
            socket.join(code);
            io.to(code).emit('peer-connected');
        } else {
            socket.emit('error-message', 'الكود غير صحيح');
        }
    });

    socket.on('send-file', (data) => {
        socket.to(data.code).emit('receive-file', {
            fileData: data.fileData,
            fileName: data.fileName,
            fileType: data.fileType
        });
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log('Server is running...');
});