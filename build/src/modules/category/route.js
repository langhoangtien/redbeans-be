import { updateValidate, validate } from "./validate";
import categoryController from "./controller";
import express from "express";
import baseRouter from "../base/route";
const router = express.Router();
const categoryRouter = baseRouter(categoryController, validate, updateValidate);
router.get("/test", categoryController.test);
router.use("/", categoryRouter);
export default router;
//# sourceMappingURL=route.js.map