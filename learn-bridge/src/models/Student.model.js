const mongoose = require('mongoose');
const User = require('./User.model');

const StudentSchema = new mongoose.Schema({
  learningGoals: {
    type: [String],
    default: []
  },
  preferredSubjects: {
    type: [String],
    default: []
  },
  availability: {
    type: [{
      day: {
        type: String,
        enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
        required: true
      },
      startTime: {
        type: String,
        required: true
      },
      endTime: {
        type: String,
        required: true
      }
    }],
    default: []
  },
  enrolledSessions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Session'
  }],
  enrolledCourses: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course'
  }]
});

module.exports = User.discriminator('Student', StudentSchema);
