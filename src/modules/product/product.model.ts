import { Document, Model, model, Schema } from "mongoose";

export interface IVariantOption {
  type: string;
  name: string;
  key: string;
  values: IVariantOptionValue[];
}

export interface IVariantOptionValue {
  title: string;
  value: string;
  price: number;
  compareAtPrice: number;
  image: string;
  color: string;
}

export interface IProduct extends Document {
  name: string;
  description: string;
  introduction: string;
  slug: string;
  categories: string[];
  collections?: {
    title: string;
    value: string;
  }[];
  image?: string;
  images?: string[]; // Mảng URL ảnh
  minPrice?: number;
  minCompareAtPrice?: number;
  variantOptions: IVariantOption[];
  variants: string[];
  rating?: number[];
  averageRating?: number;
  totalRating?: number;
  accordion?: string;
  accordionItems?: {
    title: string;
    value: string;
  }[];
}

const AccordionSchema = new Schema({
  title: {
    type: String,
    required: true,
  },
  value: {
    type: String,
    required: true,
  },
});
const CollectionSchema = new Schema({
  title: {
    type: String,
    required: true,
  },
  value: {
    type: String,
    required: true,
  },
});
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
    introduction: {
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
    rating: {
      type: [Number],
      default: [0, 0, 0, 0, 0],
    },
    averageRating: {
      type: Number,
      default: 0,
    },
    totalRating: {
      type: Number,
      default: 0,
    },
    accordion: {
      type: String,
    },
    accordionItems: {
      type: [AccordionSchema],
      default: [],
    },
    collections: [
      {
        type: CollectionSchema,
        default: [],
      },
    ],
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
