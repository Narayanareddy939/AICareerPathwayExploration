const fs = require('fs');
const path = require('path');
const { successResponse, errorResponse } = require('../utils/response');
const { getRecommendations } = require('../services/recommendationService');

const PROCESSED_DIR = path.join(__dirname, '..', '..', 'Datasets', 'processed');

const getAllCareers = (req, res) => {
  try {
    const cp = path.join(PROCESSED_DIR, 'careers.json');
    let careers = [];
    if (fs.existsSync(cp)) {
      careers = JSON.parse(fs.readFileSync(cp, 'utf-8'));
    }
    const { category, search } = req.query;
    if (category) {
      careers = careers.filter(c => (c.category || '').toLowerCase() === category.toLowerCase());
    }
    if (search) {
      const s = search.toLowerCase();
      careers = careers.filter(c => (c.title || '').toLowerCase().includes(s) || (c.requiredSkills || []).some(sk => sk.toLowerCase().includes(s)));
    }
    return successResponse(res, careers, 'Careers retrieved successfully');
  } catch (err) {
    return errorResponse(res, err.message);
  }
};

const getCareerById = (req, res) => {
  try {
    const cp = path.join(PROCESSED_DIR, 'careers.json');
    if (!fs.existsSync(cp)) return errorResponse(res, 'Careers dataset not found', 404);
    const careers = JSON.parse(fs.readFileSync(cp, 'utf-8'));
    const career = careers.find(c => String(c.id) === String(req.params.id));
    if (!career) return errorResponse(res, 'Career not found', 404);
    return successResponse(res, career);
  } catch (err) {
    return errorResponse(res, err.message);
  }
};

const getRecommendationsHandler = async (req, res) => {
  try {
    const studentData = req.body || {};
    const recommendations = await getRecommendations(studentData);
    return successResponse(res, recommendations, 'Recommendations generated successfully');
  } catch (err) {
    return errorResponse(res, err.message);
  }
};

module.exports = {
  getAllCareers,
  getCareerById,
  getRecommendationsHandler
};
