const mongoose = require('mongoose');

const alumniSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String },
  graduationYear: { type: Number, required: true },
  branch: { type: String, required: true },
  currentCompany: { type: String, required: true },
  role: { type: String, required: true },
  cgpa: { type: Number },
  location: { type: String },
  skills: [{ type: String }],
  bio: { type: String },
  linkedin: { type: String },
  mentorshipAvailable: { type: Boolean, default: true },
  careerTrajectory: [{
    company: String,
    role: String,
    years: String,
    highlights: String
  }],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Alumni', alumniSchema);
