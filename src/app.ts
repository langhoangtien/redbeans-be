import authenticateJWT from "./middleware/jwt";
import router from "./routes";
import express from "express";
import publicRouter from "./routes/public.route";

const app = express();
app.use((req, res, next) => {
  console.log(`Request Path: ${req.path}`);
  next();
});
app.use(express.json());
app.use("/", publicRouter);
app.use("/", authenticateJWT, router);

export default app;
