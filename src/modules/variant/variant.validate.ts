import { z } from "zod";

const baseVariantSchema = z.object({
  attributes: z
    .array(
      z.object({
        name: z.string().min(2).max(50),
        value: z.string().min(2).max(50),
      })
    )
    .default([]), // ✅ Mặc định là mảng rỗng

  price: z.number().nonnegative(),

  salePrice: z.number().nonnegative().optional(),

  image: z.string().min(2).max(200).optional(),

  stock: z.number().int().nonnegative({
    message: "Stock must be a nonnegative integer",
  }),

  sku: z.string().optional(),
});

// ✅ Áp dụng .refine() sau khi tách schema cơ bản
export const variantZodSchema = baseVariantSchema.refine(
  (data) => data.salePrice === undefined || data.salePrice <= data.price,
  {
    message: "Sale price must be less than price",
    path: ["salePrice"],
  }
);

// ✅ Sử dụng .partial() trên base schema
export const updateVariantSchema = baseVariantSchema.partial();

export type VariantInput = z.infer<typeof variantZodSchema>;
