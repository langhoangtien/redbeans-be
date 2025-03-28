import { model, Schema } from "mongoose";
const variantSchema = new Schema({
    productId: {
        type: Schema.Types.ObjectId,
        ref: "Product",
        required: true,
    },
    attributes: [
        {
            name: { type: String, required: true },
            value: { type: String, required: true },
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
    stock: {
        type: Number,
        required: true,
        default: 0,
        min: 0,
    },
    sku: String,
}, { timestamps: true, versionKey: false });
const Variant = model("Variant", variantSchema);
export default Variant;
//# sourceMappingURL=variant.model.js.map