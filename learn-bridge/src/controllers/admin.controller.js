const User = require('../models/User.model');
const Student = require('../models/Student.model');
const Tutor = require('../models/Tutor.model');
const Session = require('../models/Session.model');
const Message = require('../models/Message.model');
const Review = require('../models/Review.model');

// @desc    Get all users with pagination
// @route   GET /api/v1/admin/users
// @access  Private/Admin
exports.getUsers = async (req, res) => {
  try {
    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const total = await User.countDocuments();

    // Filter by role if provided
    const roleFilter = req.query.role ? { role: req.query.role } : {};

    // Query with pagination
    const users = await User.find(roleFilter)
      .skip(startIndex)
      .limit(limit)
      .sort({ createdAt: -1 });

    // Pagination result
    const pagination = {};

    if (endIndex < total) {
      pagination.next = {
        page: page + 1,
        limit
      };
    }

    if (startIndex > 0) {
      pagination.prev = {
        page: page - 1,
        limit
      };
    }

    res.status(200).json({
      success: true,
      count: users.length,
      pagination,
      total,
      data: users
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// @desc    Get user details
// @route   GET /api/v1/admin/users/:id
// @access  Private/Admin
exports.getUserDetails = async (req, res) => {
  try {
    let user;
    
    // Find user by ID
    const baseUser = await User.findById(req.params.id);
    
    if (!baseUser) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    // Get role-specific user data
    if (baseUser.role === 'student') {
      user = await Student.findById(req.params.id);
    } else if (baseUser.role === 'tutor') {
      user = await Tutor.findById(req.params.id)
        .populate({
          path: 'reviews',
          select: 'rating comment createdAt student'
        });
    } else {
      user = baseUser;
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

// @desc    Update user
// @route   PUT /api/v1/admin/users/:id
// @access  Private/Admin
exports.updateUser = async (req, res) => {
  try {
    // Find user by ID
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    // Fields that admin can update
    const { name, email, role, country, bio, isActive } = req.body;
    
    // Create update object with only provided fields
    const updateFields = {};
    if (name !== undefined) updateFields.name = name;
    if (email !== undefined) updateFields.email = email;
    if (role !== undefined) updateFields.role = role;
    if (country !== undefined) updateFields.country = country;
    if (bio !== undefined) updateFields.bio = bio;
    if (isActive !== undefined) updateFields.isActive = isActive;
    
    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      updateFields,
      { new: true, runValidators: true }
    );
    
    res.status(200).json({
      success: true,
      data: updatedUser
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
};

// @desc    Delete user
// @route   DELETE /api/v1/admin/users/:id
// @access  Private/Admin
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    // Delete user
    await user.remove();
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// @desc    Get all sessions with pagination
// @route   GET /api/v1/admin/sessions
// @access  Private/Admin
exports.getSessions = async (req, res) => {
  try {
    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const total = await Session.countDocuments();
    
    // Filter by status if provided
    const statusFilter = req.query.status ? { status: req.query.status } : {};
    
    // Query with pagination
    const sessions = await Session.find(statusFilter)
      .populate({
        path: 'student',
        select: 'name email'
      })
      .populate({
        path: 'tutor',
        select: 'name email'
      })
      .skip(startIndex)
      .limit(limit)
      .sort({ date: -1 });
    
    // Pagination result
    const pagination = {};
    
    if (endIndex < total) {
      pagination.next = {
        page: page + 1,
        limit
      };
    }
    
    if (startIndex > 0) {
      pagination.prev = {
        page: page - 1,
        limit
      };
    }
    
    res.status(200).json({
      success: true,
      count: sessions.length,
      pagination,
      total,
      data: sessions
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// @desc    Get platform statistics
// @route   GET /api/v1/admin/stats
// @access  Private/Admin
exports.getPlatformStats = async (req, res) => {
  try {
    // Get user counts
    const totalUsers = await User.countDocuments();
    const totalStudents = await User.countDocuments({ role: 'student' });
    const totalTutors = await User.countDocuments({ role: 'tutor' });
    
    // Get session counts
    const totalSessions = await Session.countDocuments();
    const completedSessions = await Session.countDocuments({ status: 'completed' });
    const pendingSessions = await Session.countDocuments({ status: 'pending' });
    const acceptedSessions = await Session.countDocuments({ status: 'accepted' });
    
    // Get message count
    const totalMessages = await Message.countDocuments();
    
    // Get review stats
    const totalReviews = await Review.countDocuments();
    const avgRating = await Review.aggregate([
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' }
        }
      }
    ]);
    
    // Get new users in last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const newUsers = await User.countDocuments({
      createdAt: { $gte: thirtyDaysAgo }
    });
    
    // Get new sessions in last 30 days
    const newSessions = await Session.countDocuments({
      createdAt: { $gte: thirtyDaysAgo }
    });
    
    // Get most popular subjects
    const popularSubjects = await Session.aggregate([
      {
        $group: {
          _id: '$subject',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: 5
      }
    ]);
    
    res.status(200).json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          students: totalStudents,
          tutors: totalTutors,
          newLast30Days: newUsers
        },
        sessions: {
          total: totalSessions,
          completed: completedSessions,
          pending: pendingSessions,
          accepted: acceptedSessions,
          newLast30Days: newSessions
        },
        messages: {
          total: totalMessages
        },
        reviews: {
          total: totalReviews,
          averageRating: avgRating.length > 0 ? avgRating[0].averageRating : 0
        },
        popularSubjects
      }
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// @desc    Get reported content
// @route   GET /api/v1/admin/reports
// @access  Private/Admin
exports.getReportedContent = async (req, res) => {
  try {
    // This is a placeholder for a future feature
    // In a real implementation, you would have a Report model
    
    res.status(200).json({
      success: true,
      data: [],
      message: 'Content reporting feature is not implemented yet'
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};
