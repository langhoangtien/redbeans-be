import authController from "@/modules/auth/auth.controller";
import express from "express";
import postController from "@/modules/post/controller";
import paymentRouter from "@/modules/payment/route";
import productController from "@/modules/product/product.controller";

import uploadRouter from "@/modules/upload/upload.route";
import uploadController from "@/modules/upload/upload.controller";
import reviewController from "@/modules/review/review.controller";

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
