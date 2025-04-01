import express from "express";
const emailRouter = express.Router();
import controller from "./email.controller.js";
import { validateSchema } from "../../utilities/index.js";
import { emailSchema, updateEmailSchema } from "./email.validate.js";

emailRouter.get("/", controller.getAll);
emailRouter.post("/", validateSchema(emailSchema), controller.create);
emailRouter.patch("/:id", validateSchema(updateEmailSchema), controller.update);
emailRouter.delete("/delete-many", controller.deleteMany);
emailRouter.delete("/:id", controller.remove);
emailRouter.get("/:id", controller.findOne);

export default emailRouter;
