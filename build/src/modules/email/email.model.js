import { model } from "mongoose";
import mongoose from "mongoose";
const EmailSchema = new mongoose.Schema({
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
}, { timestamps: true, versionKey: false });
const Email = model("Email", EmailSchema);
export default Email;
//# sourceMappingURL=email.model.js.map