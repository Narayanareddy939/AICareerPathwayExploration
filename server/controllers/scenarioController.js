const { successResponse, errorResponse } = require('../utils/response');
const { computeHybridScore } = require('../services/recommendationService');
const fs = require('fs');
const path = require('path');

const PROCESSED_DIR = path.join(__dirname, '..', '..', 'Datasets', 'processed');

const compareScenarios = (req, res) => {
  try {
    const { scenarios = [], studentProfile = {} } = req.body;
    
    let careers = [];
    const cp = path.join(PROCESSED_DIR, 'careers.json');
    if (fs.existsSync(cp)) careers = JSON.parse(fs.readFileSync(cp, 'utf-8'));

    const comparisonResults = scenarios.map((sc, idx) => {
      const career = careers.find(c => c.title.toLowerCase() === (sc.roleTitle || '').toLowerCase()) || {
        title: sc.roleTitle || `Path ${idx+1}`,
        requiredSkills: ['Core Fundamentals', 'Domain Skills', 'Projects'],
        averageSalary: '₹10,00,000 - ₹20,00,000',
        growthRate: '20%'
      };

      const score = computeHybridScore(studentProfile, career);
      return {
        id: `sc-result-${idx+1}`,
        roleTitle: career.title,
        matchScore: score,
        salaryRange: career.averageSalary,
        growthRate: career.growthRate,
        timeToReadinessMonths: score > 75 ? 3 : score > 50 ? 6 : 9,
        riskLevel: score > 80 ? 'Low' : score > 60 ? 'Moderate' : 'High',
        learningCurve: score > 70 ? 'Smooth' : 'Steep',
        requiredSkills: career.requiredSkills
      };
    });

    return successResponse(res, comparisonResults, 'Scenarios evaluated successfully');
  } catch (err) {
    return errorResponse(res, err.message);
  }
};

module.exports = { compareScenarios };
