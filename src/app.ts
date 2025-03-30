import authenticateJWT from "./middleware/jwt.js";
import router from "./routes/index.js";
import express from "express";
import publicRouter from "./routes/public.route.js";
import cors from "cors";

const app = express();
// app.use((req, res, next) => {
//   console.log(`Request Path: ${req.path}`);
//   next();
// });

app.use(
  cors({
    origin: "*", // Cho phép tất cả domain
  })
);
app.use(express.json());
app.use("/", publicRouter);
app.use("/", authenticateJWT, router);

export default app;
