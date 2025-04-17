const express = require('express');
const {
  getCourses,
  getCourse,
  createCourse,
  updateCourse,
  deleteCourse,
  enrollCourse,
  unenrollCourse,
  getTutorCourses,
  getStudentCourses
} = require('../controllers/courses.controller');

const router = express.Router();

// Import auth middleware
const { protect, authorize } = require('../middleware/auth.middleware');

// Public routes
router.get('/', getCourses);
router.get('/:id', getCourse);

// Protected routes
router.post('/', protect, authorize('tutor'), createCourse);
router.put('/:id', protect, authorize('tutor', 'admin'), updateCourse);
router.delete('/:id', protect, authorize('tutor', 'admin'), deleteCourse);

// Student routes
router.put('/:id/enroll', protect, authorize('student'), enrollCourse);
router.put('/:id/unenroll', protect, authorize('student'), unenrollCourse);
router.get('/student/enrolled', protect, authorize('student'), getStudentCourses);

// Tutor routes
router.get('/tutor/mycourses', protect, authorize('tutor'), getTutorCourses);

module.exports = router;
