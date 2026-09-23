const express = require('express');
const router = express.Router();
const { getAllCareers, getCareerById, getRecommendationsHandler } = require('../controllers/careerController');

router.get('/', getAllCareers);
router.get('/:id', getCareerById);
router.post('/recommend', getRecommendationsHandler);

module.exports = router;
