const mongoose = require('mongoose');
const User = require('./User.model');

const TutorSchema = new mongoose.Schema({
  expertise: {
    type: [String],
    required: [true, 'Please add at least one subject of expertise']
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
  hourlyRate: {
    type: Number,
    default: 0
  },
  education: {
    type: String,
    required: [true, 'Please add your educational background']
  },
  experience: {
    type: Number,
    default: 0,
    description: 'Experience in years'
  },
  averageRating: {
    type: Number,
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating cannot be more than 5'],
    default: 2
  },
  totalReviews: {
    type: Number,
    default: 0
  },
  sessions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Session'
  }],
  courses: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course'
  }]
});

// Virtual for reviews
TutorSchema.virtual('reviews', {
  ref: 'Review',
  localField: '_id',
  foreignField: 'tutor',
  justOne: false
});

module.exports = User.discriminator('Tutor', TutorSchema);
