import { updateValidate, validate } from "./category.validate.js";

import categoryController from "./category.controller.js";
import express from "express";
import baseRouter from "../base/route.js";

const router = express.Router();
const categoryRouter = baseRouter(categoryController, validate, updateValidate);

router.use("/", categoryRouter);
export default router;
