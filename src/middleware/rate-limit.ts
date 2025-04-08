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

const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 15,
  message: "Too many payment attempts. Please slow down.",
});

const clientLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 8,
  message: "Too many requests from this IP, please try again later.",
});

export { authLimiter, paymentLimiter, clientLimiter };
