const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
// نرفع حجم الملف المسموح بنقله إلى 100 ميجابايت مثلاً
const io = new Server(server, {
    maxHttpBufferSize: 1e8 
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
            io.to(code).emit('peer-connected', "متصل الآن");
        } else {
            socket.emit('error-message', 'الكود غير صحيح');
        }
    });

    // الجزء الجديد: استقبال الملف وتمريره
    socket.on('send-file', (data) => {
        // نرسل الملف لكل الموجودين في نفس الغرفة (الكود)
        socket.to(data.code).emit('receive-file', {
            fileData: data.fileData,
            fileName: data.fileName
        });
    });
});

server.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
});