const mongoose = require('mongoose');

const SessionSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  tutor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tutor',
    required: true
  },
  subject: {
    type: String,
    required: [true, 'Please add a subject for the session']
  },
  date: {
    type: Date,
    required: [true, 'Please add a date for the session']
  },
  startTime: {
    type: String,
    required: [true, 'Please add a start time for the session']
  },
  endTime: {
    type: String,
    required: [true, 'Please add an end time for the session']
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'completed', 'cancelled'],
    default: 'pending'
  },
  notes: {
    type: String,
    maxlength: [500, 'Notes cannot be more than 500 characters']
  },
  meetingLink: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for messages related to this session
SessionSchema.virtual('messages', {
  ref: 'Message',
  localField: '_id',
  foreignField: 'session',
  justOne: false
});

module.exports = mongoose.model('Session', SessionSchema);
