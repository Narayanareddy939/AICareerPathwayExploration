const { successResponse, errorResponse } = require('../utils/response');
const { generateRoadmap } = require('../services/roadmapService');
const Roadmap = require('../models/Roadmap');

const getRoadmapHandler = async (req, res) => {
  try {
    const role = req.query.role || (req.user ? req.user.targetRole : 'Full Stack Developer') || 'Machine Learning Engineer';
    const skills = req.query.skills ? req.query.skills.split(',') : [];
    
    const roadmapData = generateRoadmap(role, skills);
    return successResponse(res, roadmapData, 'Roadmap generated successfully');
  } catch (err) {
    return errorResponse(res, err.message);
  }
};

const updateMilestoneProgress = async (req, res) => {
  try {
    const { phaseNumber, milestoneId, completed } = req.body;
    return successResponse(res, { phaseNumber, milestoneId, completed }, 'Milestone status updated');
  } catch (err) {
    return errorResponse(res, err.message);
  }
};

module.exports = {
  getRoadmapHandler,
  updateMilestoneProgress
};
