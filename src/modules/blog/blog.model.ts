import { Document, Model, model, ObjectId, Schema } from "mongoose";

interface IBlog extends Document {
  title: string;
  content: string;
  description?: string;
  user: ObjectId; // ID của người dùng tạo blog
  image?: string;
  slug: string;
  collections: {
    title: string;
    value: string;
  }[];
}

const CollectionSchema = new Schema({
  title: {
    type: String,
    required: true,
    minLength: 1,
    maxLength: 100,
  },
  value: {
    type: String,
    required: true,
    minLength: 1,
    maxLength: 100,
  },
});
const blogSchema = new Schema<IBlog>(
  {
    title: {
      type: String,
      required: true,
      minLength: 2,
      maxLength: 200,
      index: true, // Thêm index cho title
    },
    content: {
      type: String,
    },
    description: {
      type: String,
    },
    image: {
      type: String,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      minLength: 2,
      maxLength: 100,
      index: true, // Thêm index cho slug
    },
    collections: {
      type: [CollectionSchema],
      default: [],
    },
  },
  { timestamps: true, versionKey: false }
);

const Blog: Model<IBlog> = model<IBlog>("Blog", blogSchema);
export default Blog;
