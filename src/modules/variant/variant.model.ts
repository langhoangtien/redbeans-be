import { Document, Model, model, Schema } from "mongoose";

export interface IVariant extends Document {
  productId?: Schema.Types.ObjectId;
  attributes: IVariantAttribute[];
  price: number;
  compareAtPrice: number;
  image: string;
  stock: number;
  sku: string;
  key: string;
  title: string;
}

export interface IVariantRequest {
  productId?: string;
  attributes: IVariantAttribute[];
  price: number;
  compareAtPrice: number;
  image: string;
  stock: number;
  sku: string;
  key: string;
  title: string;
}

export interface IVariantAttribute {
  name: string;
  title: string;
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
        value: { type: String },
        title: { type: String },
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
    title: {
      type: String,
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
