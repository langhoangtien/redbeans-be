import { model } from "mongoose";
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
const Email = model("Email", EmailSchema);
export default Email;
//# sourceMappingURL=email.model.js.map