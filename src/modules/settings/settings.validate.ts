import { z } from "zod";

export const settingsSchema = z.object({
  companyName: z.string().optional(),
  companyAddress: z.string().optional(),
  companyPhone: z.string().optional(),
  mailService: z.enum(["Gmail", "Zoho", "SendGrid"]).optional(),
  smtpUser: z.string().optional(),
  smtpPass: z.string().optional(),
  smtpPort: z.string().optional(),
  smtpHost: z.string().optional(),
  companyWebsite: z.string().url().optional(),
  paypalClientId: z.string().optional(),
  paypalSecret: z.string().optional(),
  paypalMode: z.enum(["Sandbox", "Production"]).optional(),
  paypalApi: z.string().optional(),
  facebookPixelId: z.string().optional(),
  tokens: z
    .array(
      z.object({
        domain: z.string().min(1, "Domain is required"),
        accessToken: z.string().min(1, "Access token is required"),
        version: z.string().optional().default("2025-01"),
      })
    )
    .optional()
    .default([]),
});

export type SettingsInput = z.infer<typeof settingsSchema>;
