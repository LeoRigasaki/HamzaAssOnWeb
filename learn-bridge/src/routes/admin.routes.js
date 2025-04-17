const express = require('express');
const {
  getUsers,
  getUserDetails,
  updateUser,
  deleteUser,
  getSessions,
  getPlatformStats,
  getReportedContent
} = require('../controllers/admin.controller');

const router = express.Router();

// Import auth middleware
const { protect, authorize } = require('../middleware/auth.middleware');

// Apply auth middleware to all routes
router.use(protect);
router.use(authorize('admin'));

// Admin routes
router.get('/users', getUsers);
router.get('/users/:id', getUserDetails);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);
router.get('/sessions', getSessions);
router.get('/stats', getPlatformStats);
router.get('/reports', getReportedContent);

module.exports = router;
