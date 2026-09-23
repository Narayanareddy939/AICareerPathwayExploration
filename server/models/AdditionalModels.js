const mongoose = require('mongoose');

const counselorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  specialization: [String],
  experienceYears: Number,
  availableSlots: [String],
  rating: { type: Number, default: 4.9 },
  bio: String,
  createdAt: { type: Date, default: Date.now }
});

const mentorshipRequestSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  alumniId: String,
  studentName: String,
  studentEmail: String,
  alumniName: String,
  message: String,
  topic: { type: String, default: 'Career Guidance & Resume Review' },
  status: { type: String, enum: ['pending', 'accepted', 'completed', 'declined'], default: 'pending' },
  requestedAt: { type: Date, default: Date.now }
});

const progressSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', unique: true },
  skillsAcquired: [String],
  coursesCompleted: [String],
  milestonesPassed: [String],
  readinessScore: { type: Number, default: 50 },
  history: [{
    date: { type: Date, default: Date.now },
    readinessScore: Number,
    skillsCount: Number
  }],
  updatedAt: { type: Date, default: Date.now }
});

const marketInsightSchema = new mongoose.Schema({
  roleTitle: { type: String, required: true },
  category: String,
  activeJobOpenings: Number,
  topHiringCompanies: [String],
  topRequiredSkills: [String],
  salaryDistribution: {
    entry: String,
    mid: String,
    senior: String
  },
  yearOverYearGrowth: String,
  updatedAt: { type: Date, default: Date.now }
});

const dataSourceSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: String,
  recordCount: Number,
  description: String,
  lastProcessed: { type: Date, default: Date.now },
  status: { type: String, default: 'Active' }
});

module.exports = {
  Counselor: mongoose.model('Counselor', counselorSchema),
  MentorshipRequest: mongoose.model('MentorshipRequest', mentorshipRequestSchema),
  Progress: mongoose.model('Progress', progressSchema),
  MarketInsight: mongoose.model('MarketInsight', marketInsightSchema),
  DataSource: mongoose.model('DataSource', dataSourceSchema)
};
