const express = require('express');
const {
  createSession,
  getSessions,
  getSession,
  updateSessionStatus,
  addMeetingLink,
  getUpcomingSessions,
  getSessionHistory
} = require('../controllers/sessions.controller');

const router = express.Router();

// Import auth middleware
const { protect, authorize } = require('../middleware/auth.middleware');

// Apply auth middleware to all routes
router.use(protect);

// Session routes
router.post('/', authorize('student'), createSession);
router.get('/', getSessions);
router.get('/upcoming', getUpcomingSessions);
router.get('/history', getSessionHistory);
router.get('/:id', getSession);
router.put('/:id', authorize('tutor', 'admin'), updateSessionStatus);
router.put('/:id/meeting-link', authorize('tutor', 'admin'), addMeetingLink);

module.exports = router;
