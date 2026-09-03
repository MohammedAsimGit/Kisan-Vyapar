import { z } from "zod";
import { VENDOR_BUSINESS_TYPE_VALUES } from "@/constants/vendor-business-types";

const optionalText = (maxLength: number) =>
  z
    .string()
    .trim()
    .max(maxLength)
    .optional()
    .or(z.literal("").transform(() => undefined));

const requiredText = (label: string, maxLength: number) =>
  z
    .string()
    .trim()
    .min(1, `Please enter your ${label}.`)
    .max(maxLength);

export const farmerProfileSchema = z.object({
  bio: optionalText(400),
  village: optionalText(120),
  district: requiredText("district", 120),
  state: requiredText("state", 120),
  pincode: optionalText(20),
});

export type FarmerProfileInput = z.infer<typeof farmerProfileSchema>;

export const vendorProfileSchema = z.object({
  businessName: requiredText("business name", 160),
  businessType: z.enum(VENDOR_BUSINESS_TYPE_VALUES),
  city: optionalText(120),
  district: optionalText(120),
  state: requiredText("state", 120),
  pincode: optionalText(20),
});

export type VendorProfileInput = z.infer<typeof vendorProfileSchema>;

export const profileSchemaByRole = {
  farmer: farmerProfileSchema,
  vendor: vendorProfileSchema,
} as const;
