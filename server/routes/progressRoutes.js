const express = require('express');
const router = express.Router();
const { getStudentProgress } = require('../controllers/progressController');
const { optionalAuth } = require('../middleware/authMiddleware');

router.get('/', optionalAuth, getStudentProgress);

module.exports = router;
