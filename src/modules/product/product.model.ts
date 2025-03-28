import { Document, Model, model, Schema } from "mongoose";

export interface IProduct extends Document {
  name: string;
  description: string;
  slug: string;
  categories: string[];
  image?: string;
  images?: string[]; // Mảng URL ảnh
  minPrice?: number;
  minCompareAtPrice?: number;
  variantOptions: Record<string, string[]>;
  variants: string[];
}

const productSchema = new Schema<IProduct>(
  {
    name: {
      type: String,
      required: true,
      minLength: 1,
      maxLength: 200,
      index: true,
    },
    description: {
      type: String,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      minLength: 1,
      maxLength: 100,
      index: true,
    },
    categories: {
      type: [String],
      default: [],
    },
    image: {
      type: String,
      default: "",
      maxLength: 100,
    },
    images: {
      type: [String],
      default: [],
    },
    minPrice: {
      type: Number,
      default: 0,
      min: 0,
    },
    minCompareAtPrice: {
      type: Number,
      default: 0,
      min: 0,
    },
    variantOptions: {
      type: Schema.Types.Mixed,
      default: {},
    },
    variants: [
      {
        type: Schema.Types.ObjectId,
        ref: "Variant",
        required: true,
      },
    ],
  },
  { timestamps: true, versionKey: false }
);

const Product: Model<IProduct> = model<IProduct>("Product", productSchema);
export default Product;
