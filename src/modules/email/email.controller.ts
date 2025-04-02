import nodemailer from "nodemailer";
import model from "./email.model.js"; // Đảm bảo đường dẫn đúng đến model của bạn
import mongoose, { mongo } from "mongoose";
import { Request, Response } from "express";

import { getSettings } from "../settings/settings.controller.js";
import ErrorMessage from "../error/error.model.js";
// Cấu hình transporter với tài khoản Gmail

interface ISendEmailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}
export async function sendEmail({
  to,
  subject,
  text,
  html,
}: ISendEmailOptions): Promise<void> {
  const settings = await getSettings();
  const transporter = nodemailer.createTransport({
    host: settings.smtpHost || process.env.SMTP_HOST,
    port: parseInt(settings.smtpPort || process.env.SMTP_PORT || "587"),
    secure: parseInt(settings.smtpPort) === 465, // true for 465, false for other ports
    auth: {
      user: settings.smtpUser || process.env.SMTP_USER,
      pass: settings.smtpPass || process.env.SMTP_PASS,
    },
  } as nodemailer.TransportOptions);
  try {
    const info = await transporter.sendMail({
      from: `${settings.companyName || "Quit Mood"} <${
        settings.smtpUser || process.env.SMTP_USER
      }>`,
      to,
      subject,
      text,
      html,
    });

    const email = new model({
      sender: settings.smtpUser || "contact@quitmood.net",
      recipient: to,
      messageId: info.messageId,
      subject,
      text: text,
      body: html,
      status: "sent", // Status có thể là "sent", "failed", v.v.
    });

    await email.save();
  } catch (error) {
    const errorMessage = new ErrorMessage({ error: JSON.stringify(error) });
    await errorMessage.save();
    const email = new model({
      sender: settings.smtpUser || "contact@quitmood.net",
      recipient: to,
      subject,
      text: text,
      body: html,
      status: "failed", // Status có thể là "sent", "failed", v.v.
    });
    await email.save();
  }
}

// Gọi thử hàm gửi email

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
    const search = (req.query.search as string)?.trim() || "";
    const skip = (page - 1) * limit;

    let query: any = {};
    if (search) {
      query.$or = [
        { sender: { $regex: search, $options: "i" } }, // Không phân biệt hoa thường
        { recipient: { $regex: search, $options: "i" } },
      ];
    }

    const [docs, totalDocs] = await Promise.all([
      model
        .find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select("-body"),
      model.countDocuments(query),
    ]);
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
      return;
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

const deleteMany = async (req: Request, res: Response) => {
  const { ids } = req.body;

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    res.status(400).json({ message: "Invalid IDs format" });
    return;
  }
  if (!ids.every((id: any) => mongoose.Types.ObjectId.isValid(id))) {
    res.status(400).json({ message: "One or more IDs are invalid" });
    return;
  }
  try {
    const deletedDocs = await model.deleteMany({ _id: { $in: ids } });

    if (deletedDocs.deletedCount === 0) {
      res.status(404).json({ message: "Document not found" });
      return;
    }

    res.json({ message: "Documents deleted successfully" });
  } catch (error) {
    console.error("Error deleting documents:", error);
    res.status(500).json({ message: "Server error" });
    return;
  }
};
export default { create, getAll, update, remove, findOne, deleteMany };
