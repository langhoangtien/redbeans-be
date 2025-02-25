import { z } from "zod";

// Zod schema cho một variant
export const variantZodSchema = z.object({
  // Dùng Record cho các thuộc tính tùy biến: key là string, value cũng là string
  attributes: z.record(z.string()),
  price: z.number().nonnegative(),
  image: z.string().min(2).max(50).optional(),
  stock: z.number().int().nonnegative(),
  sku: z.string().optional(),
});

// Zod schema cho Product
export const productZodSchema = z.object({
  title: z
    .string()
    .min(2, { message: "Title must have at least 2 characters" })
    .max(200),
  description: z.string().optional(),
  slug: z
    .string()
    .min(2)
    .max(100)
    .regex(/^[a-z0-9]+(?:(?:-|_)+[a-z0-9]+)*$/gim, {
      message:
        "Slug must contain only lowercase letters, numbers, dashes or underscores",
    }),
  categories: z.array(z.string()).optional(),
  variants: z.array(variantZodSchema).optional(), // Nếu không truyền thì có thể dùng default [] trong Mongoose
});
export const updateProductZodSchema = productZodSchema.partial();
