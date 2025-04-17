const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User.model');
const Message = require('../models/Message.model');
const config = require('../config/config');


// Initialize Socket.io
const initializeSocket = (server) => {
  const io = socketIo(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  // Socket.io middleware for authentication
  io.use(async (socket, next) => {
    try {
      // Get token from handshake auth
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Authentication error: Token not provided'));
      }
      
      // Verify token
      const decoded = jwt.verify(token, config.JWT_SECRET);
      
      // Find user
      const user = await User.findById(decoded.id);
      
      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }
      
      // Attach user to socket
      socket.user = user;
      next();
    } catch (err) {
      return next(new Error('Authentication error: Invalid token'));
    }
  });

  // Connection event
  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.user.name} (${socket.user._id})`);
    
    // Join personal room
    socket.join(socket.user._id.toString());
    
    // Handle joining session room
    socket.on('joinSession', (sessionId) => {
      socket.join(`session:${sessionId}`);
      console.log(`${socket.user.name} joined session room: ${sessionId}`);
    });
    
    // Handle leaving session room
    socket.on('leaveSession', (sessionId) => {
      socket.leave(`session:${sessionId}`);
      console.log(`${socket.user.name} left session room: ${sessionId}`);
    });
    const getConversationRoomId = (user1Id, user2Id) => {
      // Sort IDs to ensure the same room regardless of who initiates
      const ids = [user1Id, user2Id].sort();
      return `conversation:${ids[0]}_${ids[1]}`;
    };
    
    // Then modify the privateMessage handler to broadcast to the conversation room
    socket.on('privateMessage', async (data) => {
      try {
        const { receiver, content, session } = data;
        
        // Create message in database
        const message = await Message.create({
          sender: socket.user._id,
          receiver,
          content,
          session
        });
        
        // Populate sender info
        const populatedMessage = await Message.findById(message._id)
          .populate({
            path: 'sender',
            select: 'name role'
          })
          .populate({
            path: 'receiver',
            select: 'name role'
          });
        
        // Get conversation room ID
        const conversationRoom = getConversationRoomId(socket.user._id, receiver);
        
        // Emit to conversation room
        io.to(conversationRoom).emit('newMessage', populatedMessage);
        
        // Emit to receiver's personal room as a fallback
        io.to(receiver).emit('newMessage', populatedMessage);
        
        // If session is provided, emit to session room
        if (session) {
          io.to(`session:${session}`).emit('sessionMessage', populatedMessage);
        }
      } catch (err) {
        console.error('Error sending message:', err);
        socket.emit('messageError', { error: err.message });
      }
    });
    // Handle private message
    socket.on('privateMessage', async (data) => {
      try {
        const { receiver, content, session } = data;
        
        // Create message in database
        const message = await Message.create({
          sender: socket.user._id,
          receiver,
          content,
          session
        });
        
        // Populate sender info
        const populatedMessage = await Message.findById(message._id)
          .populate({
            path: 'sender',
            select: 'name role'
          })
          .populate({
            path: 'receiver',
            select: 'name role'
          });
        
        // Emit to receiver's personal room
        io.to(receiver).emit('newMessage', populatedMessage);
        
        // Emit to sender (for confirmation)
        socket.emit('messageSent', populatedMessage);
        
        // If session is provided, emit to session room
        if (session) {
          io.to(`session:${session}`).emit('sessionMessage', populatedMessage);
        }
      } catch (err) {
        console.error('Error sending message:', err);
        socket.emit('messageError', { error: err.message });
      }
    });
    
    // Handle typing indicator
    socket.on('typing', (data) => {
      const { receiver } = data;
      io.to(receiver).emit('userTyping', {
        user: socket.user._id,
        name: socket.user.name
      });
    });
    
    // Handle stop typing indicator
    socket.on('stopTyping', (data) => {
      const { receiver } = data;
      io.to(receiver).emit('userStoppedTyping', {
        user: socket.user._id
      });
    });
    
    // Handle session status updates
    socket.on('sessionUpdate', (data) => {
      const { sessionId, status } = data;
      io.to(`session:${sessionId}`).emit('sessionStatusChanged', {
        sessionId,
        status,
        updatedBy: socket.user._id
      });
    });
    
    socket.on('joinConversation', (userId) => {
      const conversationRoom = getConversationRoomId(socket.user._id, userId);
      socket.join(conversationRoom);
      console.log(`${socket.user.name} joined conversation room: ${conversationRoom}`);
    });
    
    socket.on('leaveConversation', (userId) => {
      const conversationRoom = getConversationRoomId(socket.user._id, userId);
      socket.leave(conversationRoom);
      console.log(`${socket.user.name} left conversation room: ${conversationRoom}`);
    });

    // Handle read receipts
    socket.on('markAsRead', async (data) => {
      try {
        const { sender } = data;
        
        // Update messages in database
        await Message.updateMany(
          {
            sender,
            receiver: socket.user._id,
            isRead: false
          },
          {
            isRead: true
          }
        );
        
        // Notify sender that messages were read
        io.to(sender).emit('messagesRead', {
          by: socket.user._id
        });
      } catch (err) {
        console.error('Error marking messages as read:', err);
      }
    });
    
    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.user.name} (${socket.user._id})`);
    });
  });

  return io;
};


module.exports = { initializeSocket };
