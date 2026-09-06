import { z } from "zod";
import { objectIdSchema } from "@/lib/validation";

/**
 * Farmer-initiated offer against a real buying requirement. The offer unit is
 * always the produce listing's unit; quantity and price are expressed in it.
 */
export const createOfferSchema = z.object({
  produceId: objectIdSchema,
  requirementId: objectIdSchema,
  quantity: z
    .number({ error: "Please enter a quantity." })
    .positive("Quantity must be more than zero.")
    .max(1_000_000, "Quantity is too large."),
  pricePerUnit: z
    .number({ error: "Please enter a price per unit." })
    .positive("Price must be more than zero.")
    .max(100_000_000, "Price is too large."),
});

export type CreateOfferInput = z.infer<typeof createOfferSchema>;

/**
 * A counter may adjust quantity and/or price. At least one must change so a
 * counter is always a deliberate new proposal.
 */
export const counterOfferSchema = z
  .object({
    quantity: z
      .number({ error: "Please enter a quantity." })
      .positive("Quantity must be more than zero.")
      .max(1_000_000, "Quantity is too large.")
      .optional(),
    pricePerUnit: z
      .number({ error: "Please enter a price per unit." })
      .positive("Price must be more than zero.")
      .max(100_000_000, "Price is too large.")
      .optional(),
    note: z
      .string()
      .trim()
      .max(400, "Note must not exceed 400 characters.")
      .optional()
      .or(z.literal("").transform(() => undefined)),
  })
  .superRefine((value, context) => {
    if (value.quantity === undefined && value.pricePerUnit === undefined) {
      context.addIssue({
        code: "custom",
        path: ["pricePerUnit"],
        message: "Change at least the quantity or the price to counter.",
      });
    }
  });

export type CounterOfferInput = z.infer<typeof counterOfferSchema>;

export const offerListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  requirementId: objectIdSchema.optional(),
});

export type OfferListQuery = z.infer<typeof offerListQuerySchema>;

export interface OfferPaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}