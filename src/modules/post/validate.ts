import { z } from "zod";

export const validate = z
  .object({
    title: z
      .string()
      .min(2, { message: "Title must be at least 2 characters long" })
      .max(100, { message: "Title must be less than 50 characters" })
      .nonempty({ message: "Title is required" }),
    content: z.string().optional(),
    categories: z.array(z.string()).optional(),
    slug: z
      .string()
      .nonempty({ message: "Slug is required" })
      .min(2, { message: "Slug must be at least 2 characters long" })
      .max(100, { message: "Slug must be less than 50 characters" }),
  })
  .strict();

export const updateValidate = validate.partial();
export type Post = z.infer<typeof validate>;
export type PostUpdate = z.infer<typeof updateValidate>;
