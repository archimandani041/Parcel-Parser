/**
 * Global Express Error Handling Middleware
 */

export function errorHandler(err, req, res, next) {
  console.error('[API Error Handler]:', err.stack || err.message || err);

  const statusCode = err.statusCode || res.statusCode !== 200 ? res.statusCode : 500;

  res.status(statusCode).json({
    success: false,
    error: err.message || 'Internal Server Error',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
}
