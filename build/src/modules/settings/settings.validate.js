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
    companWebsite: z.string().url().optional(),
    paypalClientId: z.string().optional(),
    paypalSecret: z.string().optional(),
    paypalMode: z.enum(["Sandbox", "Production"]).optional(),
    paypalApi: z.string().optional(),
});
//# sourceMappingURL=settings.validate.js.map