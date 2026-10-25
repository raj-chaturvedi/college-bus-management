const mongoose = require('mongoose');

const occupancyRecordSchema = new mongoose.Schema({
  bus: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bus',
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  passengerCount: {
    type: Number,
    required: true
  },
  occupancyPercentage: {
    type: Number,
    required: true
  },
  hourOfDay: {
    type: Number, // 0 - 23
    required: true
  },
  dayOfWeek: {
    type: Number, // 0 (Sun) - 6 (Sat)
    required: true
  },
  stop: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Stop',
    default: null
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('OccupancyRecord', occupancyRecordSchema);
