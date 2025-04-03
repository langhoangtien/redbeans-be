import express from "express";
import paymentController from "./payment.controller.js";

import { validateSchema } from "../../utilities/index.js";
import { cartSchema } from "./payment.validate.js";
const router = express.Router();
router.post(
  "/paypal",
  validateSchema(cartSchema),
  paymentController.createOrder
);

router.get(
  "/paypal/generate-client-data",
  paymentController.generateClientData
);
router.post("/paypal/:id", paymentController.captureOrder);

export default router;
