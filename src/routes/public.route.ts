import authController from "../modules/auth/auth.controller.js";
import express from "express";
import postController from "../modules/post/post.controller.js";
import paymentRouter from "../modules/payment/payment.route.js";
import productController from "../modules/product/product.controller.js";

import uploadController from "../modules/upload/upload.controller.js";
import reviewController from "../modules/review/review.controller.js";
import blogController from "../modules/blog/blog.controller.js";
import { validateSchema } from "../utilities/index.js";
import { reviewClientSchema } from "../modules/review/review.validate.js";
import settingsController from "../modules/settings/settings.controller.js";

const router = express.Router();
router.get("/posts", postController.getAll);
router.get("/blogs", blogController.getAll);
router.get("/blogs/:id", blogController.findOne);
router.get("/settings/client", settingsController.getSettingsClient);
router.get("/reviews", reviewController.getAll);
router.post(
  "/reviews/client-review",
  validateSchema(reviewClientSchema),
  reviewController.createClientReview
);
router.get("/files/:id", uploadController.getFile);
router.get("/products", productController.getAll);
router.get("/products/:id", productController.findOne);
router.post("/auth/login", authController.login);
router.use("/payment", paymentRouter);

export default router;
