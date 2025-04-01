import express from "express";
const router = express.Router();

import authRouter from "../modules/auth/auth.route.js";
import userRouter from "../modules/user/user.route.js";
import categoryRouter from "../modules/category/category.route.js";
import postRouter from "../modules/post/post.route.js";
import productRouter from "../modules/product/product.route.js";
import orderRouter from "../modules/order/order.route.js";
import reviewRouter from "../modules/review/review.route.js";
import blogRouter from "../modules/blog/blog.route.js";
import settingsRouter from "../modules/settings/settings.route.js";
import emailRouter from "../modules/email/email.route.js";

router.use("/categories", categoryRouter);
router.use("/settings", settingsRouter);
// router.use("/uploads", uploadRouter);
router.use("/users", userRouter);
router.use("/posts", postRouter);
router.use("/auth", authRouter);
router.use("/products", productRouter);
router.use("/orders", orderRouter);
router.use("/reviews", reviewRouter);
router.use("/blogs", blogRouter);
router.use("/emails", emailRouter);
export default router;
