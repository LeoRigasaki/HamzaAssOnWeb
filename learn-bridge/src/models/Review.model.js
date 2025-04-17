const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema({
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
  session: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Session',
    required: true
  },
  rating: {
    type: Number,
    required: [true, 'Please add a rating between 1 and 5'],
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    maxlength: [500, 'Review comment cannot be more than 500 characters']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Prevent user from submitting more than one review per session
ReviewSchema.index({ student: 1, session: 1 }, { unique: true });

// Static method to calculate average rating of a tutor
ReviewSchema.statics.getAverageRating = async function(tutorId) {
  const obj = await this.aggregate([
    {
      $match: { tutor: tutorId }
    },
    {
      $group: {
        _id: '$tutor',
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 }
      }
    }
  ]);

  try {
    if (obj[0]) {
      await this.model('Tutor').findByIdAndUpdate(tutorId, {
        averageRating: Math.round(obj[0].averageRating * 10) / 10,
        totalReviews: obj[0].totalReviews
      });
    } else {
      await this.model('Tutor').findByIdAndUpdate(tutorId, {
        averageRating: 0,
        totalReviews: 0
      });
    }
  } catch (err) {
    console.error(err);
  }
};

// Call getAverageRating after save
ReviewSchema.post('save', function() {
  this.constructor.getAverageRating(this.tutor);
});

// Call getAverageRating after remove
ReviewSchema.post('remove', function() {
  this.constructor.getAverageRating(this.tutor);
});

module.exports = mongoose.model('Review', ReviewSchema);
