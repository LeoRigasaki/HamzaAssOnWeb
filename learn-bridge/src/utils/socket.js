const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User.model');
const Message = require('../models/Message.model');
const config = require('../config/config');

// Initialize Socket.io
const initializeSocket = (server) => {
  const io = socketIo(server, {
    cors: {
      origin: "http://localhost:5173", // Update this to match your frontend URL
      methods: ["GET", "POST"],
      credentials: true,
      allowedHeaders: ["Content-Type", "Authorization"]
    }
  });

  // Socket.io middleware for authentication
  io.use(async (socket, next) => {
    try {
      // Get token from handshake auth
      const token = socket.handshake.auth.token;

      if (!token) {
        console.log("Socket authentication error: Token not provided");
        return next(new Error('Authentication error: Token not provided'));
      }

      // Verify token
      const decoded = jwt.verify(token, config.JWT_SECRET);

      // Find user
      const user = await User.findById(decoded.id);

      if (!user) {
        console.log("Socket authentication error: User not found");
        return next(new Error('Authentication error: User not found'));
      }

      // Attach user to socket
      socket.user = user;
      console.log(`Socket authenticated: ${user.name} (${user._id})`);
      next();
    } catch (err) {
      console.log("Socket authentication error:", err.message);
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
      if (sessionId) {
        socket.join(`session:${sessionId}`);
        console.log(`${socket.user.name} joined session room: ${sessionId}`);
      } else {
        console.log(`Invalid sessionId provided by ${socket.user.name}`);
      }
    });

    // Handle leaving session room
    socket.on('leaveSession', (sessionId) => {
      if (sessionId) {
        socket.leave(`session:${sessionId}`);
        console.log(`${socket.user.name} left session room: ${sessionId}`);
      }
    });

    // Get conversation room ID
    const getConversationRoomId = (user1Id, user2Id) => {
      // Sort IDs to ensure the same room regardless of who initiates
      const ids = [user1Id, user2Id].sort();
      return `conversation:${ids[0]}_${ids[1]}`;
    };

    // Handle join conversation
    socket.on('joinConversation', (userId) => {
      if (!userId) {
        console.log(`Invalid userId for joinConversation from ${socket.user.name}`);
        return;
      }

      const conversationRoom = getConversationRoomId(socket.user._id, userId);
      socket.join(conversationRoom);
      console.log(`${socket.user.name} joined conversation room: ${conversationRoom}`);
    });

    // Handle leave conversation
    socket.on('leaveConversation', (userId) => {
      if (!userId) {
        console.log(`Invalid userId for leaveConversation from ${socket.user.name}`);
        return;
      }

      const conversationRoom = getConversationRoomId(socket.user._id, userId);
      socket.leave(conversationRoom);
      console.log(`${socket.user.name} left conversation room: ${conversationRoom}`);
    });

    // Handle private message
    socket.on('privateMessage', async (data) => {
      try {
        const { receiver, content, session } = data;

        if (!receiver || !content) {
          console.log("Invalid message data:", data);
          socket.emit('messageError', { error: 'Receiver and content are required' });
          return;
        }

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
        const conversationRoom = getConversationRoomId(socket.user._id.toString(), receiver.toString());

        // Emit to conversation room
        io.to(conversationRoom).emit('newMessage', populatedMessage);

        // Emit to receiver's personal room as a fallback
        io.to(receiver).emit('newMessage', populatedMessage);

        // If session is provided, emit to session room
        if (session) {
          io.to(`session:${session}`).emit('sessionMessage', populatedMessage);
        }

        // Emit confirmation to sender
        socket.emit('messageSent', populatedMessage);

        console.log(`Message sent from ${socket.user.name} to ${receiver}`);
      } catch (err) {
        console.error('Error sending message:', err);
        socket.emit('messageError', { error: err.message });
      }
    });

    // Handle typing indicator
    socket.on('typing', (data) => {
      const { receiver } = data;

      if (!receiver) {
        console.log("Invalid typing data:", data);
        return;
      }

      const conversationRoom = getConversationRoomId(socket.user._id.toString(), receiver.toString());
      io.to(conversationRoom).emit('userTyping', {
        user: socket.user._id,
        name: socket.user.name
      });
    });

    // Handle stop typing indicator
    socket.on('stopTyping', (data) => {
      const { receiver } = data;

      if (!receiver) {
        console.log("Invalid stopTyping data:", data);
        return;
      }
      const conversationRoom = getConversationRoomId(socket.user._id.toString(), receiver.toString());
      io.to(conversationRoom).emit('userStoppedTyping', {
        user: socket.user._id
      });
    });

    // Handle session status updates
    socket.on('sessionUpdate', (data) => {
      const { sessionId, status } = data;

      if (!sessionId || !status) {
        console.log("Invalid sessionUpdate data:", data);
        return;
      }

      io.to(`session:${sessionId}`).emit('sessionStatusChanged', {
        sessionId,
        status,
        updatedBy: socket.user._id
      });

      console.log(`Session ${sessionId} status updated to ${status} by ${socket.user.name}`);
    });

    // Handle read receipts
    socket.on('markAsRead', async (data) => {
      try {
        const { sender } = data;

        if (!sender) {
          console.log("Invalid markAsRead data:", data);
          return;
        }

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
        const conversationRoom = getConversationRoomId(socket.user._id.toString(), sender.toString());
        io.to(conversationRoom).emit('messagesRead', {
          by: socket.user._id
        });

        console.log(`Messages from ${sender} marked as read by ${socket.user.name}`);
      } catch (err) {
        console.error('Error marking messages as read:', err);
      }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.user.name} (${socket.user._id})`);
    });

    // Handle connection errors
    socket.on('error', (error) => {
      console.error(`Socket error for user ${socket.user?._id}: ${error.message}`);
    });
  });

  // Handle server-side errors
  io.engine.on('connection_error', (err) => {
    console.error('Connection error:', err);
  });

  return io;
};

module.exports = { initializeSocket };