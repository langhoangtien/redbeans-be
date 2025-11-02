import authenticateJWT from "./middleware/jwt.js";
import router from "./routes/index.js";
import express from "express";
import publicRouter from "./routes/public.route.js";
import cors from "cors";
import { errorConverter, errorHandler } from "./middleware/error.js";
import {
  authLimiter,
  clientLimiter,
  paymentLimiter,
  trackLimiter,
  clientReviewLimiter,
} from "./middleware/rate-limit.js";

const app = express();
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true, limit: "20mb" }));
app.use((req, res, next) => {
  const fullUrl = req.originalUrl;
  if (fullUrl.length > 1000) {
    res.status(414).json({ message: "URL too long" });
  } else {
    next();
  }
});
app.set("trust proxy", 1);
const allowedOrigins = [
  "https://langtranhdongho.vn",
  "https://quitmood.net",
  "https://optilifecompany.com",
  "http://127.0.0.1:9292",
  "https://naturaeon.com",
  "http://localhost:5173",
  "https://quitmood.us",
  "https://bunifix.co",
  "https://www.bunionfix.co",
  "https://bunionfix.co",
  "https://www.nordicmedix.com",
  "https://nordicmedix.com",
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

export const uploadsPath = "uploads"; // đường dẫn đến thư mục uploads

app.use(
  "/static/",
  express.static(uploadsPath, {
    maxAge: "1y",
    immutable: true,
    index: false,
    fallthrough: false,
  })
);

app.use("/auth", authLimiter);
app.use("/payment", paymentLimiter);
app.use("/client", clientLimiter);
app.use("/client/review", clientReviewLimiter);
app.use("/tracking", trackLimiter);

app.use(publicRouter);
app.use(authenticateJWT);
app.use(router);
app.use(errorConverter);
app.use(errorHandler);
export default app;
