import { model, Schema } from "mongoose";
const postSchema = new Schema({
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
            validator: function (v) {
                return v.every((str) => str.length >= 2 && str.length <= 100);
            },
            message: (props) => `${props.value} is not a valid collection ID!`,
        },
    },
}, { timestamps: true, versionKey: false });
// Tạo index kết hợp cho slug và title để hỗ trợ truy vấn phức tạp
postSchema.index({ slug: 1, title: 1, categories: 1 });
const Post = model("Post", postSchema);
export default Post;
//# sourceMappingURL=post.model.js.map