const mongoose = require('mongoose');

const routeStopSubSchema = new mongoose.Schema({
  stop: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Stop',
    required: true
  },
  order: {
    type: Number,
    required: true
  },
  scheduledMinutesFromStart: {
    type: Number,
    required: true,
    default: 0
  },
  averageDelayMin: {
    type: Number,
    default: 1.5
  }
}, { _id: false });

const routeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  color: {
    type: String,
    default: '#0c87eb'
  },
  stops: [routeStopSubSchema],
  distance: {
    type: Number, // in kilometers
    required: true
  },
  estimatedTime: {
    type: Number, // in minutes
    required: true
  },
  buses: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bus'
  }],
  frequencyMinutes: {
    type: Number,
    default: 15
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Route', routeSchema);
