const express = require('express');
const {
  getMessagesBetweenUsers,
  getSessionMessages,
  sendMessage,
  markMessagesAsRead,
  getUnreadMessageCount,
  getUserConversations
} = require('../controllers/messages.controller');

const router = express.Router();

// Import auth middleware
const { protect } = require('../middleware/auth.middleware');

// Apply auth middleware to all routes
router.use(protect);

// Message routes
router.get('/conversations', getUserConversations);
router.get('/unread', getUnreadMessageCount);
router.get('/session/:sessionId', getSessionMessages);
router.get('/:userId', getMessagesBetweenUsers);
router.post('/', sendMessage);
router.put('/read/:userId', markMessagesAsRead);

module.exports = router;
