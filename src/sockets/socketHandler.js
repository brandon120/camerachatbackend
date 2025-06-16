import jwt from 'jsonwebtoken';
import frameBuffer from '../utils/frameBuffer.js';

export const initializeSocket = (io) => {
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication error'));
      }
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.userId;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log('User connected:', socket.userId);

    socket.on('chat_request', async ({ receiverId }) => {
      const room = `${socket.userId}-${receiverId}`;
      socket.join(room);
      io.to(receiverId).emit('chat_request', {
        senderId: socket.userId,
        room
      });
    });

    socket.on('chat_response', ({ room, accepted }) => {
      if (accepted) {
        io.to(room).emit('chat_started', { room });
      } else {
        io.to(room).emit('chat_rejected');
      }
    });

    socket.on('stream_frame', ({ frame }) => {
      frameBuffer.updateFrame(socket.userId, frame);
      const room = socket.rooms.values().next().value;
      if (room) {
        socket.to(room).emit('stream_frame', {
          userId: socket.userId,
          frame
        });
      }
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.userId);
      frameBuffer.removeFrame(socket.userId);
    });
  });
}; 