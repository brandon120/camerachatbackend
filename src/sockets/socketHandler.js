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
        // Store the chat room and its participants
        const [user1, user2] = room.split('-');
        activeChats.set(room, [user1, user2]);

        // Notify both users that chat has started
        io.to(room).emit('chat_started', { 
          room,
          participants: [user1, user2]
        });

        // Join both users to the room
        io.sockets.sockets.forEach(s => {
          if (s.userId === user1 || s.userId === user2) {
            s.join(room);
          }
        });
      } else {
        io.to(room).emit('chat_rejected');
      }
    });

    socket.on('stream_frame', ({ frame }) => {
      frameBuffer.updateFrame(socket.userId, frame);
      
      // Send frame to all chat rooms the user is in
      socket.rooms.forEach(room => {
        if (room !== socket.id) { // Skip the socket's own room
          socket.to(room).emit('stream_frame', {
            userId: socket.userId,
            frame
          });
        }
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