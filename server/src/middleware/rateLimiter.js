/**
 * In-memory sliding-window rate limiter for sensitive auth endpoints (Forgot Password, Reset Password)
 */

class SlidingWindowRateLimiter {
  constructor(windowMs = 15 * 60 * 1000, maxRequests = 5) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
    this.requests = new Map(); // key -> array of timestamps

    // Cleanup stale entries every 5 minutes
    setInterval(() => this.cleanup(), 5 * 60 * 1000).unref();
  }

  cleanup() {
    const now = Date.now();
    for (const [key, timestamps] of this.requests.entries()) {
      const activeTimestamps = timestamps.filter(t => now - t < this.windowMs);
      if (activeTimestamps.length === 0) {
        this.requests.delete(key);
      } else {
        this.requests.set(key, activeTimestamps);
      }
    }
  }

  isAllowed(key) {
    const now = Date.now();
    const timestamps = this.requests.get(key) || [];
    const recent = timestamps.filter(t => now - t < this.windowMs);

    if (recent.length >= this.maxRequests) {
      const oldestInWindow = recent[0];
      const retryAfterMs = this.windowMs - (now - oldestInWindow);
      const retryAfterSec = Math.ceil(retryAfterMs / 1000);
      return { allowed: false, retryAfterSec };
    }

    recent.push(now);
    this.requests.set(key, recent);
    return { allowed: true, remaining: this.maxRequests - recent.length };
  }

  middleware(keyExtractor = (req) => req.ip || req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'default_ip') {
    return (req, res, next) => {
      const ip = keyExtractor(req);
      const email = req.body?.email?.trim().toLowerCase();
      const key = email ? `${ip}_${email}` : ip;
      const check = this.isAllowed(key);

      if (!check.allowed) {
        res.setHeader('Retry-After', check.retryAfterSec);
        return res.status(429).json({
          success: false,
          code: 'RATE_LIMIT_EXCEEDED',
          error: `Too many requests. Please wait ${check.retryAfterSec} seconds before trying again.`,
          retryAfterSec: check.retryAfterSec
        });
      }

      next();
    };
  }
}

// 5 attempts per 15 minutes for forgot password
export const forgotPasswordLimiter = new SlidingWindowRateLimiter(15 * 60 * 1000, 5);

// 10 attempts per 15 minutes for reset password verification
export const resetPasswordLimiter = new SlidingWindowRateLimiter(15 * 60 * 1000, 10);
