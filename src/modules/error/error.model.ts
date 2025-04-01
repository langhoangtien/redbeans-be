import { model, Schema } from "mongoose";

const errorMessageSchema = new Schema(
  {
    error: { type: String, required: true },
  },
  { timestamps: true }
);

const ErrorMessage = model("ErrorMessage", errorMessageSchema);
export default ErrorMessage;
