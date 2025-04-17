const Session = require('../models/Session.model');
const User = require('../models/User.model');
const Student = require('../models/Student.model');
const Tutor = require('../models/Tutor.model');

// @desc    Create a new session request
// @route   POST /api/v1/sessions
// @access  Private/Student
exports.createSession = async (req, res) => {
  try {
    // Check if user is a student
    if (req.user.role !== 'student') {
      return res.status(403).json({
        success: false,
        error: 'Only students can create session requests'
      });
    }

    // Add student id to request body
    req.body.student = req.user.id;

    // Check if tutor exists
    const tutor = await Tutor.findById(req.body.tutor);
    if (!tutor) {
      return res.status(404).json({
        success: false,
        error: 'Tutor not found'
      });
    }

    // Check if tutor teaches the requested subject
    if (!tutor.expertise.includes(req.body.subject)) {
      return res.status(400).json({
        success: false,
        error: `Tutor does not teach ${req.body.subject}`
      });
    }

    // Check if tutor is available at the requested time
    const sessionDate = new Date(req.body.date);
    const dayOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][sessionDate.getDay()];
    
    const isAvailable = tutor.availability.some(slot => {
      return slot.day === dayOfWeek && 
             slot.startTime <= req.body.startTime && 
             slot.endTime >= req.body.endTime;
    });

    //todo: uncomment krna later

    // if (!isAvailable) {
    //   return res.status(400).json({
    //     success: false,
    //     error: 'Tutor is not available at the requested time'
    //   });
    // }

    // Create session
    const session = await Session.create(req.body);

    // Add session to student's enrolledSessions
    await Student.findByIdAndUpdate(
      req.user.id,
      { $push: { enrolledSessions: session._id } }
    );

    // Add session to tutor's sessions
    await Tutor.findByIdAndUpdate(
      req.body.tutor,
      { $push: { sessions: session._id } }
    );

    res.status(201).json({
      success: true,
      data: session
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
};

// @desc    Get all sessions
// @route   GET /api/v1/sessions
// @access  Private
exports.getSessions = async (req, res) => {
  try {
    let query;

    // If user is a student, get only their sessions
    if (req.user.role === 'student') {
      query = Session.find({ student: req.user.id });
    } 
    // If user is a tutor, get only their sessions
    else if (req.user.role === 'tutor') {
      query = Session.find({ tutor: req.user.id });
    } 
    // If user is an admin, get all sessions
    else if (req.user.role === 'admin') {
      query = Session.find();
    }

    // Add population
    query = query
      .populate({
        path: 'student',
        select: 'name email'
      })
      .populate({
        path: 'tutor',
        select: 'name email'
      });

    // Execute query
    const sessions = await query;

    res.status(200).json({
      success: true,
      count: sessions.length,
      data: sessions
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// @desc    Get single session
// @route   GET /api/v1/sessions/:id
// @access  Private
exports.getSession = async (req, res) => {
  try {
    const session = await Session.findById(req.params.id)
      .populate({
        path: 'student',
        select: 'name email'
      })
      .populate({
        path: 'tutor',
        select: 'name email'
      })
      .populate({
        path: 'messages',
        select: 'sender content createdAt isRead'
      });

    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }

    // Make sure user is session owner or admin
    if (
      session.student._id.toString() !== req.user.id &&
      session.tutor._id.toString() !== req.user.id &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to access this session'
      });
    }

    res.status(200).json({
      success: true,
      data: session
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// @desc    Update session status
// @route   PUT /api/v1/sessions/:id
// @access  Private/Tutor
exports.updateSessionStatus = async (req, res) => {
  try {
    let session = await Session.findById(req.params.id);

    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }

    // Make sure user is the tutor for this session
    if (session.tutor.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this session'
      });
    }

    // Check if status is valid
    const { status } = req.body;
    if (!['accepted', 'rejected', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status value'
      });
    }

    // Update session
    session = await Session.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    )
      .populate({
        path: 'student',
        select: 'name email'
      })
      .populate({
        path: 'tutor',
        select: 'name email'
      });

    res.status(200).json({
      success: true,
      data: session
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
};

// @desc    Add meeting link to session
// @route   PUT /api/v1/sessions/:id/meeting-link
// @access  Private/Tutor
exports.addMeetingLink = async (req, res) => {
  try {
    let session = await Session.findById(req.params.id);

    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }

    // Make sure user is the tutor for this session
    if (session.tutor.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this session'
      });
    }

    // Check if meeting link is provided
    const { meetingLink } = req.body;
    if (!meetingLink) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a meeting link'
      });
    }

    // Update session
    session = await Session.findByIdAndUpdate(
      req.params.id,
      { meetingLink },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      data: session
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
};

// @desc    Get upcoming sessions
// @route   GET /api/v1/sessions/upcoming
// @access  Private
exports.getUpcomingSessions = async (req, res) => {
  try {
    console.log("Getting upcoming sessions for user:", req.user.id, "with role:", req.user.role);
    
    // Build the query based on user role
    let query;
    
    if (req.user.role === 'student') {
      query = {
        student: req.user.id
      };
    } else if (req.user.role === 'tutor') {
      query = {
        tutor: req.user.id
      };
    } else if (req.user.role === 'admin') {
      // Admins can see all sessions
      query = {};
    } else {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized role'
      });
    }
    
    // Use lean() for better performance 
    const sessions = await Session.find(query)
      .populate({
        path: 'student',
        select: 'name email', // Add any other fields you need
        model: 'Student'
      })
      .populate({
        path: 'tutor',
        select: 'name email expertise hourlyRate', // Add any other fields you need
        model: 'Tutor'
      })
      .sort('date startTime')
      .lean();
    
    console.log(`Found ${sessions.length} upcoming sessions`);
    
    // Log the first session for debugging if there are any
    if (sessions.length > 0) {
      console.log("Sample session:", {
        id: sessions[0]._id,
        subject: sessions[0].subject,
        hasStudent: !!sessions[0].student,
        hasTutor: !!sessions[0].tutor,
        studentType: sessions[0].student ? typeof sessions[0].student : 'none',
        tutorType: sessions[0].tutor ? typeof sessions[0].tutor : 'none'
      });
    }
    
    res.status(200).json({
      success: true,
      count: sessions.length,
      data: sessions
    });
  } catch (error) {
    console.error("Error in getUpcomingSessions:", error);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// Same improvement for session history
exports.getSessionHistory = async (req, res) => {
  try {
    console.log("Getting session history for user:", req.user.id, "with role:", req.user.role);
    
    // Build the query based on user role
    let query;
    const now = new Date();

    // If user is a student, get only their past sessions
    if (req.user.role === 'student') {
      query = {
        student: req.user.id,
        $or: [
          { date: { $lt: now } },
          { status: { $in: ['completed', 'cancelled', 'rejected'] } }
        ]
      };
    } 
    // If user is a tutor, get only their past sessions
    else if (req.user.role === 'tutor') {
      query = {
        tutor: req.user.id,
        $or: [
          { date: { $lt: now } },
          { status: { $in: ['completed', 'cancelled', 'rejected'] } }
        ]
      };
    } 
    // If user is an admin, get all past sessions
    else if (req.user.role === 'admin') {
      query = {
        $or: [
          { date: { $lt: now } },
          { status: { $in: ['completed', 'cancelled', 'rejected'] } }
        ]
      };
    } else {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized role'
      });
    }

    // Add population
    const sessions = await Session.find(query)
      .populate({
        path: 'student',
        select: 'name email',
        model: 'Student'
      })
      .populate({
        path: 'tutor',
        select: 'name email expertise hourlyRate',
        model: 'Tutor'
      })
      .sort({ date: -1 });

    console.log(`Found ${sessions.length} historical sessions`);
    
    res.status(200).json({
      success: true,
      count: sessions.length,
      data: sessions
    });
  } catch (err) {
    console.error("Error in getSessionHistory:", err);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// @desc    Get session history
// @route   GET /api/v1/sessions/history
// @access  Private
exports.getSessionHistory = async (req, res) => {
  try {
    let query;
    const now = new Date();

    // If user is a student, get only their past sessions
    if (req.user.role === 'student') {
      query = Session.find({
        student: req.user.id,
        $or: [
          { date: { $lt: now } },
          { status: { $in: ['completed', 'cancelled', 'rejected'] } }
        ]
      }).populate({
        path: 'tutor',
        select: 'name email'
      });
    } 
    // If user is a tutor, get only their past sessions
    else if (req.user.role === 'tutor') {
      query = Session.find({
        tutor: req.user.id,
        $or: [
          { date: { $lt: now } },
          { status: { $in: ['completed', 'cancelled', 'rejected'] } }
        ]
      }).populate({
        path: 'student',
        select: 'name email'
      });
    } 
    // If user is an admin, get all past sessions
    else if (req.user.role === 'admin') {
      query = Session.find({
        $or: [
          { date: { $lt: now } },
          { status: { $in: ['completed', 'cancelled', 'rejected'] } }
        ]
      })
      .populate({
        path: 'student',
        select: 'name email'
      })
      .populate({
        path: 'tutor',
        select: 'name email'
      });
    }

    // Sort by date descending
    query = query.sort({ date: -1 });

    // Execute query
    const sessions = await query.lean();
    
    // Check for missing user information
    for (const session of sessions) {
      if (req.user.role === 'student' && (!session.tutor || !session.tutor.name)) {
        console.log("Missing tutor info in history, fetching it");
        try {
          const tutor = await Tutor.findById(session.tutor).select('name email').lean();
          if (tutor) {
            session.tutor = tutor;
          }
        } catch (err) {
          console.error(`Error fetching tutor info for session ${session._id} in history:`, err);
        }
      } else if (req.user.role === 'tutor' && (!session.student || !session.student.name)) {
        console.log("Missing student info in history, fetching it");
        try {
          const student = await Student.findById(session.student).select('name email').lean();
          if (student) {
            session.student = student;
          }
        } catch (err) {
          console.error(`Error fetching student info for session ${session._id} in history:`, err);
        }
      }
    }

    res.status(200).json({
      success: true,
      count: sessions.length,
      data: sessions
    });
  } catch (err) {
    console.error("Error in getSessionHistory:", err);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};