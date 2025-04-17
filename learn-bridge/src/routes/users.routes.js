const express = require('express');
const {
  getUsers,
  getUser,
  updateProfile,
  searchTutors,
  getTutorProfile,
  updateTutorAvailability,
  updateLearningGoals,
  searchStudents
} = require('../controllers/users.controller');

const router = express.Router();

// Import auth middleware
const { protect, authorize } = require('../middleware/auth.middleware');

// Admin routes
router.get('/', protect, authorize('admin'), getUsers);
router.get('/:id', protect, authorize('admin'), getUser);

// Profile routes
router.put('/profile', protect, updateProfile);

// Tutor routes
router.get('/tutors/search', searchTutors);
router.get('/tutors/:id', getTutorProfile);
router.put('/tutors/availability', protect, authorize('tutor'), updateTutorAvailability);

// Student routes
router.put('/students/learning-goals', protect, authorize('student'), updateLearningGoals);
router.get('/students/search', searchStudents);
module.exports = router;
