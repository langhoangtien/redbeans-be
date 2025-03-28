import { updateValidate, validate } from "./post.validate.js";
import postController from "./post.controller.js";
import baseRouter from "../base/route.js";
const postRouter = baseRouter(postController, validate, updateValidate);
export default postRouter;
//# sourceMappingURL=post.route.js.map