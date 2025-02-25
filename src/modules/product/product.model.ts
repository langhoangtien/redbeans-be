import { Document, Model, model, Schema } from "mongoose";

interface IVariant {
  attributes: Record<string, string>; // Ví dụ: { color: "red", size: "M" }
  price: number;
  image: string;
  stock: number; // Số lượng tồn kho hiện tại của biến thể
  sku?: string;
}

export interface IProduct extends Document {
  title: string;
  description: string;
  slug: string;
  categories: string[];
  variants: IVariant[];
}

const variantSchema = new Schema<IVariant>(
  {
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
  { _id: false }
);

const productSchema = new Schema<IProduct>(
  {
    title: {
      type: String,
      required: true,
      minLength: 2,
      maxLength: 200,
      index: true,
    },
    description: String,
    slug: {
      type: String,
      required: true,
      unique: true,
      minLength: 2,
      maxLength: 100,
      index: true,
    },
    categories: {
      type: [String],
      default: [],
    },
    variants: {
      type: [variantSchema],
      default: [],
    },
  },
  { timestamps: true, versionKey: false }
);

// Tùy chọn: tạo index hỗ trợ tìm kiếm theo thuộc tính biến thể nếu cần
// productSchema.index({
//   "variants.attributes.color": 1,
//   "variants.attributes.size": 1,
// });

const Product: Model<IProduct> = model<IProduct>("Product", productSchema);
export default Product;
