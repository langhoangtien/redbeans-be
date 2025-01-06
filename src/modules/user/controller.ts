import User from "./model";
import baseController from "../base/controller";
import { Request, Response } from "express";
import mongoose, { mongo } from "mongoose";
import { hashPassword } from "@/utilities";

const userController = baseController(User, "-password -salt");
const create = async (req: Request, res: Response) => {
  try {
    const userDto = { ...req.body };
    const { salt, hash } = hashPassword(userDto.password);
    userDto.salt = salt;
    userDto.password = hash;
    const newModel = new User(userDto);

    const newDoc = await newModel.save();
    res.status(201).json(newDoc);
    return;
  } catch (error: any) {
    if (error instanceof mongo.MongoServerError && error.code === 11000) {
      const duplicateKey = Object.keys(error.keyValue)[0];
      res.status(400).json({
        message: `${duplicateKey} already exists: ${error.keyValue[duplicateKey]}`,
      });
    }
    console.error("Error creating document:", error);
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
    const doc = await User.findById(id).select("-password -salt");
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

const update = async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400).json({ message: "Invalid ID format" });
    return;
  }

  const updateData = { ...req.body };
  if (updateData.password) {
    const { salt, hash } = hashPassword(req.body.password);
    updateData.salt = salt;
    updateData.password = hash;
  }

  try {
    const updatedDoc = await User.findByIdAndUpdate(id, updateData, {
      new: true,
    }).select("-password -salt");

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
const combineControllers = { ...userController, create, update, findOne };
export default combineControllers;
