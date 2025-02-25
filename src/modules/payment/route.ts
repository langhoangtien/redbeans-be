import express from "express";
import paymentController from "./payment.controller";
import { validateSchema } from "@/utilities";
import { cartSchema } from "./payment.validate";
const router = express.Router();
router.post(
  "/paypal",
  validateSchema(cartSchema),
  paymentController.createOrder
);
router.post("/paypal/:id", paymentController.captureOrder);
export default router;
