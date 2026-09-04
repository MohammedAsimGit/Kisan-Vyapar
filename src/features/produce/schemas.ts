import { z } from "zod";
import { isSupportedCrop } from "@/constants/crops";
import { MEASUREMENT_UNIT_VALUES } from "@/constants/measurement-units";
import { QUALITY_GRADE_VALUES } from "@/constants/quality-grades";

const optionalText = (maxLength: number, label: string) =>
  z
    .string()
    .trim()
    .max(maxLength, `${label} must not exceed ${maxLength} characters.`)
    .optional()
    .or(z.literal("").transform(() => undefined));

const requiredText = (label: string, maxLength: number) =>
  z
    .string()
    .trim()
    .min(1, `Please enter your ${label}.`)
    .max(maxLength, `${label} must not exceed ${maxLength} characters.`);

const dateOnly = /^\d{4}-\d{2}-\d{2}$/;

const harvestDateSchema = z
  .string()
  .trim()
  .min(1, "Please choose when your crop will be ready.")
  .refine(
    (value) => dateOnly.test(value) && !Number.isNaN(new Date(value).getTime()),
    "Please enter a valid date.",
  );

const geoPointSchema = z.object({
  type: z.literal("Point"),
  coordinates: z.tuple([
    z.number().min(-180, "Longitude must be between -180 and 180.").max(180, "Longitude must be between -180 and 180."),
    z.number().min(-90, "Latitude must be between -90 and 90.").max(90, "Latitude must be between -90 and 90."),
  ]),
});

const locationSchema = z.object({
  label: optionalText(200, "Location name"),
  address: z.object({
    village: optionalText(120, "Village"),
    district: requiredText("district", 120),
    state: requiredText("state", 120),
    pincode: optionalText(20, "PIN code"),
  }),
  geo: geoPointSchema.optional(),
});

export const produceListingSchema = z.object({
  crop: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, "Please choose a crop.")
    .refine(isSupportedCrop, "Please choose a supported crop."),
  variety: optionalText(100, "Variety"),
  quantity: z
    .number({ error: "Please enter a quantity." })
    .positive("Quantity must be more than zero.")
    .max(1_000_000, "Quantity is too large."),
  unit: z.enum(MEASUREMENT_UNIT_VALUES, {
    message: "Please choose a unit.",
  }),
  quality: z.enum(QUALITY_GRADE_VALUES, {
    message: "Please choose a quality.",
  }),
  location: locationSchema,
  expectedHarvestDate: harvestDateSchema,
});

export type ProduceListingInput = z.infer<typeof produceListingSchema>;

export const produceListingUpdateSchema = produceListingSchema.partial().extend({
  status: z.enum(["active", "withdrawn"]).optional(),
});

export type ProduceListingUpdateInput = z.infer<typeof produceListingUpdateSchema>;
