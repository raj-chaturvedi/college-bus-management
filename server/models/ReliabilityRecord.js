const mongoose = require('mongoose');

const reliabilityRecordSchema = new mongoose.Schema({
  bus: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bus',
    required: true
  },
  route: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Route',
    required: true
  },
  delay: {
    type: Number, // in minutes (0 or positive for delay, negative for early)
    required: true,
    default: 0
  },
  onTime: {
    type: Boolean,
    required: true,
    default: true
  },
  tripStatus: {
    type: String,
    enum: ['on_time', 'delayed', 'cancelled', 'early'],
    default: 'on_time'
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('ReliabilityRecord', reliabilityRecordSchema);
