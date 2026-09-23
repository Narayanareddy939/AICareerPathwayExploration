const mongoose = require('mongoose');

const roadmapSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  targetRole: { type: String, required: true },
  estimatedDurationMonths: { type: Number, default: 6 },
  phases: [{
    phaseNumber: Number,
    phaseName: String,
    durationWeeks: Number,
    focusAreas: [String],
    milestones: [{
      title: String,
      description: String,
      completed: { type: Boolean, default: false },
      skillsGained: [String],
      recommendedCourses: [String]
    }]
  }],
  status: { type: String, enum: ['active', 'completed', 'paused'], default: 'active' },
  progressPercentage: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Roadmap', roadmapSchema);
