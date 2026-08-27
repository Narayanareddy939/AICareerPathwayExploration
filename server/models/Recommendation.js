const mongoose = require('mongoose');

const recommendationSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Career match result
  careerMatchScore: { type: Number, default: 0 },
  placementReadiness: { type: Number, default: 0 },
  predictedRole: { type: String },
  predictedSalaryRange: { type: String },
  targetDomain: { type: String },

  // Gaps and recommendations
  recommendedRoles: [{ type: String }],
  missingSkills: [{ type: String }],
  recommendedSkills: [{ type: String }],
  recommendedCourses: [{ type: String }],
  recommendedProjects: [{ type: String }],
  certifications: [{ type: String }],

  // Roadmap
  roadmap: [{
    phase: String,
    title: String,
    description: String,
    skillsToLearn: [String],
    duration: String
  }],

  // Higher studies
  higherStudiesSuggestion: { type: String },

  // Alumni matches
  matchedAlumni: [{
    name: String,
    company: String,
    role: String,
    similarity: Number
  }],

  // Raw Gemini response
  geminiSummary: { type: String },

  generatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Recommendation', recommendationSchema);
