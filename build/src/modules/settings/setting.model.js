import mongoose, { Schema } from "mongoose";
// Tạo Mongoose Schema dựa trên Zod Schema
const SettingsSchema = new Schema({
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
}, { timestamps: true });
// Tạo Model
const SettingsModel = mongoose.model("Settings", SettingsSchema);
export default SettingsModel;
//# sourceMappingURL=setting.model.js.map