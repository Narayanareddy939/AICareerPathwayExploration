const express = require('express');
const router = express.Router();
const { compareScenarios } = require('../controllers/scenarioController');

router.post('/compare', compareScenarios);

module.exports = router;
