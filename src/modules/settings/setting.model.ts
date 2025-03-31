import mongoose, { Schema, Document } from "mongoose";

// Định nghĩa giao diện TypeScript cho Settings
export interface ISettings extends Document {
  companyName?: string;
  companyAddress?: string;
  companyPhone?: string;
  mailService?: "Gmail" | "Zoho" | "SendGrid";
  smtpUser?: string;
  smtpPass?: string;
  smtpPort?: string;
  smtpHost?: string;
  companWebsite?: string;
  paypalClientId?: string;
  paypalSecret?: string;
  paypalMode?: "Sandbox" | "Production";
  paypalApi?: string;
}

// Tạo Mongoose Schema dựa trên Zod Schema
const SettingsSchema = new Schema<ISettings>(
  {
    companyName: { type: String, default: "" },
    companyAddress: { type: String, default: "" },
    companyPhone: { type: String, default: "" },
    mailService: {
      type: String,
      enum: ["Gmail", "Zoho", "SendGrid"],
      default: "Zoho",
    },
    smtpUser: { type: String, default: "" },
    smtpPass: { type: String, default: "" },
    smtpPort: { type: String, default: "465" },
    smtpHost: { type: String, default: "smtp.zoho.com" },
    companWebsite: {
      type: String,
      default: "https://quitmood.net",
      validate: /^(https?:\/\/)?([\w\-]+\.)+[\w-]+(\/[\w\-./?%&=]*)?$/,
    },
    paypalClientId: { type: String, default: "" },
    paypalSecret: { type: String, default: "" },
    paypalMode: {
      type: String,
      enum: ["Sandbox", "Production"],
      default: "Sandbox",
    },
    paypalApi: { type: String, default: "https://api.sandbox.paypal.com" },
  },
  { timestamps: true }
);

// Tạo Model
const SettingsModel = mongoose.model<ISettings>("Settings", SettingsSchema);

export default SettingsModel;
