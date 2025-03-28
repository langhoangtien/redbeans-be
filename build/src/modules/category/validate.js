import { z } from "zod";
export const validate = z
    .object({
    name: z
        .string()
        .min(2, { message: "Category name must be at least 2 characters long" })
        .max(50, { message: "Category name must be less than 50 characters" })
        .nonempty({ message: "Category name is required" }),
    description: z
        .string()
        .max(200, { message: "Description must be less than 200 characters" })
        .optional(),
    slug: z
        .string()
        .nonempty({ message: "Slug is required" })
        .min(2, { message: "Slug must be at least 2 characters long" })
        .max(50, { message: "Slug must be less than 50 characters" }),
})
    .strict();
export const updateValidate = validate.partial();
//# sourceMappingURL=validate.js.map