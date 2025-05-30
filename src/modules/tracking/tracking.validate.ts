import { z } from "zod";

export const trackingSchema = z.object({
  email: z.string().email("Invalid email format").max(255, "Email is too long"),
  orderNumber: z
    .string()
    .min(1, "Order number is required")
    .max(50, "Order number is too long"),
});

export type TrackingInput = z.infer<typeof trackingSchema>;
