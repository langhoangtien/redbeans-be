import { model, Schema } from "mongoose";
import Post from "../post/post.model.js";
const categorySchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      minLength: 2,
      maxLength: 50,
    },
    description: {
      type: String,
      minLength: 5,
      maxLength: 200,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      minLength: 2,
      maxLength: 50,
    },
  },
  { timestamps: true, versionKey: false }
);

categorySchema.pre(
  "deleteOne",
  { document: true, query: false },
  async function (next) {
    const categoryId = this._id; // ID của category đang bị xóa
    await Post.updateMany(
      { categories: categoryId },
      { $pull: { categories: categoryId } } // Loại bỏ category khỏi mảng categories
    );
    next();
  }
);
const Category = model("Category", categorySchema);
export default Category;
