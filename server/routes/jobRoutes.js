const express = require('express');
const router = express.Router();
const { getJobsHandler } = require('../controllers/jobController');

router.get('/', getJobsHandler);

module.exports = router;
