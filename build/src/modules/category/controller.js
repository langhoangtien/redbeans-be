import mongoose from "mongoose";
import baseController from "../base/controller.js";
import Category from "./model.js";
const categoryController = baseController(Category);
const test = async (req, res) => {
    res.json({
        message: "Test successful",
        timestamp: new Date().toISOString(),
        model: "Category",
    });
};
const deleteOne = async (req, res) => {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({ message: "Invalid ID format" });
        return;
    }
    try {
        const category = await Category.findById(id);
        if (!category) {
            res.status(404).json({ message: "Category not found" });
            return;
        }
        await category.deleteOne();
        res.json({ message: "Category and related posts deleted successfully" });
    }
    catch (error) {
        console.error("Error deleting category:", error);
        res.status(500).json({ message: "Server error" });
        return;
    }
};
const combinedController = { test, ...categoryController, remove: deleteOne };
export default combinedController;
//# sourceMappingURL=controller.js.map