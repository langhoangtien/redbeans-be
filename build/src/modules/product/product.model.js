import { model, Schema } from "mongoose";
const productSchema = new Schema({
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
}, { timestamps: true, versionKey: false });
const Product = model("Product", productSchema);
export default Product;
//# sourceMappingURL=product.model.js.map