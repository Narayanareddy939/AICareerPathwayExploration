const mongoose = require('mongoose');

const careerSchema = new mongoose.Schema({
  title: { type: String, required: true, unique: true },
  category: { type: String, default: 'Technology' },
  description: { type: String },
  requiredSkills: [{ type: String }],
  averageSalary: { type: String },
  growthRate: { type: String },
  educationRequirements: { type: String },
  experienceLevel: { type: String },
  relatedRoles: [{ type: String }],
  demandIndex: { type: Number, default: 85 },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Career', careerSchema);
