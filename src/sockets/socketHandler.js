import jwt from 'jsonwebtoken';
import frameBuffer from '../utils/frameBuffer.js';

// Store active chat rooms and their participants
const activeChats = new Map();

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

    // Join any existing chat rooms for this user
    activeChats.forEach((participants, roomId) => {
      if (participants.includes(socket.userId)) {
        socket.join(roomId);
      }
    });

    socket.on('join_chat', ({ room }) => {
      socket.join(room);
      
      // Add user to active participants
      if (!activeChats.has(room)) {
        activeChats.set(room, []);
      }
      if (!activeChats.get(room).includes(socket.userId)) {
        activeChats.get(room).push(socket.userId);
      }
      
      // Notify all users in the room that a new user has joined
      io.to(room).emit('chat_started', { 
        room,
        participants: activeChats.get(room)
      });
    });

    socket.on('leave_chat', ({ room }) => {
      // Remove user from active participants
      if (activeChats.has(room)) {
        const participants = activeChats.get(room);
        const index = participants.indexOf(socket.userId);
        if (index > -1) {
          participants.splice(index, 1);
        }
        if (participants.length === 0) {
          activeChats.delete(room);
        }
      }
      
      // Leave the socket room
      socket.leave(room);
      
      // Notify other users
      io.to(room).emit('user_disconnected', { userId: socket.userId });
    });

    socket.on('stream_frame', ({ room, frame }) => {
      frameBuffer.updateFrame(socket.userId, frame);
      
      // Send frame to the specific chat room
      socket.to(room).emit('stream_frame', {
        userId: socket.userId,
        frame
      });
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.userId);
      frameBuffer.removeFrame(socket.userId);

      // Clean up chat rooms when user disconnects
      activeChats.forEach((participants, room) => {
        if (participants.includes(socket.userId)) {
          io.to(room).emit('user_disconnected', { userId: socket.userId });
          activeChats.delete(room);
        }
      });
    });
  });
}; 