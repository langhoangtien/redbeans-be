import { z } from "zod";
export const emailSchema = z.object({
    sender: z.string().email(), // Đảm bảo sender là một email hợp lệ
    recipient: z.string().email(), // Đảm bảo recipient là một email hợp lệ
    subject: z.string(),
    body: z.string(),
    status: z.enum(["sent", "failed", "draft", "queued"]), // Status phải là một trong các giá trị 'sent', 'failed', 'draft', 'queued'
});
export const updateEmailSchema = emailSchema.partial(); // Chỉ định các trường có thể cập nhật
//# sourceMappingURL=email.validate.js.map