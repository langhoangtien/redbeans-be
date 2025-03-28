import { z } from "zod";
export const validate = z.object({
    username: z
        .string()
        .min(3, { message: "Username must be at least 3 characters long" })
        .max(20, { message: "Username must be less than 20 characters" })
        .nonempty({ message: "Username is required" }),
    password: z
        .string()
        .min(6, { message: "Password must be at least 6 characters long" })
        .nonempty({ message: "Password is required" }),
    email: z
        .string()
        .email({ message: "Please enter a valid email" })
        .nonempty({ message: "Email is required" })
        .max(100, { message: "Email must be less than 100 characters" }),
    image: z
        .string()
        .max(200, { message: "Image must be less than 200 characters" })
        .optional(),
    fullName: z
        .string()
        .nonempty({ message: "Full name is required" })
        .min(2, { message: "Full name must be at least 2 characters long" })
        .max(50, { message: "Full name must be less than 50 characters" }),
    _id: z.string().max(100).optional(),
    createdAt: z.string().max(50).optional(),
    updatedAt: z.string().max(50).optional(),
    _v: z.number().int().optional(),
});
export const updateValidate = validate.partial();
//# sourceMappingURL=validate.js.map