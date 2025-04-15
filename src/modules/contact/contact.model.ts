import { model, Schema } from "mongoose";

const contactSchema = new Schema(
  {
    name: {
      type: String,
      maxLength: 200,
    },
    email: {
      type: String,
      required: true,
      maxLength: 100,
    },
    message: {
      type: String,
      maxLength: 1000,
    },
    phone: {
      type: String,
      maxLength: 20,
    },
    issueType: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

const Conact = model("Contact", contactSchema);
export default Conact;
