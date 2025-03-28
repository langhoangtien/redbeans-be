import { model, Schema } from "mongoose";
const reviewSchema = new Schema({
    productId: { type: String, required: true },
    customer: { type: String, required: true },
    title: { type: String },
    body: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    images: { type: [String], default: [] },
    videos: { type: [String], default: [] },
    imageUploads: { type: [String], default: [] },
    videoUploads: { type: [String], default: [] },
    reply: { type: String, default: null },
    repliedAt: { type: Date, default: null },
    isVerified: { type: Boolean, default: false },
    country: { type: String, default: null },
    liked: { type: Number, default: 0 },
    purchaseVerified: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
}, { timestamps: false });
const Review = model("Review", reviewSchema);
export default Review;
//# sourceMappingURL=review.model.js.map