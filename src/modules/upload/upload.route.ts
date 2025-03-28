import express from "express";
const uploadRouter = express.Router();
import controller, { upload } from "./upload.controller.js";

uploadRouter.post("/single", upload.single("image"), controller.uploadSingle);
uploadRouter.post(
  "/multiple",
  upload.array("images", 10),
  controller.uploadMultiple
);

export default uploadRouter;
