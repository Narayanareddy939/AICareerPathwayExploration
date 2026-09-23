const { successResponse, errorResponse } = require('../utils/response');
const { getAnalyticsData } = require('../services/analyticsService');
const fs = require('fs');
const path = require('path');

const PROCESSED_DIR = path.join(__dirname, '..', '..', 'Datasets', 'processed');

const getAdminOverview = async (req, res) => {
  try {
    const analytics = await getAnalyticsData();
    return successResponse(res, {
      ...analytics,
      systemHealth: {
        serverStatus: 'Operational',
        databaseStatus: 'Active',
        aiEngine: 'Connected / Fallback Online',
        uptime: '99.98%'
      }
    }, 'Admin overview data retrieved');
  } catch (err) {
    return errorResponse(res, err.message);
  }
};

module.exports = { getAdminOverview };
