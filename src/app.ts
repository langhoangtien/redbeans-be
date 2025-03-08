import authenticateJWT from "./middleware/jwt";
import router from "./routes";
import express, { Request, Response, NextFunction } from "express";
import publicRouter from "./routes/public.route";
import cors from "cors";

const app = express();
// app.use((req, res, next) => {
//   console.log(`Request Path: ${req.path}`);
//   next();
// });

const allowedOrigins = ["http://localhost:3001", "https://yourdomain.com"];

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
app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error("Error occurred:", err);
    const statusCode = err.status || 500;
    res.status(statusCode).json({
      error: err.message || "Internal Server Error",
    });
  }
);
export default app;
