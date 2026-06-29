import { logger } from '../utils/logger.js';

/**
 * Request logging middleware
 */
export function requestLogger(req, res, next) {
  const startTime = Date.now();
  const requestId = req.headers['x-request-id'] || generateRequestId();

  // Attach request ID to logger
  req.id = requestId;

  // Log request
  logger.info({
    requestId,
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
  });

  // Intercept response
  const originalJson = res.json;
  res.json = function (data) {
    const duration = Date.now() - startTime;

    logger.info({
      requestId,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      responseSize: JSON.stringify(data).length,
    });

    return originalJson.call(this, data);
  };

  next();
}

/**
 * Generate unique request ID
 */
function generateRequestId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export default {
  requestLogger,
};
