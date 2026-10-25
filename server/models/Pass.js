const mongoose = require('mongoose');

const passSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  studentName: { type: String, required: true },
  studentEmail: { type: String, required: true },
  bus: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bus',
    required: true
  },
  busNumber: { type: String, required: true },
  route: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Route'
  },
  routeName: { type: String, required: true },
  fromStop: { type: String, required: true },
  toStop: { type: String, required: true },
  passCode: { type: String, required: true, unique: true },
  plateNumber: { type: String, default: 'UP-16-CB-1012' },
  seatNumber: { type: String, default: 'Unassigned (General Seating)' },
  tokenHash: { type: String },
  fareStatus: { type: String, default: 'PAID (Student Subsidized)' },
  status: {
    type: String,
    enum: ['active', 'used', 'expired'],
    default: 'active'
  },
  validUntil: {
    type: Date,
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Pass', passSchema);
