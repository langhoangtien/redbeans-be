import { z } from "zod";

export const cartSchema = z.object({
  products: z
    .array(
      z.object({
        slug: z
          .string()
          .min(1, { message: "Slug is required" })
          .max(200, { message: "Slug must not exceed 200 characters" })
          .regex(/^[a-z0-9]+(?:(?:-|_)+[a-z0-9]+)*$/gim, {
            message:
              "Slug must contain only lowercase letters, numbers, dashes or underscores",
          }),
        quantity: z
          .number()
          .int({ message: "Quantity must be an integer" })
          .positive({ message: "Quantity must be a positive number" })
          .max(1000, { message: "Quantity must not exceed 1000" }),
        attributes: z.record(
          z.string().max(30, {
            message: "Each attribute value must not exceed 30 characters",
          })
        ),
      })
    )
    .nonempty({ message: "Products array cannot be empty" }),
  voucher: z
    .string()
    .max(200, { message: "Voucher must not exceed 200 characters" })
    .optional(),
});

// Sử dụng:
type ICart = z.infer<typeof cartSchema>;
