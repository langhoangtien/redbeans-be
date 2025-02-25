import express from "express";
const orderRouter = express.Router();
import controller from "./order.controller";
import { validateSchema } from "@/utilities";
import { orderSchema, updateOrderSchema } from "./order.validate";

orderRouter.get("/", controller.getAll);
orderRouter.post("/", validateSchema(orderSchema), (req, res) => {
  return controller.create(req, res);
});
orderRouter.patch("/:id", validateSchema(updateOrderSchema), (req, res) => {
  return controller.update(req, res);
});
orderRouter.delete("/:id", controller.remove);
orderRouter.get("/:id", controller.findOne);

export default orderRouter;
