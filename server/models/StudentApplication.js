const mongoose = require('mongoose');

const studentApplicationSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PortalJob',
    required: true,
    index: true
  },
  status: {
    type: String,
    enum: ['interested', 'applied', 'assessment', 'interview', 'offered', 'rejected', 'withdrawn'],
    default: 'interested'
  },
  savedAt: {
    type: Date,
    default: Date.now
  },
  appliedAt: {
    type: Date,
    default: null
  },
  notes: {
    type: String,
    trim: true,
    maxlength: 2000,
    default: null
  },
  statusHistory: [{
    status: { type: String },
    changedAt: { type: Date, default: Date.now },
    note: { type: String, default: null }
  }]
}, {
  timestamps: true
});

// Prevent duplicate saves: one application record per student per job
studentApplicationSchema.index({ studentId: 1, jobId: 1 }, { unique: true });

module.exports = mongoose.model('StudentApplication', studentApplicationSchema);
