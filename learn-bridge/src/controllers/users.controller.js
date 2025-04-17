const User = require('../models/User.model');
const Student = require('../models/Student.model');
const Tutor = require('../models/Tutor.model');

// @desc    Get all users
// @route   GET /api/v1/users
// @access  Private/Admin
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find();
    
    res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// @desc    Get single user
// @route   GET /api/v1/users/:id
// @access  Private/Admin
exports.getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// @desc    Search students
// @route   GET /api/v1/users/students/search
// @access  Public
exports.searchStudents = async (req, res) => {
  try {
    const { subject, learningGoal, grade, country } = req.query;
    
    // Build query
    const query = { role: 'student' };
    
    // Add preferred subject filter if provided
    if (subject) {
      query.preferredSubjects = { $in: [subject] };
    }
    
    // Add learning goal filter if provided
    if (learningGoal) {
      query.learningGoals = { $in: [learningGoal] };
    }
    
    // Add grade filter if provided
    if (grade) {
      query.grade = grade;
    }
    
    // Add country filter if provided
    if (country) {
      query.country = country;
    }
    
    // Find students matching the query
    const students = await Student.find(query);
    
    res.status(200).json({
      success: true,
      count: students.length,
      data: students
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

exports.getStudentProfile = async (req, res) => {
  try {
    console.log("Looking for student with ID:", req.params.id);
    
    // First check if student exists at all
    const userExists = await User.findById(req.params.id);
    if (!userExists) {
      console.log("No user found with this ID");
      return res.status(404).json({
        success: false,
        error: 'Student not found - no user with this ID'
      });
    }
    
    // Then check if it's actually a student
    const student = await Student.findById(req.params.id);
    if (!student) {
      console.log("User exists but is not a student");
      return res.status(404).json({
        success: false,
        error: 'User exists but is not a student'
      });
    }
    
    res.status(200).json({
      success: true,
      data: student
    });
  } catch (err) {
    console.error("Error getting student profile:", err);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/v1/users/profile
// @access  Private
exports.updateProfile = async (req, res) => {
  try {
    let user;
    const userId = req.user.id;
    
    // Handle different user types
    if (req.user.role === 'student') {
      const { learningGoals, preferredSubjects, availability } = req.body;
      
      // Create update object with only provided fields
      const updateFields = {};
      if (learningGoals) updateFields.learningGoals = learningGoals;
      if (preferredSubjects) updateFields.preferredSubjects = preferredSubjects;
      if (availability) updateFields.availability = availability;
      
      user = await Student.findByIdAndUpdate(
        userId,
        { $set: updateFields },
        { new: true, runValidators: true }
      );
    } else if (req.user.role === 'tutor') {
      const { expertise, availability, hourlyRate, education, experience } = req.body;
      
      // Create update object with only provided fields
      const updateFields = {};
      if (expertise) updateFields.expertise = expertise;
      if (availability) updateFields.availability = availability;
      if (hourlyRate) updateFields.hourlyRate = hourlyRate;
      if (education) updateFields.education = education;
      if (experience) updateFields.experience = experience;
      
      user = await Tutor.findByIdAndUpdate(
        userId,
        { $set: updateFields },
        { new: true, runValidators: true }
      );
    } else {
      // For admin or other roles
      user = await User.findById(userId);
    }
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
};

// @desc    Search tutors
// @route   GET /api/v1/users/tutors/search
// @access  Public
exports.searchTutors = async (req, res) => {
  try {
    const { subject, country, availability } = req.query;
    
    // Build query
    const query = { role: 'tutor' };
    
    // Add subject filter if provided
    if (subject) {
      query.expertise = { $in: [subject] };
    }
    
    // Add country filter if provided
    if (country) {
      query.country = country;
    }
    
    // Find tutors matching the query
    let tutors = await Tutor.find(query);
    
    // Filter by availability if provided
    if (availability) {
      const [day, startTime] = availability.split(',');
      
      if (day && startTime) {
        tutors = tutors.filter(tutor => {
          return tutor.availability.some(slot => 
            slot.day === day && 
            slot.startTime <= startTime && 
            slot.endTime > startTime
          );
        });
      }
    }
    
    res.status(200).json({
      success: true,
      count: tutors.length,
      data: tutors
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// @desc    Get tutor profile
// @route   GET /api/v1/users/tutors/:id
// @access  Public
exports.getTutorProfile = async (req, res) => {
  try {
    const tutor = await Tutor.findById(req.params.id)
      .populate({
        path: 'reviews',
        select: 'rating comment createdAt student'
      });
    
    if (!tutor) {
      return res.status(404).json({
        success: false,
        error: 'Tutor not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: tutor
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// @desc    Update tutor availability
// @route   PUT /api/v1/users/tutors/availability
// @access  Private/Tutor
exports.updateTutorAvailability = async (req, res) => {
  try {
    if (req.user.role !== 'tutor') {
      return res.status(403).json({
        success: false,
        error: 'Only tutors can update availability'
      });
    }
    
    const { availability } = req.body;
    
    if (!availability || !Array.isArray(availability)) {
      return res.status(400).json({
        success: false,
        error: 'Please provide availability as an array'
      });
    }
    
    const tutor = await Tutor.findByIdAndUpdate(
      req.user.id,
      { availability },
      { new: true, runValidators: true }
    );
    
    res.status(200).json({
      success: true,
      data: tutor
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
};

// @desc    Update student learning goals
// @route   PUT /api/v1/users/students/learning-goals
// @access  Private/Student
exports.updateLearningGoals = async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({
        success: false,
        error: 'Only students can update learning goals'
      });
    }
    
    const { learningGoals, preferredSubjects } = req.body;
    
    // Create update object with only provided fields
    const updateFields = {};
    if (learningGoals) updateFields.learningGoals = learningGoals;
    if (preferredSubjects) updateFields.preferredSubjects = preferredSubjects;
    
    const student = await Student.findByIdAndUpdate(
      req.user.id,
      updateFields,
      { new: true, runValidators: true }
    );
    
    res.status(200).json({
      success: true,
      data: student
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
};
