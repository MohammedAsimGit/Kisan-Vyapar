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

function startOfTodayUtc(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

const requiredByDateSchema = z
  .string()
  .trim()
  .min(1, "Please choose when you need the produce.")
  .refine(
    (value) => dateOnly.test(value) && !Number.isNaN(new Date(value).getTime()),
    "Please enter a valid date.",
  )
  .refine(
    (value) => new Date(`${value}T00:00:00Z`).getTime() >= startOfTodayUtc().getTime(),
    "The required-by date cannot be in the past.",
  );

const geoPointSchema = z.object({
  type: z.literal("Point"),
  coordinates: z.tuple([
    z.number().min(-180).max(180),
    z.number().min(-90).max(90),
  ]),
});

/**
 * Preferred location. District and state are required (mirroring how produce is
 * described) so the matching engine can honestly compare regions.
 */
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

const rangeFields = {
  targetPriceMin: z
    .number({ error: "Please enter the minimum price you can pay." })
    .min(0, "The minimum price cannot be negative."),
  targetPriceMax: z
    .number({ error: "Please enter the maximum price you can pay." })
    .min(0, "The maximum price cannot be negative."),
};

export const buyerRequirementSchema = z
  .object({
    ...rangeFields,
    crop: z
      .string()
      .trim()
      .toLowerCase()
      .min(1, "Please choose a crop.")
      .refine(isSupportedCrop, "Please choose a supported crop."),
    variety: optionalText(100, "Variety"),
    quality: z.enum(QUALITY_GRADE_VALUES, {
      message: "Please choose a quality.",
    }),
    quantity: z
      .number({ error: "Please enter a quantity." })
      .positive("Quantity must be more than zero.")
      .max(1_000_000, "Quantity is too large."),
    unit: z.enum(MEASUREMENT_UNIT_VALUES, {
      message: "Please choose a unit.",
    }),
    requiredBy: requiredByDateSchema,
    notes: optionalText(400, "Notes"),
    location: locationSchema,
  })
  .superRefine((value, context) => {
    if (value.targetPriceMax < value.targetPriceMin) {
      context.addIssue({
        code: "custom",
        path: ["targetPriceMax"],
        message: "The maximum price must be at least the minimum price.",
      });
    }
  });

export type BuyerRequirementInput = z.infer<typeof buyerRequirementSchema>;

/**
 * Edits reuse the create shape as a partial patch. The target-price range rule
 * is only re-checked when both bounds are supplied in the same update.
 */
export const buyerRequirementUpdateSchema = z
  .object({
    targetPriceMin: rangeFields.targetPriceMin.optional(),
    targetPriceMax: rangeFields.targetPriceMax.optional(),
    crop: buyerRequirementSchema.shape.crop.optional(),
    variety: buyerRequirementSchema.shape.variety,
    quality: buyerRequirementSchema.shape.quality.optional(),
    quantity: buyerRequirementSchema.shape.quantity.optional(),
    unit: buyerRequirementSchema.shape.unit.optional(),
    requiredBy: requiredByDateSchema.optional(),
    notes: buyerRequirementSchema.shape.notes,
    location: buyerRequirementSchema.shape.location.optional(),
  })
  .superRefine((value, context) => {
    if (
      value.targetPriceMin !== undefined &&
      value.targetPriceMax !== undefined &&
      value.targetPriceMax < value.targetPriceMin
    ) {
      context.addIssue({
        code: "custom",
        path: ["targetPriceMax"],
        message: "The maximum price must be at least the minimum price.",
      });
    }
  });

export type BuyerRequirementUpdateInput = z.infer<typeof buyerRequirementUpdateSchema>;
