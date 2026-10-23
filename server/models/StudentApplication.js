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
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    default: null,
    index: true
  },
  status: {
    type: String,
    enum: [
      'interested',
      'applied',
      'under_review',
      'shortlisted',
      'interview_scheduled',
      'selected',
      'rejected',
      'withdrawn',
      // backward compatibility with earlier statuses:
      'assessment',
      'interview',
      'offered'
    ],
    default: 'interested',
    index: true
  },
  savedAt: {
    type: Date,
    default: Date.now
  },
  appliedAt: {
    type: Date,
    default: null
  },
  resumePath: {
    type: String,
    trim: true,
    default: null
  },
  resumeOriginalName: {
    type: String,
    trim: true,
    default: null
  },
  coverNote: {
    type: String,
    trim: true,
    maxlength: 3000,
    default: null
  },
  notes: {
    type: String,
    trim: true,
    maxlength: 2000,
    default: null
  },
  applicantData: {
    fullName: { type: String, trim: true },
    email: { type: String, trim: true },
    phone: { type: String, trim: true },
    university: { type: String, trim: true },
    branch: { type: String, trim: true },
    cgpa: { type: Number, default: null },
    graduationYear: { type: Number, default: null },
    skills: [{ type: String, trim: true }]
  },
  statusHistory: [{
    status: { type: String, required: true },
    changedAt: { type: Date, default: Date.now },
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    note: { type: String, default: null }
  }]
}, {
  timestamps: true
});

// Prevent duplicate application / save per student per job
studentApplicationSchema.index({ studentId: 1, jobId: 1 }, { unique: true });
// Fast recruiter query indexes
studentApplicationSchema.index({ companyId: 1, status: 1 });
studentApplicationSchema.index({ jobId: 1, status: 1 });

module.exports = mongoose.model('StudentApplication', studentApplicationSchema);
