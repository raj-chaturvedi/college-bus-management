const mongoose = require('mongoose');

const busSchema = new mongoose.Schema({
  busNumber: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  plateNumber: {
    type: String,
    default: ''
  },
  capacity: {
    type: Number,
    required: true,
    default: 50
  },
  currentPassengers: {
    type: Number,
    default: 0
  },
  currentLocation: {
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    heading: { type: Number, default: 0 },
    speed: { type: Number, default: 35 } // km/h
  },
  route: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Route',
    default: null
  },
  driver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Driver',
    default: null
  },
  status: {
    type: String,
    enum: ['active', 'idle', 'delayed', 'maintenance'],
    default: 'active'
  },
  currentStopIndex: {
    type: Number,
    default: 0
  },
  delayMinutes: {
    type: Number,
    default: 0
  },
  nextStopEtaMinutes: {
    type: Number,
    default: 5
  },
  direction: {
    type: String,
    enum: ['outbound', 'inbound'],
    default: 'outbound'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for occupancy percentage
busSchema.virtual('occupancyPercentage').get(function() {
  if (!this.capacity || this.capacity <= 0) return 0;
  return Math.min(100, Math.round((this.currentPassengers / this.capacity) * 100));
});

// Virtual for crowd level
busSchema.virtual('crowdLevel').get(function() {
  const occ = this.occupancyPercentage;
  if (occ < 50) return 'LOW';
  if (occ <= 80) return 'MEDIUM';
  return 'HIGH';
});

module.exports = mongoose.model('Bus', busSchema);
