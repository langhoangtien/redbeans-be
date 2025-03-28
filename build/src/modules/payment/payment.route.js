import express from "express";
import paymentController from "./payment.controller.js";
import paymentController2 from "./paymentx.controller.js";
import { validateSchema } from "../../utilities/index.js";
import { cartSchema } from "./payment.validate.js";
const router = express.Router();
router.post("/paypal", validateSchema(cartSchema), paymentController.createOrder);
router.get("/paypal2/generate-client-token", paymentController2.generateClientToken);
router.post("/paypal/:id", paymentController.captureOrder);
export default router;
//# sourceMappingURL=payment.route.js.map