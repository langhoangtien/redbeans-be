import mongoose from "mongoose";
import baseController from "../base/controller";
import Category from "./model";
import { Request, Response } from "express";

const categoryController = baseController(Category);
const test = async (req: Request, res: Response) => {
  console.log("Test");
  res.json({
    message: "Test successful",
    timestamp: new Date().toISOString(),
    model: "Category",
  });
};
const deleteOne = async (req: Request, res: Response) => {
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
  } catch (error) {
    console.error("Error deleting category:", error);
    res.status(500).json({ message: "Server error" });
    return;
  }
};
const combinedController = { test, ...categoryController, remove: deleteOne };
export default combinedController;
