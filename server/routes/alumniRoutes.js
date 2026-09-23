const express = require('express');
const router = express.Router();
const { getAlumni, getAlumniDetails, requestMentorship } = require('../controllers/alumniController');
const { optionalAuth } = require('../middleware/authMiddleware');

router.get('/', getAlumni);
router.get('/:id', getAlumniDetails);
router.post('/mentorship', optionalAuth, requestMentorship);

module.exports = router;
