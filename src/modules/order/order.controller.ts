import mongoose, { mongo } from "mongoose";
import { Request, Response } from "express";
import model from "./order.model"; // Adjust the import path as necessary

const create = async (req: Request, res: Response) => {
  try {
    const newModel = new model(req.body);
    const newDoc = await newModel.save();
    res.status(201).json(newDoc);
  } catch (error: any) {
    if (error instanceof mongo.MongoServerError && error.code === 11000) {
      const duplicateKey = Object.keys(error.keyValue)[0];
      res.status(400).json({
        message: `${duplicateKey} already exists: ${error.keyValue[duplicateKey]}`,
      });
      return;
    }
    console.error("Error creating document:", error);
    res.status(500).json({ message: "Server error" });
    return;
  }
};

const getAll = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const docs = await model.find().skip(skip).limit(limit);

    const totalDocs = await model.countDocuments();
    res.json({
      data: docs,
      pagination: {
        total: totalDocs,
        page,
        limit,
        totalPages: Math.ceil(totalDocs / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching documents:", error);
    res.status(500).json({ message: "Server error" });
    return;
  }
};
const update = async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400).json({ message: "Invalid ID format" });
    return;
  }
  const updateData = req.body;

  try {
    const updatedDoc = await model.findByIdAndUpdate(id, updateData, {
      new: true,
    });

    if (!updatedDoc) {
      res.status(404).json({ message: "Document not found" });
      return;
    }

    res.json(updatedDoc);
  } catch (error) {
    console.error("Error updating document:", error);
    res.status(500).json({ message: "Server error" });
    return;
  }
};

const remove = async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400).json({ message: "Invalid ID format" });
    return;
  }
  try {
    const deletedDoc = await model.findByIdAndDelete(id);

    if (!deletedDoc) {
      res.status(404).json({ message: "Document not found" });
    }

    res.json({ message: "Document deleted successfully" });
  } catch (error) {
    console.error("Error deleting document:", error);
    res.status(500).json({ message: "Server error" });
    return;
  }
};

const findOne = async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400).json({ message: "Invalid ID format" });
    return;
  }
  try {
    const doc = await model.findById(id);
    if (!doc) {
      res.status(404).json({ message: "Document not found" });
      return;
    }
    res.json(doc);
  } catch (error) {
    console.error("Error fetching document:", error);
    res.status(500).json({ message: "Server error" });
    return;
  }
};

export default { create, getAll, update, remove, findOne };
