import { z } from "zod";
import { USER_ROLES } from "@/constants/roles";

const PHONE_PATTERN = /^\+?[0-9]{10,15}$/;

const optionalEmail = z
  .string()
  .trim()
  .toLowerCase()
  .email()
  .max(200)
  .optional()
  .or(z.literal("").transform(() => undefined));

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters long.")
  .max(72, "Password must not exceed 72 characters.")
  .regex(
    /^(?=.*[A-Za-z])(?=.*\d).+$/,
    "Password must contain at least one letter and one number.",
  );

export const registerSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Please enter your name.")
    .max(120, "Name must not exceed 120 characters."),
  phone: z
    .string()
    .trim()
    .regex(PHONE_PATTERN, "Phone number must contain 10 to 15 digits, optionally prefixed with +."),
  email: optionalEmail,
  password: passwordSchema,
  role: z.enum([USER_ROLES.FARMER, USER_ROLES.VENDOR]),
});

export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  identifier: z
    .string()
    .trim()
    .min(3, "Enter your phone number or email.")
    .max(200, "Please enter a valid phone number or email."),
  password: z.string().min(1, "Please enter your password.").max(72),
});

export type LoginInput = z.infer<typeof loginSchema>;
