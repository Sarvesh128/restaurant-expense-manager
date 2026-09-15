/**
 * Centralized Express Error Handling Middleware.
 * Catches unhandled errors and formats JSON response.
 */
const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || err.status || 500;
  const isProduction = process.env.NODE_ENV === 'production';

  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(isProduction ? {} : { stack: err.stack })
  });
};

module.exports = errorHandler;
