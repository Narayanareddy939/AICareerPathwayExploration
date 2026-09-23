const mongoose = require('mongoose');

const skillSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  category: { type: String, default: 'Technical' },
  demandLevel: { type: String, enum: ['Moderate', 'High', 'Very High', 'Critical'], default: 'High' },
  aliases: [{ type: String }],
  description: { type: String },
  relatedCareers: [{ type: String }],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Skill', skillSchema);
