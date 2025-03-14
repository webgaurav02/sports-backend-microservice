// src/socket.js
let io;

function initSocket(server) {
  io = require('socket.io')(server, { cors: { origin: '*' } });
  
  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    
    // Clients subscribe to updates for a specific match and section.
    socket.on('subscribe', ({ matchId, sectionId }) => {
      const room = `match:${matchId}:section:${sectionId}`;
      socket.join(room);
      console.log(`Socket ${socket.id} joined room ${room}`);
    });
    
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });
}

function publishSeatUpdate(matchId, sectionId) {
  if (!io) return;
  const redisClient = require('./config/redis');
  const availableKey = `available:match:${matchId}:section:${sectionId}`;
  
  // Retrieve the available seats count as a string
  redisClient.get(availableKey).then(value => {
    // Convert the retrieved value to a number; default to 0 if null or invalid
    const availableCount = parseInt(value, 10) || 0;
    const room = `match:${matchId}:section:${sectionId}`;
    io.to(room).emit('seatUpdate', { matchId, sectionId, availableCount });
  }).catch(err => {
    console.error("Error fetching available seats from Redis:", err);
  });
}


module.exports = { initSocket, publishSeatUpdate };