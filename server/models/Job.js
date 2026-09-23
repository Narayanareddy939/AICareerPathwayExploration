const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  title: { type: String, required: true },
  company: { type: String, required: true },
  location: { type: String, default: 'Bengaluru, India' },
  salary: { type: String },
  type: { type: String, default: 'Full-time' },
  experience: { type: String, default: '0-2 years' },
  requiredSkills: [{ type: String }],
  description: { type: String },
  url: { type: String },
  postedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Job', jobSchema);
