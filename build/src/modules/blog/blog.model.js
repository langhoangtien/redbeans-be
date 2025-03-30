import { model, Schema } from "mongoose";
const blogSchema = new Schema({
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
            validator: function (v) {
                return v.every((str) => str.length >= 2 && str.length <= 100);
            },
            message: (props) => `${props.value} is not a valid collection ID!`,
        },
    },
}, { timestamps: true, versionKey: false });
const Blog = model("Blog", blogSchema);
export default Blog;
//# sourceMappingURL=blog.model.js.map