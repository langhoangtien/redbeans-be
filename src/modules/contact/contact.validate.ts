import { z } from "zod";

export const contactSchema = z
  .object({
    name: z.string().max(200).optional(),
    email: z.string().email().max(100),
    message: z.string().max(1000).optional(),
    phone: z.string().max(20).optional(),
    issueType: z.string().max(200).optional(),
  })
  .strict();
export type ContactInput = z.infer<typeof contactSchema>;
export const contactSchemaUpdate = contactSchema.partial().strict();
