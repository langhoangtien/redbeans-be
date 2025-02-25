import authenticateJWT from "./middleware/jwt";
import router from "./routes";
import express, { Request, Response, NextFunction } from "express";
import publicRouter from "./routes/public.route";

const app = express();
// app.use((req, res, next) => {
//   console.log(`Request Path: ${req.path}`);
//   next();
// });
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*"); // Cho phép tất cả các origin
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  next();
});
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
