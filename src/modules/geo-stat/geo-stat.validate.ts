import { z } from "zod";

export const geoStatSchema = z.object({
  country: z.string().min(2).max(2),
  city: z.string().max(100).default("Unknown"),
});
