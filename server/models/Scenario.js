const mongoose = require('mongoose');

const scenarioSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  scenarioName: { type: String, required: true },
  targetRole: { type: String, required: true },
  matchScore: Number,
  estimatedSalary: String,
  timeToReadyMonths: Number,
  keySkillGaps: [String],
  riskLevel: { type: String, enum: ['Low', 'Moderate', 'High'], default: 'Moderate' },
  alumniInRoleCount: Number,
  notes: String,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Scenario', scenarioSchema);
