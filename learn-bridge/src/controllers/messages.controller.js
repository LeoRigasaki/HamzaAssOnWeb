const Message = require('../models/Message.model');
const User = require('../models/User.model');
const Session = require('../models/Session.model');

// @desc    Get messages between users
// @route   GET /api/v1/messages/:userId
// @access  Private
exports.getMessagesBetweenUsers = async (req, res) => {
  try {
    // Validate userId parameter
    if (!req.params.userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }
    
    let messages = await Message.find({
      $or: [
        { sender: req.user.id, receiver: req.params.userId },
        { sender: req.params.userId, receiver: req.user.id }
      ]
    })
      .sort({ createdAt: 1 })
      .populate({
        path: 'sender',
        select: 'name role'
      })
      .populate({
        path: 'receiver',
        select: 'name role'
      });

    // Log retrieved messages for debugging
    console.log(`Found ${messages.length} messages between users ${req.user.id} and ${req.params.userId}`);

    // For testing: If no messages exist, create a welcome message
    if (messages.length === 0) {
      // Get receiver details 
      const receiver = await User.findById(req.params.userId).select('name role');
      const sender = await User.findById(req.user.id).select('name role');
      
      if (!receiver) {
        return res.status(404).json({
          success: false,
          error: 'Receiver user not found'
        });
      }

      const welcomeMessage = {
        _id: "welcome-message-" + Date.now(),
        content: "Welcome to the chat! This is the beginning of your conversation.",
        createdAt: new Date(),
        sender: {
          _id: req.user.id,
          name: sender.name,
          role: sender.role
        },
        receiver: {
          _id: req.params.userId,
          name: receiver.name,
          role: receiver.role
        },
        isRead: true
      };
      
      messages = [welcomeMessage];
      
      console.log("Created welcome message:", welcomeMessage);
    }

    res.status(200).json({
      success: true,
      count: messages.length,
      data: messages
    });
  } catch (err) {
    console.error("Error in getMessagesBetweenUsers:", err);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// @desc    Get session messages
// @route   GET /api/v1/messages/session/:sessionId
// @access  Private
exports.getSessionMessages = async (req, res) => {
  try {
    const session = await Session.findById(req.params.sessionId);

    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }

    // Check if user is part of the session
    if (
      session.student.toString() !== req.user.id &&
      session.tutor.toString() !== req.user.id &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to access these messages'
      });
    }

    const messages = await Message.find({
      session: req.params.sessionId
    })
      .sort({ createdAt: 1 })
      .populate({
        path: 'sender',
        select: 'name role'
      });

    res.status(200).json({
      success: true,
      count: messages.length,
      data: messages
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// @desc    Send message
// @route   POST /api/v1/messages
// @access  Private
exports.sendMessage = async (req, res) => {
  try {
    const { receiver, content, session } = req.body;

    // Validate required fields
    if (!receiver) {
      return res.status(400).json({
        success: false,
        error: 'Receiver ID is required'
      });
    }

    if (!content) {
      return res.status(400).json({
        success: false,
        error: 'Message content is required'
      });
    }

    // Check if receiver exists
    const receiverUser = await User.findById(receiver);
    if (!receiverUser) {
      return res.status(404).json({
        success: false,
        error: 'Receiver not found'
      });
    }

    // Create message
    const message = await Message.create({
      sender: req.user.id,
      receiver,
      content,
      session
    });

    // Populate sender and receiver info
    const populatedMessage = await Message.findById(message._id)
      .populate({
        path: 'sender',
        select: 'name role'
      })
      .populate({
        path: 'receiver',
        select: 'name role'
      });

    console.log(`Message sent from ${req.user.id} to ${receiver}: ${content.substring(0, 30)}...`);

    res.status(201).json({
      success: true,
      data: populatedMessage
    });
  } catch (err) {
    console.error("Error in sendMessage:", err);
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
};

// @desc    Mark messages as read
// @route   PUT /api/v1/messages/read/:userId
// @access  Private
exports.markMessagesAsRead = async (req, res) => {
  try {
    // Validate userId parameter
    if (!req.params.userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }
    
    const result = await Message.updateMany(
      {
        sender: req.params.userId,
        receiver: req.user.id,
        isRead: false
      },
      {
        isRead: true
      }
    );

    console.log(`Marked ${result.nModified || result.modifiedCount || 0} messages as read from ${req.params.userId} to ${req.user.id}`);

    res.status(200).json({
      success: true,
      data: {
        updated: result.nModified || result.modifiedCount || 0
      }
    });
  } catch (err) {
    console.error("Error in markMessagesAsRead:", err);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// @desc    Get unread message count
// @route   GET /api/v1/messages/unread
// @access  Private
exports.getUnreadMessageCount = async (req, res) => {
  try {
    const count = await Message.countDocuments({
      receiver: req.user.id,
      isRead: false
    });

    res.status(200).json({
      success: true,
      data: { count }
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// @desc    Get user conversations
// @route   GET /api/v1/messages/conversations
// @access  Private
exports.getUserConversations = async (req, res) => {
  try {
    // Find all users the current user has exchanged messages with
    const messages = await Message.find({
      $or: [
        { sender: req.user.id },
        { receiver: req.user.id }
      ]
    }).select('sender receiver createdAt');

    // Extract unique user IDs
    const userIds = new Set();
    messages.forEach(message => {
      if (message.sender.toString() !== req.user.id) {
        userIds.add(message.sender.toString());
      }
      if (message.receiver.toString() !== req.user.id) {
        userIds.add(message.receiver.toString());
      }
    });

    // Get user details for each conversation partner
    const conversations = await Promise.all(
      Array.from(userIds).map(async userId => {
        const user = await User.findById(userId).select('name role');
        
        // Get last message
        const lastMessage = await Message.findOne({
          $or: [
            { sender: req.user.id, receiver: userId },
            { sender: userId, receiver: req.user.id }
          ]
        })
          .sort({ createdAt: -1 })
          .select('content createdAt isRead sender');

        // Get unread count
        const unreadCount = await Message.countDocuments({
          sender: userId,
          receiver: req.user.id,
          isRead: false
        });

        return {
          user,
          lastMessage,
          unreadCount
        };
      })
    );

    // Sort conversations by last message date
    conversations.sort((a, b) => 
      new Date(b.lastMessage.createdAt) - new Date(a.lastMessage.createdAt)
    );

    res.status(200).json({
      success: true,
      count: conversations.length,
      data: conversations
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};
