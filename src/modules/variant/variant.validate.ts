import { z } from "zod";

export const variantZodSchema = z.object({
  attributes: z
    .array(
      z.object({
        name: z.string().min(1).max(50),
        title: z.string().min(1).max(50),
        value: z.string().max(50).optional(),
        color: z.string().max(10).optional(),
        image: z.string().max(200).optional(),
        key: z.string().max(50).optional(),
      })
    )
    .default([]), // ✅ Mặc định là mảng rỗng

  price: z.number().nonnegative().optional().default(0),

  compareAtPrice: z.number().nonnegative().optional(),

  image: z.string().max(200).optional().default(""),

  stock: z.number().int().nonnegative(),

  sku: z.string().optional(),
  title: z.string().optional(),
  key: z.string().optional(),
});

// ✅ Áp dụng .refine() sau khi tách schema cơ bản

// ✅ Sử dụng .partial() trên base schema

export const updateVariantSchema = variantZodSchema.partial();

export type VariantInput = z.infer<typeof variantZodSchema>;
