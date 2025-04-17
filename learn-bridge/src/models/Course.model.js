const mongoose = require('mongoose');

const CourseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add a course title'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Please add a course description'],
    maxlength: [1000, 'Description cannot be more than 1000 characters']
  },
  duration: {
    type: Number,
    required: [true, 'Please add course duration in weeks'],
    min: [1, 'Duration must be at least 1 week']
  },
  timings: [{
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
  tutor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tutor',
    required: true
  },
  enrolledStudents: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student'
  }],
  maxStudents: {
    type: Number,
    default: 20
  },
  subject: {
    type: String,
    required: [true, 'Please add a subject for the course']
  },
  level: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced'],
    default: 'Beginner'
  },
  startDate: {
    type: Date,
    required: [true, 'Please add a start date for the course']
  },
  endDate: {
    type: Date,
    required: [true, 'Please add an end date for the course']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for calculating available spots
CourseSchema.virtual('availableSpots').get(function() {
  return this.maxStudents - this.enrolledStudents.length;
});

// Index for faster queries
CourseSchema.index({ subject: 1, level: 1 });
CourseSchema.index({ tutor: 1 });
CourseSchema.index({ startDate: 1 });

module.exports = mongoose.model('Course', CourseSchema);
