import { z } from "zod";
import { variantZodSchema } from "../variant/variant.validate";

export const productZodSchema = z
  .object({
    title: z
      .string()
      .min(2, { message: "Title must have at least 2 characters" })
      .max(200, { message: "Title must not exceed 200 characters" }),
    description: z.string().optional(),
    image: z
      .string()
      .min(2, { message: "Image URL must have at least 2 characters" })
      .max(200, { message: "Image URL must not exceed 200 characters" })
      .optional(),
    slug: z
      .string()
      .min(2, { message: "Slug must have at least 2 characters" })
      .max(100, { message: "Slug must not exceed 100 characters" }),
    categories: z.array(z.string()).optional().default([]),
    images: z
      .array(
        z
          .string()
          .url({ message: "Each image must be a valid URL" })
          .min(2, { message: "Image URL must have at least 2 characters" })
          .max(200, { message: "Image URL must not exceed 200 characters" })
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
