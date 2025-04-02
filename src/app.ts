import authenticateJWT from "./middleware/jwt.js";
import router from "./routes/index.js";
import express from "express";
import publicRouter from "./routes/public.route.js";
import cors from "cors";

const app = express();
app.use(express.json({ limit: "10mb" })); // Cho phép request tối đa 10MB
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
// app.use((req, res, next) => {
//   console.log(`Request Path: ${req.path}`);
//   next();
// });

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

app.use(express.json());
app.use("/", publicRouter);
app.use("/", authenticateJWT, router);

export default app;
