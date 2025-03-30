import { Document, Model, model, ObjectId, Schema } from "mongoose";

interface IBlog extends Document {
  title: string;
  content: string;
  description?: string;
  user: ObjectId; // ID của người dùng tạo blog
  image?: string;
  slug: string;
  collections: string[]; // Danh sách ID của các Category
}

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
      type: [String],
      validate: {
        validator: function (v: string[]) {
          return v.every((str) => str.length >= 2 && str.length <= 100);
        },
        message: (props) => `${props.value} is not a valid collection ID!`,
      },
    },
  },
  { timestamps: true, versionKey: false }
);

const Blog: Model<IBlog> = model<IBlog>("Blog", blogSchema);
export default Blog;
