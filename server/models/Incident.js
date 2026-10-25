const mongoose = require('mongoose');

const incidentSchema = new mongoose.Schema({
  reportedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reporterName: { type: String, default: 'Campus Commuter' },
  type: {
    type: String,
    enum: ['traffic_jam', 'mechanical_issue', 'delay', 'overcrowding', 'lost_item', 'emergency'],
    default: 'traffic_jam'
  },
  title: { type: String, required: true },
  description: { type: String, required: true },
  bus: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bus'
  },
  busNumber: { type: String },
  route: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Route'
  },
  stop: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Stop'
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  delayAddedMinutes: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ['open', 'investigating', 'resolved'],
    default: 'open'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Incident', incidentSchema);
