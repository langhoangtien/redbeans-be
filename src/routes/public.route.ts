import authController from "@/modules/auth/auth.controller";
import express from "express";
import postController from "@/modules/post/controller";
const router = express.Router();
router.get("/posts", postController.getAll);

router.post("/auth/login", authController.login);
export default router;
