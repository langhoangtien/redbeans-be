import express from "express";
const blogRouter = express.Router();
import controller from "./blog.controller.js";
import { validateSchema } from "../../utilities/index.js";
import { blogSchema, updateBlogSchema } from "./blog.validate.js";

blogRouter.get("/", controller.getAll);
blogRouter.post("/", validateSchema(blogSchema), controller.create);
blogRouter.patch("/:id", validateSchema(updateBlogSchema), controller.update);
blogRouter.delete("/delete-many", controller.deleteMany);
blogRouter.delete("/:id", controller.remove);
blogRouter.get("/:id", controller.findOne);

export default blogRouter;
