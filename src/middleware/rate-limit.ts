import rateLimit from "express-rate-limit";

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  skipSuccessfulRequests: true,
  message: {
    status: 429,
    message: "Too many requests, please try again later.",
  },
});

export { authLimiter };
