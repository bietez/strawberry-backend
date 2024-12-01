// server.js
const app = require('./app');
const http = require('http');
const socketIo = require('socket.io');
const config = require('./config');

const server = http.createServer(app);

const io = socketIo(server, {
  cors: {
    origin: '*',
  },
});

// Configuração do Socket.io
io.on('connection', (socket) => {
  console.log('Novo cliente conectado:', socket.id);

  socket.on('disconnect', () => {
    console.log('Cliente desconectado:', socket.id);
  });
});

global.io = io; // Disponibiliza o io globalmente

const PORT = config.port;

server.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
