import { z } from "zod";

export const MATCH_FILTER_VALUES = [
  "all",
  "strong",
  "price",
  "quality",
  "quantity",
  "nearby",
] as const;

export const MATCH_SORT_VALUES = ["score", "deadline", "nearest"] as const;

export const matchQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  filter: z.enum(MATCH_FILTER_VALUES).default("all"),
  sort: z.enum(MATCH_SORT_VALUES).default("score"),
});

export type MatchQuery = z.infer<typeof matchQuerySchema>;

export function readSearchParams(
  searchParams: URLSearchParams,
): Record<string, string> {
  return Object.fromEntries(searchParams.entries());
}
