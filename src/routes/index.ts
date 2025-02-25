import express from "express";
const router = express.Router();

import authRouter from "@/modules/auth/auth.route";
import userRouter from "@/modules/user/route";
import categoryRouter from "@/modules/category/route";
import postRouter from "@/modules/post/route";
import productRouter from "@/modules/product/product.route";
import orderRouter from "@/modules/order/order.route";
router.use("/categories", categoryRouter);
router.use("/users", userRouter);
router.use("/posts", postRouter);
router.use("/auth", authRouter);
router.use("/products", productRouter);
router.use("/orders", orderRouter);

export default router;
