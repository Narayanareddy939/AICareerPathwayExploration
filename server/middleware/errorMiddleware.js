const { error } = require('../utils/logger');

const notFoundHandler = (req, res, next) => {
  res.status(404).json({
    success: false,
    message: `API Route not found: [${req.method}] ${req.originalUrl}`
  });
};

const globalErrorHandler = (err, req, res, next) => {
  error(`Unhandled Request Error: ${err.message}`, err.stack);

  const statusCode = err.statusCode || (res.statusCode === 200 ? 500 : res.statusCode);
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
};

module.exports = { notFoundHandler, globalErrorHandler };
