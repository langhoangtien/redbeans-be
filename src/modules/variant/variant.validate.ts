import { z } from "zod";

export const variantZodSchema = z.object({
  attributes: z
    .array(
      z.object({
        name: z.string().min(1).max(50),
        value: z.string().min(1).max(50),
      })
    )
    .default([]), // ✅ Mặc định là mảng rỗng

  price: z.number().nonnegative().optional().default(0),

  compareAtPrice: z.number().nonnegative().optional(),

  image: z.string().max(200).optional().default(""),

  stock: z.number().int().nonnegative(),

  sku: z.string().optional(),
});

// ✅ Áp dụng .refine() sau khi tách schema cơ bản

// ✅ Sử dụng .partial() trên base schema

export const updateVariantSchema = variantZodSchema.partial();

export type VariantInput = z.infer<typeof variantZodSchema>;
