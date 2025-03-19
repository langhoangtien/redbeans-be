import { z } from "zod";

export const cartSchema = z.object({
  products: z
    .array(
      z.object({
        id: z.string().min(1).max(200),
        quantity: z.number().int().positive().max(1000),
      })
    )
    .nonempty({ message: "Products array cannot be empty" }),
  voucher: z
    .string()
    .max(200, { message: "Voucher must not exceed 200 characters" })
    .optional(),
  shippingAddress: z.object({
    fullName: z.string().min(1).max(200),
    address: z.string().min(1).max(200),
    address2: z.string().max(200).optional(),
    city: z.string().min(1).max(200),
    state: z.string().max(200).optional(),
    postalCode: z.string().min(1).max(200),
    country: z.string().min(2).max(2),
    phone: z.string().min(7).max(15).optional(),
  }),
  billingAddress: z.object({
    fullName: z.string().min(1).max(200),
    phone: z.string().min(7).max(15).optional(),
    address: z.string().min(1).max(200),
    address2: z.string().max(200).optional(),
    city: z.string().min(1).max(200),
    state: z.string().max(200).optional(),
    postalCode: z.string().min(1).max(200),
    country: z.string().min(2).max(2),
  }),
});

export type ICart = z.infer<typeof cartSchema>;
