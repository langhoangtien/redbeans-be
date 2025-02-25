import authController from "@/modules/auth/auth.controller";
import express from "express";
import postController from "@/modules/post/controller";
import paymentRouter from "@/modules/payment/route";
import productController from "@/modules/product/product.controller";

const router = express.Router();
router.get("/posts", postController.getAll);
router.get("/products", productController.getAll);
router.post("/auth/login", authController.login);
router.use("/payment", paymentRouter);
export default router;
