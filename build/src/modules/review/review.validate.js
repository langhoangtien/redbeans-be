import { z } from "zod";
export const reviewSchema = z.object({
    productId: z.string().min(1).max(255),
    customer: z.string().min(1).max(255),
    title: z.string().max(255),
    body: z.string().min(1).max(2000),
    rating: z.number().int().min(1).max(5),
    images: z.array(z.string().url()).optional(), // Mảng chứa URL hình ảnh (có thể rỗng)
    videos: z.array(z.string().url()).optional(), // Mảng chứa URL video (có thể rỗng)
    imageUploads: z.array(z.string()).optional(), // Mảng chứa ID hình ảnh (có thể rỗng)
    videoUploads: z.array(z.string()).optional(), // Mảng chứa ID video (có thể rỗng)
    reply: z.string().nullable().optional(), // Phản hồi từ quản trị viên (có thể null)
    repliedAt: z.string().datetime().nullable().optional(), // Thời gian phản hồi (có thể null)
    isVerified: z.boolean().optional(), // Đánh dấu đã xác thực
    country: z.string().min(2).max(2).nullable().optional(), // Mã quốc gia (có thể null)
    liked: z.number().int().nonnegative().nullable().optional(), // Số lượt thích (có thể null)
    purchaseVerified: z.boolean().optional(),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional(),
});
export const reviewsSchema = z.array(reviewSchema);
export const updateReviewSchema = reviewSchema.partial();
//# sourceMappingURL=review.validate.js.map