import { Document, Model, model, Schema } from "mongoose";

export interface IVariant extends Document {
  productId: Schema.Types.ObjectId; // Tham chiếu đến Product
  attributes: Record<string, string>; // Ví dụ: { color: "red", size: "M" }
  price: number;
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
    attributes: {
      type: Map,
      of: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    image: {
      type: String,
      minLength: 2,
      maxLength: 200,
    },
    stock: {
      type: Number,
      required: true,
      default: 0,
    },
    sku: String,
  },
  { timestamps: true, versionKey: false }
);

const Variant: Model<IVariant> = model<IVariant>("Variant", variantSchema);
export default Variant;
