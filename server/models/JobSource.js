const mongoose = require('mongoose');

const jobSourceSchema = new mongoose.Schema({
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PortalJob',
    required: true,
    index: true
  },
  provider: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  externalId: {
    type: String,
    trim: true,
    default: null
  },
  originalUrl: {
    type: String,
    trim: true,
    default: null
  },
  sourceType: {
    type: String,
    enum: ['api_import', 'official_feed', 'manual_entry', 'placement_notice', 'other'],
    default: 'api_import'
  },
  firstImportedAt: {
    type: Date,
    default: Date.now
  },
  lastSyncedAt: {
    type: Date,
    default: null
  },
  lastVerifiedAt: {
    type: Date,
    default: null
  },
  verificationOutcome: {
    type: String,
    enum: ['not_checked', 'confirmed', 'changed', 'removed', 'error'],
    default: 'not_checked'
  },
  sourceMetadata: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  syncErrors: [{
    timestamp: { type: Date, default: Date.now },
    message: { type: String },
    code: { type: String, default: null }
  }]
}, {
  timestamps: true
});

jobSourceSchema.index({ provider: 1, externalId: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('JobSource', jobSourceSchema);
