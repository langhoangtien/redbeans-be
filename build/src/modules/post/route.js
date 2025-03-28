import { updateValidate, validate } from "./validate";
import postController from "./controller";
import baseRouter from "../base/route";
const postRouter = baseRouter(postController, validate, updateValidate);
export default postRouter;
//# sourceMappingURL=route.js.map