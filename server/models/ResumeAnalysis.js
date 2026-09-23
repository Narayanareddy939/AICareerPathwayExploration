const mongoose = require('mongoose');

const resumeAnalysisSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  filename: String,
  overallScore: Number,
  extractedSkills: [String],
  recommendedRoles: [{
    role: String,
    matchPercentage: Number,
    missingSkills: [String]
  }],
  strengths: [String],
  improvements: [String],
  atsCompatibility: {
    score: Number,
    formattingIssues: [String],
    keywordMatches: [String]
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ResumeAnalysis', resumeAnalysisSchema);
