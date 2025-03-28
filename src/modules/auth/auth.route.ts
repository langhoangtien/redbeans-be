import express from "express";
import authController from "./auth.controller.js";

const router = express.Router();
router.get("/me", authController.me);
router.post("/login", authController.login);
export default router;
