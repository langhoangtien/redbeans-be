import express from "express";
const productRouter = express.Router();
import controller from "./product.controller";
import { validateSchema } from "@/utilities";
import { productZodSchema, updateProductZodSchema } from "./product.validate";

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
productRouter.delete("/:id", controller.remove);
productRouter.get("/:id", controller.findOne);

export default productRouter;
