import express from "express";
const router = express.Router();

import authRouter from "@/modules/auth/auth.route";
import userRouter from "@/modules/user/route";
import categoryRouter from "@/modules/category/route";
import postRouter from "@/modules/post/route";
router.use("/categories", categoryRouter);
router.use("/users", userRouter);
router.use("/posts", postRouter);
router.use("/auth", authRouter);

export default router;
