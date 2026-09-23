const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  title: { type: String, required: true },
  provider: { type: String, default: 'Coursera' },
  rating: { type: Number, default: 4.8 },
  difficulty: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced', 'Mixed'], default: 'Beginner' },
  certificateType: { type: String, default: 'Specialization' },
  skills: [{ type: String }],
  url: { type: String },
  duration: { type: String, default: '3-6 months' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Course', courseSchema);
