import express from "express";
import paymentController from "./payment.controller";
import paymentController2 from "./paymentx.controller";
import { validateSchema } from "@/utilities";
import { cartSchema } from "./payment.validate";
const router = express.Router();
router.post(
  "/paypal",
  validateSchema(cartSchema),
  paymentController.createOrder
);
router.post("/paypal2", paymentController2.createOrder);
router.get(
  "/paypal2/generate-client-token",
  paymentController2.generateClientToken
);
router.post("/paypal/:id", paymentController.captureOrder);

export default router;
