import express from "express";
const settingsRouter = express.Router();
import controller from "./settings.controller.js";
import { validateSchema } from "../../utilities/index.js";
import { settingsSchema } from "./settings.validate.js";

settingsRouter.get("/", controller.get);

settingsRouter.patch("", validateSchema(settingsSchema), controller.update);

export default settingsRouter;
