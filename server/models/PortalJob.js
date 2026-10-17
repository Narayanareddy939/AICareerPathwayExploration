const mongoose = require('mongoose');

const portalJobSchema = new mongoose.Schema({
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    default: null,
    index: true
  },
  companyName: {
    type: String,
    required: [true, 'Company name is required'],
    trim: true
  },
  title: {
    type: String,
    required: [true, 'Job title is required'],
    trim: true,
    index: true
  },
  normalizedTitle: {
    type: String,
    trim: true,
    lowercase: true,
    index: true
  },
  description: {
    type: String,
    trim: true,
    default: null
  },
  responsibilities: [{
    type: String,
    trim: true
  }],
  requiredSkills: [{
    type: String,
    trim: true
  }],
  preferredSkills: [{
    type: String,
    trim: true
  }],
  employmentType: {
    type: String,
    enum: ['full_time', 'part_time', 'contract', 'internship', 'freelance', 'other'],
    default: 'full_time'
  },
  experienceLevel: {
    type: String,
    enum: ['fresher', 'entry', 'mid', 'senior', 'lead', 'executive', 'not_specified'],
    default: 'not_specified'
  },
  // Eligibility criteria
  eligibleDegrees: [{
    type: String,
    trim: true
  }],
  eligibleBranches: [{
    type: String,
    trim: true
  }],
  eligibleGraduationYears: [{
    type: Number
  }],
  minimumCGPA: {
    type: Number,
    min: 0,
    max: 10,
    default: null
  },
  backlogCriteria: {
    type: String,
    trim: true,
    default: null
  },
  // Location
  location: {
    type: String,
    trim: true,
    default: null
  },
  workMode: {
    type: String,
    enum: ['onsite', 'remote', 'hybrid', 'not_specified'],
    default: 'not_specified'
  },
  // Salary
  salaryMin: {
    type: Number,
    default: null
  },
  salaryMax: {
    type: Number,
    default: null
  },
  salaryCurrency: {
    type: String,
    default: 'INR'
  },
  salaryPeriod: {
    type: String,
    enum: ['annual', 'monthly', 'hourly', 'not_specified'],
    default: 'not_specified'
  },
  salaryDisclosureStatus: {
    type: String,
    enum: ['disclosed', 'undisclosed', 'predicted'],
    default: 'undisclosed'
  },
  benefits: [{
    type: String,
    trim: true
  }],
  // Bond
  bondStatus: {
    type: String,
    enum: ['no_bond', 'has_bond', 'not_disclosed'],
    default: 'not_disclosed'
  },
  bondDuration: {
    type: String,
    default: null
  },
  bondTerms: {
    type: String,
    default: null
  },
  bondSource: {
    type: String,
    default: null
  },
  // Hiring stages
  hiringStages: [{
    type: String,
    trim: true
  }],
  // Dates
  postedAt: {
    type: Date,
    default: null
  },
  applicationDeadline: {
    type: Date,
    default: null
  },
  applicationUrl: {
    type: String,
    trim: true,
    default: null
  },
  // Source tracking
  sourceType: {
    type: String,
    enum: ['adzuna', 'official_employer', 'placement_cell', 'manual_admin', 'other'],
    default: 'manual_admin'
  },
  sourceName: {
    type: String,
    trim: true,
    default: null
  },
  sourceUrl: {
    type: String,
    trim: true,
    default: null
  },
  externalJobId: {
    type: String,
    trim: true,
    default: null,
    index: true
  },
  // Verification
  verificationStatus: {
    type: String,
    enum: ['imported', 'pending_review', 'source_checked', 'officially_verified', 'verification_unavailable', 'expired', 'closed', 'rejected'],
    default: 'imported'
  },
  lastVerifiedAt: {
    type: Date,
    default: null
  },
  lastSyncedAt: {
    type: Date,
    default: null
  },
  expiresAt: {
    type: Date,
    default: null
  },
  status: {
    type: String,
    enum: ['active', 'closed', 'expired', 'draft', 'archived'],
    default: 'active',
    index: true
  },
  isDemonstration: {
    type: Boolean,
    default: false,
    index: true
  },
  // Admin tracking
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  }
}, {
  timestamps: true
});

// Pre-save hook: normalize title, check deadline expiry
portalJobSchema.pre('save', function (next) {
  if (this.isModified('title') || !this.normalizedTitle) {
    this.normalizedTitle = this.title.toLowerCase().replace(/[^a-z0-9\s]+/g, '').trim();
  }
  // Auto-expire if deadline has passed
  if (this.applicationDeadline && new Date(this.applicationDeadline) < new Date() && this.status === 'active') {
    this.status = 'expired';
  }
  next();
});

// Compound unique index to prevent duplicate imports from same provider (only when externalJobId is present)
portalJobSchema.index(
  { externalJobId: 1, sourceType: 1 },
  { unique: true, partialFilterExpression: { externalJobId: { $type: 'string' } } }
);
// Text search
portalJobSchema.index({ title: 'text', companyName: 'text', description: 'text', location: 'text' });
// Common query indexes
portalJobSchema.index({ status: 1, employmentType: 1, experienceLevel: 1 });
portalJobSchema.index({ companyId: 1, status: 1 });
portalJobSchema.index({ applicationDeadline: 1 });
portalJobSchema.index({ postedAt: -1 });

module.exports = mongoose.model('PortalJob', portalJobSchema);
