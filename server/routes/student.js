const express = require('express');
const Student = require('../models/Student');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Helper to sanitize student data and prevent Mongoose cast/enum errors on empty strings
const cleanStudentData = (data) => {
  const cleaned = {};

  const stringFields = ['fullName', 'email', 'phone', 'address', 'university', 'branch', 'department', 'careerGoal'];
  stringFields.forEach(field => {
    if (data[field] !== undefined && data[field] !== null && data[field] !== '') {
      cleaned[field] = String(data[field]).trim();
    }
  });

  if (['Male', 'Female', 'Other', 'Prefer not to say'].includes(data.gender)) {
    cleaned.gender = data.gender;
  }

  if (data.dateOfBirth && data.dateOfBirth !== '') {
    const dob = new Date(data.dateOfBirth);
    if (!isNaN(dob.getTime())) {
      cleaned.dateOfBirth = dob;
    }
  }

  if (data.semester !== undefined && data.semester !== null && data.semester !== '') {
    const num = Number(data.semester);
    if (!isNaN(num)) cleaned.semester = num;
  }

  if (data.graduationYear !== undefined && data.graduationYear !== null && data.graduationYear !== '') {
    const num = Number(data.graduationYear);
    if (!isNaN(num)) cleaned.graduationYear = num;
  }

  if (data.cgpa !== undefined && data.cgpa !== null && data.cgpa !== '') {
    const num = Number(data.cgpa);
    if (!isNaN(num)) cleaned.cgpa = num;
  }

  if (Array.isArray(data.skills)) {
    cleaned.skills = data.skills.filter(s => typeof s === 'string' && s.trim());
  }

  if (Array.isArray(data.interests)) {
    cleaned.interests = data.interests.filter(i => typeof i === 'string' && i.trim());
  }

  if (Array.isArray(data.preferredLocation)) {
    cleaned.preferredLocation = data.preferredLocation.filter(l => typeof l === 'string' && l.trim());
  }

  return cleaned;
};

// POST /api/student/profile — create or update profile
router.post('/profile', protect, async (req, res) => {
  try {
    const userId = req.user._id;
    const cleanedData = cleanStudentData(req.body);
    cleanedData.userId = userId;

    let student = await Student.findOne({ userId });

    if (student) {
      Object.assign(student, cleanedData);
      student.updatedAt = new Date();
      await student.save();
    } else {
      student = await Student.create(cleanedData);
    }

    // Sync User profileCompleted status
    await User.findByIdAndUpdate(userId, { profileCompleted: student.profileComplete });

    res.json({
      success: true,
      message: 'Profile saved successfully',
      student,
      profileCompletionPercent: student.profileCompletionPercent,
      profileComplete: student.profileComplete
    });
  } catch (err) {
    console.error('Save profile error:', err);
    res.status(500).json({ success: false, message: err.message || 'Failed to save profile' });
  }
});

// GET /api/student/profile
router.get('/profile', protect, async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user._id });
    if (!student) {
      return res.json({ success: true, student: null, profileComplete: false });
    }
    res.json({ success: true, student, profileCompletionPercent: student.profileCompletionPercent });
  } catch (err) {
    console.error('Get profile error:', err);
    res.status(500).json({ success: false, message: 'Failed to get profile' });
  }
});

// PUT /api/student/profile — partial update
router.put('/profile', protect, async (req, res) => {
  try {
    const userId = req.user._id;
    const cleanedData = cleanStudentData(req.body);

    let student = await Student.findOne({ userId });

    if (!student) {
      return res.status(404).json({ success: false, message: 'Profile not found' });
    }

    Object.assign(student, cleanedData);
    student.updatedAt = new Date();
    await student.save();

    await User.findByIdAndUpdate(userId, { profileCompleted: student.profileComplete });

    res.json({ success: true, message: 'Profile updated', student, profileCompletionPercent: student.profileCompletionPercent });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ success: false, message: err.message || 'Failed to update profile' });
  }
});

module.exports = router;

