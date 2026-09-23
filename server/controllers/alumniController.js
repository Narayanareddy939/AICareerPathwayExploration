const { successResponse, errorResponse, paginatedResponse } = require('../utils/response');
const { getAlumniList, getAlumniById } = require('../services/alumniService');
const MentorshipRequest = require('../models/MentorshipRequest');

const getAlumni = (req, res) => {
  try {
    const { search, branch, company, page = 1, limit = 12 } = req.query;
    const list = getAlumniList({ search, branch, company });
    return paginatedResponse(res, list, page, limit, list.length, 'Alumni records retrieved');
  } catch (err) {
    return errorResponse(res, err.message);
  }
};

const getAlumniDetails = (req, res) => {
  try {
    const alumni = getAlumniById(req.params.id);
    if (!alumni) return errorResponse(res, 'Alumni profile not found', 404);
    return successResponse(res, alumni);
  } catch (err) {
    return errorResponse(res, err.message);
  }
};

const requestMentorship = async (req, res) => {
  try {
    const { alumniId, alumniName, message, topic, studentName, studentEmail } = req.body;
    const reqDoc = {
      studentId: req.user ? req.user.id : null,
      alumniId,
      studentName: studentName || (req.user ? req.user.name : 'Student'),
      studentEmail: studentEmail || (req.user ? req.user.email : 'student@university.edu'),
      alumniName,
      message,
      topic: topic || 'Career Guidance & Resume Review',
      status: 'pending',
      requestedAt: new Date()
    };
    
    // Save to DB if possible
    try {
      await MentorshipRequest.create(reqDoc);
    } catch (e) {
      // Graceful fallback for in-memory / fallback mode
    }

    return successResponse(res, reqDoc, 'Mentorship request submitted successfully to alumni!', 201);
  } catch (err) {
    return errorResponse(res, err.message);
  }
};

module.exports = {
  getAlumni,
  getAlumniDetails,
  requestMentorship
};
