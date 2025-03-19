import { z } from "zod";
import { variantZodSchema } from "../variant/variant.validate";

export const productZodSchema = z
  .object({
    name: z.string().min(2).max(200),
    description: z.string().optional(),
    image: z.string().min(2).max(200).optional(),
    slug: z.string().min(2).max(100),
    categories: z.array(z.string()).optional().default([]),
    images: z
      .array(
        z
          .string()

          .min(2)
          .max(200)
      )
      .optional()
      .default([]),
    minPrice: z
      .number()
      .nonnegative({ message: "minPrice must be nonnegative" })
      .nullable()
      .optional(),
    variantOptions: z
      .array(
        z.object({
          values: z.array(z.string()).min(1),
          name: z.string().max(50),
        })
      )
      .optional()
      .default([]),
    variants: z.array(variantZodSchema).min(1, {
      message: "There must be at least one variant",
    }),
  })
  .strict();

export type ProductInput = z.infer<typeof productZodSchema>;
export const updateProductZodSchema = productZodSchema.partial();
