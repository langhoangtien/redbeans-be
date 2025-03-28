import express from "express";
const orderRouter = express.Router();
import controller from "./order.controller.js";
import { validateSchema } from "../../utilities/index.js";
import { orderSchema, updateOrderSchema } from "./order.validate.js";
orderRouter.get("/", controller.getAll);
orderRouter.post("/", validateSchema(orderSchema), controller.create);
orderRouter.patch("/:id", validateSchema(updateOrderSchema), controller.update);
orderRouter.delete("/delete-many", controller.deleteMany);
orderRouter.delete("/:id", controller.remove);
orderRouter.get("/:id", controller.findOne);
export default orderRouter;
//# sourceMappingURL=order.route.js.map