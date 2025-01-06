import { updateValidate, validate } from "./validate";
import userController from "./controller";
import baseRouter from "../base/route";

const userRouter = baseRouter(userController, validate, updateValidate);

export default userRouter;
