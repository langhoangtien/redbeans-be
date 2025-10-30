import authController from "../modules/auth/auth.controller.js";
import express from "express";
import postController from "../modules/post/post.controller.js";
import paymentRouter from "../modules/payment/payment.route.js";
import productController from "../modules/product/product.controller.js";

import reviewController from "../modules/review/review.controller.js";
import blogController from "../modules/blog/blog.controller.js";
import { validateQuery, validateSchema } from "../utilities/index.js";
import { reviewClientSchema } from "../modules/review/review.validate.js";
import settingsController from "../modules/settings/settings.controller.js";
import geoStatController from "../modules/geo-stat/geo-stat.controller.js";
import { geoStatSchema } from "../modules/geo-stat/geo-stat.validate.js";
import contactController from "../modules/contact/contact.controller.js";
import { contactSchema } from "../modules/contact/contact.validate.js";
import { getAllQuerySchema } from "../modules/blog/blog.validate.js";
import { trackingSchema } from "../modules/tracking/tracking.validate.js";
import trackingController from "../modules/tracking/tracking.controller.js";

const router = express.Router();
router.get("/posts", postController.getAll);
router.get("/blogs", validateQuery(getAllQuerySchema), blogController.getAll);
router.get("/blogs/:id", blogController.findOne);
router.get("/settings/client", settingsController.getSettingsClient);
router.post(
  "/tracking/:id",
  validateSchema(trackingSchema),
  trackingController.findOne
);
router.post(
  "/client/track-visit",
  validateSchema(geoStatSchema),
  geoStatController.trackVisit
);
router.post(
  "/client/track-add-to-cart",
  validateSchema(geoStatSchema),
  geoStatController.trackAddToCart
);
router.post(
  "/client/contact",
  validateSchema(contactSchema),
  contactController.create
);
router.post(
  "/client/review",
  validateSchema(reviewClientSchema),
  reviewController.createClientReview
);

router.get("/reviews", reviewController.getAll);
router.get("/reviews/:productId", reviewController.getProductRating);
router.get("/products", productController.getAll);
router.get("/products/:id", productController.findOne);
router.post("/auth/login", authController.login);
router.use("/payment", paymentRouter);

export default router;
