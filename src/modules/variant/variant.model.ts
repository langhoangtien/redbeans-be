import { Document, Model, model, Schema } from "mongoose";

export interface IVariant extends Document {
  productId: Schema.Types.ObjectId; // Tham chiếu đến Product
  attributes?: { name: string; value: string }[]; // Ví dụ: { color: "red", size: "M" }
  price: number;
  compareAtPrice: number;
  image: string;
  stock: number; // Số lượng tồn kho hiện tại của biến thể
  sku?: string;
}

const variantSchema = new Schema<IVariant>(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    attributes: [
      {
        name: { type: String, required: true },
        value: { type: String, required: true },
      },
    ],
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    compareAtPrice: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    image: {
      type: String,
      maxLength: 200,
      default: "",
    },
    stock: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    sku: String,
  },
  { timestamps: true, versionKey: false }
);

const Variant: Model<IVariant> = model<IVariant>("Variant", variantSchema);
export default Variant;
