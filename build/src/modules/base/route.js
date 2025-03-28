import express from "express";
import { validateSchema } from "../../utilities/index.js";
const baseRouter = (controller, validateCreate, validateUpdate) => {
    const router = express.Router();
    router.get("/", (req, res) => {
        return controller.getAll(req, res);
    });
    router.post("/", validateSchema(validateCreate), (req, res) => {
        return controller.create(req, res);
    });
    router.patch("/:id", validateSchema(validateUpdate), (req, res) => {
        return controller.update(req, res);
    });
    router.delete("/:id", (req, res) => {
        return controller.remove(req, res);
    });
    router.get("/:id", (req, res) => {
        return controller.findOne(req, res);
    });
    return router;
};
export default baseRouter;
//# sourceMappingURL=route.js.map