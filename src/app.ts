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

const allowedOrigins = [
  "http://localhost:3001",
  "https://quitmood.net",
  "http://localhost:5173",
];
console.log("Allowed origins2:", allowedOrigins);

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
