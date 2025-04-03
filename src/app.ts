import authenticateJWT from "./middleware/jwt.js";
import router from "./routes/index.js";
import express from "express";
import publicRouter from "./routes/public.route.js";
import cors from "cors";
import { errorConverter, errorHandler } from "./middleware/error.js";
import { authLimiter } from "./middleware/rate-limit.js";
const app = express();
app.use(express.json({ limit: "10mb" })); // Cho phép request tối đa 10MB
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

const allowedOrigins = [
  "http://localhost:3001",
  "https://quitmood.net",
  "https://optilifecompany.com",
  "http://localhost:5173",
  "http://192.168.1.5:5173",
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

const uploadsPath = "uploads"; // đường dẫn đến thư mục uploads

app.use(
  "/static/",
  (_req, res, next) => {
    res.setHeader("Content-Type", "image/avif");
    next();
  },
  express.static(uploadsPath, {
    maxAge: 31536000000, // 1 năm
    etag: true,
    lastModified: true,
    immutable: true,
    index: false,
    fallthrough: false,
  })
);

app.use((err, _req, res, _next) => {
  const statusCode = err.statusCode || 500;
  res.status(statusCode);
  res.send("Error");
});
app.use("/auth", authLimiter);

app.use("/", publicRouter);
app.use("/", authenticateJWT, router);
app.use(errorConverter);
app.use(errorHandler);
export default app;
