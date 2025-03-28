import { updateValidate, validate } from "./user.validate.js";
import userController from "./user.controller.js";

import express from "express";
import { validateSchema } from "../../utilities/index.js";
const userRouter = express.Router();

userRouter.get("/", userController.getAll);
userRouter.post("/", validateSchema(validate), userController.create);
userRouter.get("/:id", userController.findOne);
userRouter.patch("/:id", validateSchema(updateValidate), userController.update);
userRouter.delete("/delete-many", userController.deleteMany);
userRouter.delete("/:id", userController.remove);

export default userRouter;
