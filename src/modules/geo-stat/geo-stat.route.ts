import express from "express";

import controller from "./geo-stat.controller.js";

const geoStatRouter = express.Router();

geoStatRouter.get("/", controller.getAll);
geoStatRouter.delete("/delete-many", controller.deleteMany);
geoStatRouter.get("/range", controller.getByDate);
geoStatRouter.get("/:id", controller.findOne);

export default geoStatRouter;
