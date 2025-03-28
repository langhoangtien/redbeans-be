import authController from "../modules/auth/auth.controller.js";
import express from "express";
import postController from "../modules/post/post.controller.js";
import paymentRouter from "../modules/payment/payment.route.js";
import productController from "../modules/product/product.controller.js";

import uploadRouter from "../modules/upload/upload.route.js";
import uploadController from "../modules/upload/upload.controller.js";
import reviewController from "../modules/review/review.controller.js";

const router = express.Router();
router.get("/posts", postController.getAll);
router.use("/uploads", uploadRouter);
router.get("/reviews", reviewController.getAll);
router.get("/files/:id", uploadController.getFile);
router.get("/products", productController.getAll);
router.get("/products/:id", productController.findOne);
router.post("/auth/login", authController.login);
router.use("/payment", paymentRouter);

export default router;
