const mongoose = require('mongoose');

const driverSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  licenseNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  assignedBus: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bus',
    default: null
  },
  experienceYears: {
    type: Number,
    default: 5
  },
  safetyRating: {
    type: Number,
    default: 4.8
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Driver', driverSchema);
