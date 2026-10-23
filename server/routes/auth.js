const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Company = require('../models/Company');
const { protect } = require('../middleware/auth');

const router = express.Router();

const signToken = (id) => {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET || 'ai_carrier_secret_fallback',
    { expiresIn: '365d' }
  );
};

// POST /api/auth/register — Student registration
router.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    const studentName = req.body.fullName || req.body.name;
    const confirm = req.body.confirmPassword || req.body.password;

    // Validation
    if (!studentName || !email || !password) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    if (password.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters' });
    }

    if (req.body.confirmPassword && password !== req.body.confirmPassword) {
      return res.status(400).json({ success: false, message: 'Passwords do not match' });
    }

    // Check existing user
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists' });
    }

    // Create user (role defaults to student)
    const user = await User.create({
      fullName: studentName.trim(),
      email: email.toLowerCase().trim(),
      password,
      role: 'student'
    });

    res.status(201).json({
      success: true,
      message: 'Registration successful! Please login to continue.',
      userId: user._id
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ success: false, message: 'Server error during registration' });
  }
});

// POST /api/auth/company-register — Company Owner / Recruiter registration
router.post('/company-register', async (req, res) => {
  try {
    const {
      fullName,
      email,
      password,
      confirmPassword,
      companyName,
      description,
      industry,
      officialWebsite,
      location,
      contactPhone,
      contactEmail,
      logoUrl
    } = req.body;

    const recruiterName = fullName || req.body.name;

    // Field validations
    if (!recruiterName || !recruiterName.trim()) {
      return res.status(400).json({ success: false, message: 'Recruiter / Owner name is required' });
    }
    if (!email || !email.trim()) {
      return res.status(400).json({ success: false, message: 'Work email is required' });
    }
    if (!password || password.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters' });
    }
    if (confirmPassword && password !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'Passwords do not match' });
    }
    if (!companyName || !companyName.trim()) {
      return res.status(400).json({ success: false, message: 'Company name is required' });
    }

    // Check existing user email
    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists' });
    }

    // Check existing company by name or normalized name
    const normalized = companyName.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
    let existingCompany = await Company.findOne({
      $or: [
        { normalizedName: normalized },
        { name: { $regex: new RegExp(`^${companyName.trim()}$`, 'i') } }
      ]
    });

    if (existingCompany && existingCompany.createdBy) {
      return res.status(400).json({
        success: false,
        message: 'This company name is already registered by another recruiter account. If this is your company, please contact support.'
      });
    }

    // 1. Create Recruiter User
    const user = await User.create({
      fullName: recruiterName.trim(),
      email: email.toLowerCase().trim(),
      password,
      role: 'recruiter',
      profileCompleted: true
    });

    // 2. Create or link Company Profile
    let company;
    if (existingCompany) {
      // Claim unowned company record
      existingCompany.createdBy = user._id;
      existingCompany.description = description?.trim() || existingCompany.description;
      existingCompany.industry = industry?.trim() || existingCompany.industry;
      existingCompany.officialWebsite = officialWebsite?.trim() || existingCompany.officialWebsite;
      existingCompany.headquarters = location?.trim() || existingCompany.headquarters;
      existingCompany.contactEmail = contactEmail?.trim() || email.toLowerCase().trim();
      existingCompany.contactPhone = contactPhone?.trim() || null;
      existingCompany.verificationStatus = 'pending_review';
      if (logoUrl) existingCompany.logoUrl = logoUrl;
      await existingCompany.save();
      company = existingCompany;
    } else {
      company = await Company.create({
        name: companyName.trim(),
        normalizedName: normalized,
        description: description?.trim() || null,
        industry: industry?.trim() || 'Technology',
        officialWebsite: officialWebsite?.trim() || null,
        headquarters: location?.trim() || null,
        locations: location?.trim() ? [location.trim()] : [],
        contactEmail: contactEmail?.trim() || email.toLowerCase().trim(),
        contactPhone: contactPhone?.trim() || null,
        logoUrl: logoUrl || null,
        verificationStatus: 'pending_review',
        status: 'active',
        createdBy: user._id
      });
    }

    // 3. Link companyId to user
    user.companyId = company._id;
    await user.save();

    // 4. Issue JWT Token
    const token = signToken(user._id);

    return res.status(201).json({
      success: true,
      message: 'Company registration successful! Your profile is pending administrator verification.',
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        companyId: company._id,
        profileCompleted: true
      },
      company: {
        _id: company._id,
        name: company.name,
        verificationStatus: company.verificationStatus,
        status: company.status,
        industry: company.industry,
        headquarters: company.headquarters,
        officialWebsite: company.officialWebsite,
        logoUrl: company.logoUrl
      }
    });
  } catch (err) {
    console.error('Company register error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Server error during company registration' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    // Verify password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    // If recruiter or company, load company record
    let company = null;
    if (user.role === 'recruiter' || user.role === 'company') {
      if (user.companyId) {
        company = await Company.findById(user.companyId).lean();
      } else {
        company = await Company.findOne({ createdBy: user._id }).lean();
        if (company) {
          user.companyId = company._id;
          await user.save();
        }
      }
    }

    // Issue JWT
    const token = signToken(user._id);

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        profileCompleted: user.profileCompleted,
        companyId: user.companyId || (company ? company._id : null),
        company: company ? {
          _id: company._id,
          name: company.name,
          verificationStatus: company.verificationStatus,
          status: company.status,
          industry: company.industry,
          headquarters: company.headquarters,
          officialWebsite: company.officialWebsite,
          logoUrl: company.logoUrl
        } : null
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'Server error during login' });
  }
});

// GET /api/auth/me — get current authenticated user
router.get('/me', protect, async (req, res) => {
  try {
    const user = req.user;
    let company = null;

    if (user.role === 'recruiter' || user.role === 'company') {
      if (user.companyId) {
        company = await Company.findById(user.companyId).lean();
      } else {
        company = await Company.findOne({ createdBy: user._id }).lean();
      }
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        profileCompleted: user.profileCompleted,
        companyId: user.companyId || (company ? company._id : null),
        company: company ? {
          _id: company._id,
          name: company.name,
          verificationStatus: company.verificationStatus,
          status: company.status,
          industry: company.industry,
          headquarters: company.headquarters,
          officialWebsite: company.officialWebsite,
          logoUrl: company.logoUrl
        } : null
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
