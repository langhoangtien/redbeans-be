import express from "express";
import authController from "./auth.controller";

const router = express.Router();
router.get("/me", (req, res) => {
  res.send("Hello");
});
router.post("/login", authController.login);
export default router;
