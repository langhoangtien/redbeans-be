import { model, Schema } from "mongoose";

const productRatingSchema = new Schema(
  {
    productId: { type: String, required: true, unique: true, index: true },

    // ===== Reviews & Stars =====
    reviewCount: { type: Number, default: 0 },
    totalRating: { type: Number, default: 0 },
    avgRating: { type: Number, default: 0 },
    starCounts: {
      1: { type: Number, default: 0 },
      2: { type: Number, default: 0 },
      3: { type: Number, default: 0 },
      4: { type: Number, default: 0 },
      5: { type: Number, default: 0 },
    },
    verifiedCount: { type: Number, default: 0 },

    // ===== Media Counters (NEW) =====
    // Tổng số ảnh (images + imageUploads) của mọi review thuộc product
    photoCount: { type: Number, default: 0 },
    // Tổng số video (videos + videoUploads) của mọi review thuộc product
    videoCount: { type: Number, default: 0 },
    // Tổng số media (photo + video)
    mediaCount: { type: Number, default: 0 },
    // Số review có ít nhất 1 media
    reviewsWithMedia: { type: Number, default: 0 },

    lastReviewAt: { type: Date, default: null },
  },
  { timestamps: true }
);

const ProductRating = model("ProductRating", productRatingSchema);
export default ProductRating;
