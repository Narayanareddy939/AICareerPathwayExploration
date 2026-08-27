const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  // Personal Information
  fullName: { type: String, trim: true },
  email: { type: String, lowercase: true, trim: true },
  phone: { type: String, trim: true },
  gender: { type: String, enum: ['Male', 'Female', 'Other', 'Prefer not to say'] },
  dateOfBirth: { type: Date },
  address: { type: String, trim: true },

  // Academic Information
  university: { type: String, trim: true },
  branch: { type: String, trim: true },
  department: { type: String, trim: true },
  semester: { type: Number, min: 1, max: 10 },
  graduationYear: { type: Number },
  cgpa: { type: Number, min: 0, max: 10 },

  // Career Profile
  skills: [{ type: String, trim: true }],
  interests: [{ type: String, trim: true }],
  careerGoal: { type: String, trim: true },
  preferredLocation: [{ type: String, trim: true }],

  // Resume
  resumePath: { type: String, default: null },
  resumeOriginalName: { type: String, default: null },
  resumeUploadedAt: { type: Date, default: null },

  // Profile tracking
  profileComplete: { type: Boolean, default: false },
  profileCompletionPercent: { type: Number, default: 0 },

  // Timestamps
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Calculate profile completion percentage before save
studentSchema.pre('save', function (next) {
  const fields = [
    this.fullName, this.phone, this.gender, this.university,
    this.branch, this.semester, this.cgpa, this.careerGoal,
    this.skills?.length > 0, this.interests?.length > 0
  ];
  const filled = fields.filter(Boolean).length;
  this.profileCompletionPercent = Math.round((filled / fields.length) * 100);
  this.profileComplete = this.profileCompletionPercent >= 80;
  next();
});

module.exports = mongoose.model('Student', studentSchema);
