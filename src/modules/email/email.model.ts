import { Model, Document, model } from "mongoose";

import mongoose from "mongoose";

const EmailSchema = new mongoose.Schema(
  {
    sender: {
      type: String,
      required: true,
      trim: true,
    },
    messageId: {
      type: String,
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
    text: {
      type: String,
    },
    status: {
      type: String,
      enum: ["sent", "failed", "draft", "queued"],
      default: "queued",
    },
  },
  { timestamps: true, versionKey: false }
);

// Define the IEmail interface
interface IEmail extends Document {
  sender: string;
  recipient: string;
  messageI?: string;
  text?: string;
  subject: string;
  body: string;
  status: "sent" | "failed" | "draft" | "queued";
}

const Email: Model<IEmail> = model<IEmail>("Email", EmailSchema);
export default Email;
