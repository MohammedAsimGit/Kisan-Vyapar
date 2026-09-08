import type { QueryClient } from "@tanstack/react-query";

/**
 * Query key factory for the client-side server-state cache.
 *
 * Every key is scoped by role + authenticated user id so one user's cached
 * data can never appear for another user, and by the resource shape so
 * filters/pagination stay isolated (returning to a previous filter or page
 * shows that exact cached result). The prefix `["kv", role, userId, ...]` is
 * what targeted invalidation matches on.
 */

export type CachedRole = "farmer" | "vendor";

/** Farmer buyer-requirements digest query state (filter chips + pagination). */
export interface DigestQueryParams {
  page?: number;
  filter?: string;
  sort?: string;
}

export const kvKeys = {
  /** Authenticated session — same key for every user, data is server-derived. */
  session: ["kv", "session"] as const,

  farmer: (userId: string) => ({
    all: ["kv", "farmer", userId] as const,
    produce: ["kv", "farmer", userId, "produce"] as const,
    dashboard: ["kv", "farmer", userId, "dashboard"] as const,
    offers: (page: number) => ["kv", "farmer", userId, "offers", { page }] as const,
    offer: (offerId: string) => ["kv", "farmer", userId, "offers", { id: offerId }] as const,
    requirements: (params: DigestQueryParams) =>
      ["kv", "farmer", userId, "requirements", params] as const,
  }),

  vendor: (userId: string) => ({
    all: ["kv", "vendor", userId] as const,
    requirements: ["kv", "vendor", userId, "requirements"] as const,
    profile: ["kv", "vendor", userId, "profile"] as const,
    dashboard: ["kv", "vendor", userId, "dashboard"] as const,
    offers: (page: number, requirementId?: string) =>
      ["kv", "vendor", userId, "offers", { page, requirementId }] as const,
    offer: (offerId: string) => ["kv", "vendor", userId, "offers", { id: offerId }] as const,
  }),
} as const;

export function scopedKeys(role: CachedRole, userId: string) {
  return role === "farmer" ? kvKeys.farmer(userId) : kvKeys.vendor(userId);
}

/* ------------------------------------------------------------------------- */
/* Targeted invalidation helpers                                              */
/* ------------------------------------------------------------------------- */

/** Offers list + offer detail for one user. */
export function invalidateOffers(
  queryClient: QueryClient,
  role: CachedRole,
  userId: string,
): Promise<void> {
  return queryClient.invalidateQueries({
    queryKey: ["kv", role, userId, "offers"],
  });
}

/** Vendor offer list filtered by a specific requirement (incl. pagination). */
export function invalidateRequirementOffers(
  queryClient: QueryClient,
  userId: string,
  requirementId: string,
): Promise<void> {
  return queryClient.invalidateQueries({
    queryKey: ["kv", "vendor", userId, "offers", { requirementId }],
  });
}

/** Vendor buying-requirements list (also refreshes its dashboard data). */
export function invalidateVendorRequirements(
  queryClient: QueryClient,
  userId: string,
): Promise<void> {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: ["kv", "vendor", userId, "requirements"] }),
    queryClient.invalidateQueries({ queryKey: ["kv", "vendor", userId, "dashboard"] }),
  ]).then(() => undefined);
}

/** Farmer produce list (also refreshes the farmer dashboard). */
export function invalidateFarmerProduce(
  queryClient: QueryClient,
  userId: string,
): Promise<void> {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: ["kv", "farmer", userId, "produce"] }),
    queryClient.invalidateQueries({ queryKey: ["kv", "farmer", userId, "dashboard"] }),
  ]).then(() => undefined);
}

/**
 * After a negotiation action (offer / counter / accept / reject / withdraw),
 * everything that reflects negotiation state for the acting user must refresh:
 * offer lists + detail, the dashboard counts, and — for a vendor — requirement
 * status/remaining quantity.
 */
export function invalidateAfterNegotiationAction(
  queryClient: QueryClient,
  role: CachedRole,
  userId: string,
): Promise<void> {
  const keys = [
    ["kv", role, userId, "offers"],
    ["kv", role, userId, "dashboard"],
  ];
  if (role === "vendor") {
    keys.push(["kv", role, userId, "requirements"]);
  }
  return Promise.all(
    keys.map((queryKey) => queryClient.invalidateQueries({ queryKey })),
  ).then(() => undefined);
}