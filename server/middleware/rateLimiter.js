/**
 * Lightweight, in-memory sliding window rate limiter for security and anti-spam.
 * Operates without external Redis dependency.
 */

class MemoryRateLimiter {
  constructor() {
    this.requests = new Map(); // key -> [timestamps]
    // Clean up stale entries every 5 minutes
    setInterval(() => this.cleanup(), 5 * 60 * 1000).unref();
  }

  cleanup() {
    const now = Date.now();
    for (const [key, timestamps] of this.requests.entries()) {
      const valid = timestamps.filter(t => now - t < 60 * 60 * 1000);
      if (valid.length === 0) {
        this.requests.delete(key);
      } else {
        this.requests.set(key, valid);
      }
    }
  }

  isRateLimited(key, maxRequests, windowMs) {
    const now = Date.now();
    let timestamps = this.requests.get(key) || [];
    // Filter out timestamps older than the window
    timestamps = timestamps.filter(t => now - t < windowMs);

    if (timestamps.length >= maxRequests) {
      const oldest = timestamps[0];
      const retryAfterSeconds = Math.ceil((windowMs - (now - oldest)) / 1000);
      return { limited: true, retryAfterSeconds };
    }

    timestamps.push(now);
    this.requests.set(key, timestamps);
    return { limited: false, remaining: maxRequests - timestamps.length };
  }
}

const limiter = new MemoryRateLimiter();

/**
 * Middleware generator for rate limiting
 * @param {Object} options
 * @param {number} options.windowMs - Time window in milliseconds
 * @param {number} options.max - Max requests in window
 * @param {string} options.message - Error message when limited
 * @param {Function} [options.keyGenerator] - Optional custom key extractor
 */
function createRateLimiter({
  windowMs = 15 * 60 * 1000, // 15 mins default
  max = 10,
  message = 'Too many requests. Please try again later.',
  keyGenerator = null
}) {
  return (req, res, next) => {
    // Determine client identifier: IP or custom key
    const clientIp = req.ip ||
      req.headers['x-forwarded-for']?.split(',')[0].trim() ||
      req.socket?.remoteAddress ||
      '127.0.0.1';

    const customKey = keyGenerator ? keyGenerator(req) : '';
    const key = `${req.baseUrl || req.path}:${clientIp}:${customKey}`;

    const check = limiter.isRateLimited(key, max, windowMs);
    if (check.limited) {
      res.setHeader('Retry-After', check.retryAfterSeconds);
      return res.status(429).json({
        success: false,
        error: 'RATE_LIMIT_EXCEEDED',
        message: `${message} (Please wait ${Math.ceil(check.retryAfterSeconds / 60)} min before retrying).`,
        retryAfterSeconds: check.retryAfterSeconds
      });
    }

    next();
  };
}

// Pre-configured rate limiters for auth endpoints
const registerLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Registration rate limit exceeded. Too many account creation requests from this network.'
});

const loginLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: 'Login attempts rate limit exceeded. For security, please wait before trying again.'
});

const verifyEmailLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: 'Too many verification attempts.'
});

const resendVerificationLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 4,
  message: 'Too many verification resend requests. Please check your inbox or spam folder before requesting another code.',
  keyGenerator: (req) => (req.body?.email || '').trim().toLowerCase()
});

const passwordResetLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 6,
  message: 'Too many password recovery requests. Please wait before requesting another reset link.'
});

module.exports = {
  createRateLimiter,
  registerLimiter,
  loginLimiter,
  verifyEmailLimiter,
  resendVerificationLimiter,
  passwordResetLimiter
};
