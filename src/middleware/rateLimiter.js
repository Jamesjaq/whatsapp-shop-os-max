import { logger } from '../utils/logger.js';

// In-memory rate limiting (replace with Redis in production)
const rateLimitStore = new Map();

/**
 * Rate limiter middleware
 */
export function rateLimiter(req, res, next) {
  const identifier = req.ip || req.connection.remoteAddress;
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  const maxRequests = 100;

  // Get or create rate limit entry
  let entry = rateLimitStore.get(identifier);

  if (!entry) {
    entry = {
      count: 0,
      resetTime: now + windowMs,
    };
    rateLimitStore.set(identifier, entry);
  }

  // Reset if window expired
  if (now >= entry.resetTime) {
    entry.count = 0;
    entry.resetTime = now + windowMs;
  }

  // Increment request count
  entry.count++;

  // Check if limit exceeded
  if (entry.count > maxRequests) {
    logger.warn({
      ip: identifier,
      count: entry.count,
      maxRequests,
    });

    return res.status(429).json({
      success: false,
      error: {
        message: 'Too many requests',
        status: 429,
        retryAfter: Math.ceil((entry.resetTime - now) / 1000),
      },
    });
  }

  // Add rate limit headers
  res.set('X-RateLimit-Limit', maxRequests);
  res.set('X-RateLimit-Remaining', maxRequests - entry.count);
  res.set('X-RateLimit-Reset', entry.resetTime);

  next();
}

/**
 * Cleanup old entries periodically
 */
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now >= entry.resetTime + 60000) {
      rateLimitStore.delete(key);
    }
  }
}, 60000);

export default {
  rateLimiter,
};
