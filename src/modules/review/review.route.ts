import express from "express";
const reviewRouter = express.Router();
import controller from "./review.controller";
import { validateSchema } from "@/utilities";
import { reviewSchema, updateReviewSchema } from "./review.validate";

reviewRouter.get("/", controller.getAll);
reviewRouter.post("/", validateSchema(reviewSchema), controller.create);
reviewRouter.patch(
  "/:id",
  validateSchema(updateReviewSchema),
  controller.update
);
reviewRouter.delete("/delete-many", controller.deleteMany);
reviewRouter.delete("/:id", controller.remove);
reviewRouter.get("/:id", controller.findOne);

export default reviewRouter;
