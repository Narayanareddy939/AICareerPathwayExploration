const { successResponse, errorResponse, paginatedResponse } = require('../utils/response');
const { getJobs } = require('../services/jobService');

const getJobsHandler = (req, res) => {
  try {
    const { search, location, page = 1, limit = 10 } = req.query;
    const list = getJobs({ search, location });
    return paginatedResponse(res, list, page, limit, list.length, 'Jobs retrieved successfully');
  } catch (err) {
    return errorResponse(res, err.message);
  }
};

module.exports = { getJobsHandler };
