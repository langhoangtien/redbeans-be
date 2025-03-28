import express from "express";
const productRouter = express.Router();
import controller from "./product.controller.js";
import { validateSchema } from "../../utilities/index.js";
import {
  productZodSchema,
  updateProductZodSchema,
} from "./product.validate.js";

productRouter.get("/", controller.getAll);
productRouter.post("/", validateSchema(productZodSchema), (req, res) => {
  return controller.create(req, res);
});
productRouter.patch(
  "/:id",
  validateSchema(updateProductZodSchema),
  (req, res) => {
    return controller.update(req, res);
  }
);
productRouter.delete("/delete-many", controller.deleteMany);
productRouter.delete("/:id", controller.remove);
productRouter.get("/:id", controller.findOne);

export default productRouter;
