const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const app = express();
const server = http.createServer(app);
const io = new Server(server);

const port = process.env.PORT || 3000;

// تقديم الملفات من مجلد public
app.use(express.static('public'));

io.on('connection', (socket) => {
    console.log(`[+] New user connected: ${socket.id}`);

    socket.on('createRoom', () => {
        const roomID = Math.random().toString(36).substring(2, 8);
        socket.join(roomID);
        socket.emit('roomCreated', roomID);
    });

    socket.on('joinRoom', (roomID) => {
        const room = io.sockets.adapter.rooms.get(roomID);
        if (room && room.size < 2) {
            socket.join(roomID);
            socket.emit('roomJoined', roomID);
            io.to(roomID).emit('startGame');
        } else {
            socket.emit('roomError', 'Room full or invalid ID');
        }
    });

    socket.on('rollDice', (data) => {
        socket.to(data.roomID).emit('opponentRolled', data.value);
    });

    socket.on('playerMoved', (data) => {
        socket.to(data.roomID).emit('opponentMoved', data.position);
    });

    socket.on('disconnect', () => {
        console.log(`[-] User disconnected: ${socket.id}`);
    });
});

server.listen(port, () => {
    console.log(`🚀 Server running on http://localhost:${port}`);
});
