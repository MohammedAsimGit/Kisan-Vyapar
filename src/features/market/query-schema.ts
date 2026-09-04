import { z } from "zod";
import { isSupportedCrop } from "@/constants/crops";

export const marketPricesQuerySchema = z.object({
  crop: z
    .string()
    .trim()
    .toLowerCase()
    .optional()
    .refine((value) => !value || isSupportedCrop(value), {
      message: "Please provide a supported crop.",
    }),
  commodity: z.string().trim().min(1).max(200).optional(),
  state: z.string().trim().min(1).max(120).optional(),
  district: z.string().trim().min(1).max(120).optional(),
  market: z.string().trim().min(1).max(200).optional(),
  from: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "from must be a valid date")
    .optional(),
  to: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "to must be a valid date")
    .optional(),
  limit: z.coerce.number().int().min(1).max(100).default(25),
});

export type MarketPricesQuery = z.infer<typeof marketPricesQuerySchema>;

export function readSearchParams(
  searchParams: URLSearchParams,
): Record<string, string> {
  return Object.fromEntries(searchParams.entries());
}
