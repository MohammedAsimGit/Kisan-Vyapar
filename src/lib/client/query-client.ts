import { QueryClient } from "@tanstack/react-query";

/**
 * Single application-level QueryClient. It lives at module scope (not in a
 * component) so the in-memory server-state cache survives normal client-side
 * navigation — pages share one cache instead of recreating it on every mount.
 *
 * Defaults:
 * - `staleTime` is a sensible base; individual queries override it with the
 *   right freshness window for their data (see `src/lib/client/api-queries.ts`).
 * - `gcTime` keeps visited data in memory for the session so back-navigation
 *   renders it instantly.
 * - A single retry avoids flapping on transient failures without hammering
 *   endpoints that are genuinely broken.
 */
export const DEFAULT_STALE_TIME = 30_000;
export const SESSION_STALE_TIME = 5 * 60_000;
export const STABLE_STALE_TIME = 5 * 60_000;
export const LIST_STALE_TIME = 60_000;
export const DYNAMIC_STALE_TIME = 20_000;

let client: QueryClient | undefined;

export function getQueryClient(): QueryClient {
  if (!client) {
    client = new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: DEFAULT_STALE_TIME,
          gcTime: 10 * 60_000,
          retry: 1,
          refetchOnWindowFocus: true,
        },
      },
    });
  }
  return client;
}