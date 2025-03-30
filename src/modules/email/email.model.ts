import { Model, Document, model } from "mongoose";

const mongoose = require("mongoose");

const EmailSchema = new mongoose.Schema({
  sender: {
    type: String,
    required: true,
    trim: true,
  },
  recipient: {
    type: String,
    required: true,
    trim: true,
  },
  subject: {
    type: String,
    required: true,
    trim: true,
  },
  body: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ["sent", "failed", "draft", "queued"],
    default: "queued",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Define the IEmail interface
interface IEmail extends Document {
  sender: string;
  recipient: string;
  subject: string;
  body: string;
  status: "sent" | "failed" | "draft" | "queued";
  createdAt: Date;
  updatedAt: Date;
}

const Email: Model<IEmail> = model<IEmail>("Email", EmailSchema);
export default Email;
