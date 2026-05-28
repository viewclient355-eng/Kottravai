const rateLimit = require('express-rate-limit');

// A conservative rate limiter for tracking endpoints to prevent abuse
module.exports = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 300, // allow bursty traffic from single client but limit abuse
  message: { error: 'Rate limit exceeded for tracking endpoint' },
  standardHeaders: true,
  legacyHeaders: false
});
