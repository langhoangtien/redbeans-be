import { z } from "zod";

export const blogSchema = z.object({
  title: z
    .string()
    .min(2, { message: "Title must be at least 2 characters long" })
    .max(100, { message: "Title must be less than 50 characters" })
    .nonempty({ message: "Title is required" }),
  content: z.string().optional(),
  image: z.string().max(200).optional(),
  description: z.string().max(1000).optional(),
  collections: z
    .array(
      z.object({
        title: z.string().min(1).max(100),
        value: z.string().min(1).max(100),
      })
    )
    .optional()
    .default([]),
  slug: z
    .string()
    .nonempty({ message: "Slug is required" })
    .min(2, { message: "Slug must be at least 2 characters long" })
    .max(100, { message: "Slug must be less than 50 characters" })
    .regex(/^[a-z0-9]+(?:(?:-|_)+[a-z0-9]+)*$/gim, {
      message:
        "Slug must contain only lowercase letters, numbers, dashes or underscores",
    }),
});

export const getAllQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
    search: z.string().trim().max(100).optional().default(""),
    collection: z.string().trim().max(50).optional().default(""),
  })
  .strict();

export const updateBlogSchema = blogSchema.partial();
export type BlogInput = z.infer<typeof blogSchema>;
export type UpdateBlogInput = z.infer<typeof updateBlogSchema>;
