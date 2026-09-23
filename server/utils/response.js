/**
 * Standard API Response Formatting Utilities
 */

const successResponse = (res, data = {}, message = 'Operation successful', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    timestamp: new Date().toISOString()
  });
};

const errorResponse = (res, message = 'Internal Server Error', statusCode = 500, errors = null) => {
  const payload = {
    success: false,
    message,
    timestamp: new Date().toISOString()
  };
  if (errors) payload.errors = errors;
  return res.status(statusCode).json(payload);
};

const paginatedResponse = (res, items = [], page = 1, limit = 10, total = null, message = 'Data retrieved') => {
  const totalItems = total !== null ? total : items.length;
  const totalPages = Math.ceil(totalItems / limit) || 1;
  const currentPage = Math.max(1, parseInt(page, 10));
  const offset = (currentPage - 1) * limit;
  const paginatedItems = total !== null ? items : items.slice(offset, offset + limit);

  return res.status(200).json({
    success: true,
    message,
    data: paginatedItems,
    pagination: {
      total: totalItems,
      page: currentPage,
      limit: parseInt(limit, 10),
      totalPages
    },
    timestamp: new Date().toISOString()
  });
};

module.exports = {
  successResponse,
  errorResponse,
  paginatedResponse
};
