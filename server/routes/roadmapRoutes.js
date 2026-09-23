const express = require('express');
const router = express.Router();
const { getRoadmapHandler, updateMilestoneProgress } = require('../controllers/roadmapController');
const { optionalAuth } = require('../middleware/authMiddleware');

router.get('/', optionalAuth, getRoadmapHandler);
router.post('/milestone', optionalAuth, updateMilestoneProgress);

module.exports = router;
