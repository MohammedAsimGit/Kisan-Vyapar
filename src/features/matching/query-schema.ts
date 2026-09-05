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

/**
 * Parses Next.js page `searchParams` (string | string[] | undefined) into a
 * validated match query with defaults, ready for server components.
 */
export async function matchQueryFromPageParams(
  searchParams: Promise<Record<string, string | string[] | undefined>> | Record<string, string | string[] | undefined>,
): Promise<MatchQuery> {
  const params = await searchParams;
  const urlSearchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (typeof value === "string") {
      urlSearchParams.set(key, value);
    } else if (Array.isArray(value) && value.length > 0) {
      urlSearchParams.set(key, value[0]);
    }
  }
  return matchQuerySchema.parse(readSearchParams(urlSearchParams));
}
