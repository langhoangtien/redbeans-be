import express from "express";
const contactRouter = express.Router();
import controller from "./contact.controller.js";
import { validateSchema } from "../../utilities/index.js";
import { contactSchema } from "./contact.validate.js";

contactRouter.get("/", controller.getAll);
contactRouter.post("/", validateSchema(contactSchema), controller.create);
contactRouter.patch("/:id", validateSchema(contactSchema), controller.update);
contactRouter.delete("/delete-many", controller.deleteMany);
contactRouter.delete("/:id", controller.remove);
contactRouter.get("/:id", controller.findOne);

export default contactRouter;
