// خادم Node.js بسيط لغرف اللعب باستخدام Socket.IO
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

// تقديم الملفات الثابتة
app.use(express.static(path.join(__dirname)));

// إدارة الغرف
const rooms = {};

io.on('connection', (socket) => {
    let currentRoom = null;
    let playerName = null;

    socket.on('createRoom', (name, callback) => {
        let roomId;
        do {
            roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
        } while (rooms[roomId]);
        rooms[roomId] = { players: [socket.id], names: [name] };
        currentRoom = roomId;
        playerName = name;
        socket.join(roomId);
        callback({ roomId });
    });

    socket.on('joinRoom', (roomId, name, callback) => {
        if (!rooms[roomId]) {
            callback({ error: 'الغرفة غير موجودة' });
            return;
        }
        if (rooms[roomId].players.length >= 2) {
            callback({ error: 'الغرفة ممتلئة' });
            return;
        }
        rooms[roomId].players.push(socket.id);
        rooms[roomId].names.push(name);
        currentRoom = roomId;
        playerName = name;
        socket.join(roomId);
        callback({ success: true, names: rooms[roomId].names });
        // إعلام اللاعب الأول بانضمام الثاني
        io.to(roomId).emit('bothPlayersReady', rooms[roomId].names);
    });

    socket.on('playerMove', (data) => {
        if (currentRoom) {
            socket.to(currentRoom).emit('playerMove', data);
        }
    });

    socket.on('disconnect', () => {
        if (currentRoom && rooms[currentRoom]) {
            const idx = rooms[currentRoom].players.indexOf(socket.id);
            if (idx !== -1) {
                rooms[currentRoom].players.splice(idx, 1);
                rooms[currentRoom].names.splice(idx, 1);
            }
            if (rooms[currentRoom].players.length === 0) {
                delete rooms[currentRoom];
            } else {
                io.to(currentRoom).emit('playerLeft');
            }
        }
    });
});

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
