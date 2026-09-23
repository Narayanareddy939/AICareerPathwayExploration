const express = require('express');
const router = express.Router();
const { getAdminOverview } = require('../controllers/adminController');
const { requireAuth } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');

router.get('/overview', requireAuth, requireRole('admin'), getAdminOverview);
// Public read-only analytics endpoint for dashboard widgets
router.get('/analytics', getAdminOverview);

module.exports = router;
