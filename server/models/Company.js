const mongoose = require('mongoose');

const companySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Company name is required'],
    trim: true,
    index: true
  },
  normalizedName: {
    type: String,
    trim: true,
    lowercase: true,
    unique: true,
    index: true
  },
  officialWebsite: {
    type: String,
    trim: true,
    default: null
  },
  careersUrl: {
    type: String,
    trim: true,
    default: null
  },
  logoUrl: {
    type: String,
    trim: true,
    default: null
  },
  industry: {
    type: String,
    trim: true,
    default: null
  },
  description: {
    type: String,
    trim: true,
    default: null
  },
  headquarters: {
    type: String,
    trim: true,
    default: null
  },
  officialSourceUrl: {
    type: String,
    trim: true,
    default: null
  },
  locations: [{
    type: String,
    trim: true
  }],
  verificationStatus: {
    type: String,
    enum: ['imported', 'pending_review', 'source_checked', 'officially_verified', 'verification_unavailable', 'rejected'],
    default: 'imported'
  },
  lastVerifiedAt: {
    type: Date,
    default: null
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  }
}, {
  timestamps: true
});

// Pre-save hook to auto-generate normalizedName
companySchema.pre('save', function (next) {
  if (this.isModified('name') || !this.normalizedName) {
    this.normalizedName = this.name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
  }
  next();
});

// Text index for search
companySchema.index({ name: 'text', industry: 'text', description: 'text' });

module.exports = mongoose.model('Company', companySchema);
