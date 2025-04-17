const mongoose = require('mongoose');
const User = require('./User.model');

const AdminSchema = new mongoose.Schema({
  permissions: {
    type: [String],
    enum: ['user_management', 'content_moderation', 'platform_analytics', 'full_access'],
    default: ['full_access']
  },
  adminLevel: {
    type: String,
    enum: ['junior', 'senior', 'super'],
    default: 'junior'
  },
  lastLogin: {
    type: Date,
    default: Date.now
  }
});

module.exports = User.discriminator('Admin', AdminSchema);
