import { z } from "zod";
import { variantZodSchema } from "../variant/variant.validate.js";

export const productZodSchema = z.object({
  _id: z.string().optional(),
  name: z.string().min(1).max(200),
  rating: z.array(z.number().int()).optional().default([0, 0, 0, 0, 0]),
  description: z.string().optional(),
  introduction: z.string().max(1000).optional(),
  image: z.string().max(200).optional(),
  slug: z.string().min(1).max(100),
  categories: z.array(z.string()).optional().default([]),
  accordion: z.string().optional(),
  collections: z
    .array(
      z.object({
        title: z.string().max(100),
        value: z.string().max(100),
      })
    )
    .optional()
    .default([]),

  accordionItems: z
    .array(
      z.object({
        title: z.string().max(100),
        value: z.string().max(700),
      })
    )
    .optional()
    .default([]),

  images: z
    .array(
      z
        .string()

        .max(200)
    )
    .optional()
    .default([]),
  minPrice: z
    .number()
    .nonnegative({ message: "minPrice must be nonnegative" })
    .nullable()
    .optional(),
  minCompareAtPrice: z.number().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
  variantOptions: z
    .array(
      z.object({
        values: z.array(
          z.object({
            value: z.string().max(50),
            title: z.string().max(50),
            image: z.string().max(50),
            color: z.string().max(10),
            price: z.number().optional(),
            compareAtPrice: z.number().optional(),
          })
        ),
        name: z.string().max(50),
        key: z.string().max(50),
        type: z
          .enum(["select", "button", "color", "radio", "image"])
          .default("button"),
      })
    )
    .optional()
    .default([]),
  variants: z.array(variantZodSchema).min(1, {
    message: "There must be at least one variant",
  }),
});
// .strict();

export type ProductInput = z.infer<typeof productZodSchema>;
export const updateProductZodSchema = productZodSchema.partial();
