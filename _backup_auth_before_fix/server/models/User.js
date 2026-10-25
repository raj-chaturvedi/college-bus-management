const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    unique: true,
    sparse: true,
    lowercase: true,
    trim: true
  },
  name: {
    type: String,
    trim: true,
    default: function() {
      return this.username || 'Transit Commuter';
    }
  },
  email: {
    type: String,
    unique: true,
    sparse: true,
    lowercase: true,
    trim: true,
    default: null
  },
  recoveryEmail: {
    type: String,
    lowercase: true,
    trim: true,
    default: null
  },
  authProvider: {
    type: String,
    enum: ['local', 'google'],
    default: 'local'
  },
  googleId: {
    type: String,
    sparse: true,
    default: null
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['student', 'admin'],
    default: 'student'
  },
  preferences: {
    mode: {
      type: String,
      enum: ['BALANCED', 'FASTEST', 'LEAST_WALKING', 'LEAST_CROWDED', 'NO_TRANSFERS', 'LEAST_WAITING', 'MOST_RELIABLE'],
      default: 'BALANCED'
    },
    travelTimePriority: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH'], default: 'MEDIUM' },
    walkingPriority: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH'], default: 'HIGH' },
    crowdPriority: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH'], default: 'HIGH' },
    waitingPriority: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH'], default: 'MEDIUM' },
    reliabilityPriority: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH'], default: 'HIGH' },
    maxWalkingMeters: { type: Number, default: 800 },
    maxWaitMinutes: { type: Number, default: 20 },
    avoidTransfers: { type: Boolean, default: false }
  },
  favoriteRoutes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Route'
  }],
  favoriteBuses: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bus'
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationToken: {
    type: String,
    default: null
  },
  verificationTokenExpires: {
    type: Date,
    default: null
  },
  verificationCode: {
    type: String,
    default: null
  },
  verificationCodeExpires: {
    type: Date,
    default: null
  },
  resetPasswordToken: {
    type: String,
    default: null
  },
  resetPasswordExpires: {
    type: Date,
    default: null
  },
  studentId: {
    type: String,
    default: ''
  },
  department: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('User', userSchema);
