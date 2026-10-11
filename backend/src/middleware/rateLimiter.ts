import rateLimit from "express-rate-limit";

// Global baseline rate limiter for all API traffic
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // Max 300 requests per window per IP
  standardHeaders: true, // Return standard `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  handler: (_req, res) => {
    res.status(429).json({
      success: false,
      error: "Too many requests. Bot traffic or excessive requests detected. Please try again in 15 minutes.",
    });
  },
  skip: (req) => {
    // Skip during automated testing and health checks
    return process.env.NODE_ENV === "test" || req.path === "/api/health";
  },
});

// Strict rate limiter for AI generation, RAG embedding, and heavy workloads
export const aiRateLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 30, // Max 30 AI generations per 10 minutes per IP
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === "test",
  handler: (_req, res) => {
    res.status(429).json({
      success: false,
      error: "AI generation rate limit exceeded. Please wait a few moments before generating additional drills or mock questions.",
    });
  },
});

// Strict limiter for sensitive profile/auth endpoints
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 40,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === "test",
  handler: (_req, res) => {
    res.status(429).json({
      success: false,
      error: "Too many authentication requests from this IP. Please try again after 15 minutes.",
    });
  },
});
