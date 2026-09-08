import { describe, expect, it } from "vitest";
import { QueryClient } from "@tanstack/react-query";
import {
  kvKeys,
  invalidateAfterNegotiationAction,
  invalidateFarmerProduce,
  invalidateOffers,
  invalidateRequirementOffers,
  invalidateVendorRequirements,
} from "./query-keys";

function freshClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { staleTime: 60_000, retry: false },
    },
  });
}

describe("kvKeys — user/role isolation", () => {
  it("never shares keys between different users", () => {
    const farmerA = kvKeys.farmer("user-a");
    const farmerB = kvKeys.farmer("user-b");

    expect(farmerA.produce).not.toEqual(farmerB.produce);
    expect(farmerA.offers(1)).not.toEqual(farmerB.offers(1));
    expect(farmerA.dashboard).not.toEqual(farmerB.dashboard);
    expect(farmerA.requirements({ filter: "all" })).not.toEqual(
      farmerB.requirements({ filter: "all" }),
    );
  });

  it("never shares keys between roles even for the same user", () => {
    expect(kvKeys.farmer("user-a").offers(1)).not.toEqual(
      kvKeys.vendor("user-a").offers(1),
    );
    expect(kvKeys.farmer("user-a").requirements({ filter: "all" })).not.toEqual(
      kvKeys.vendor("user-a").requirements,
    );
  });

  it("scopes offers by page and vendor offers by requirement filter", () => {
    expect(kvKeys.farmer("u").offers(1)).toEqual(kvKeys.farmer("u").offers(1));
    expect(kvKeys.farmer("u").offers(1)).not.toEqual(kvKeys.farmer("u").offers(2));

    const allVendorOffers = kvKeys.vendor("u").offers(1);
    const filteredVendorOffers = kvKeys.vendor("u").offers(1, "req-123");
    expect(allVendorOffers).not.toEqual(filteredVendorOffers);
    expect(filteredVendorOffers).toEqual(kvKeys.vendor("u").offers(1, "req-123"));
  });

  it("scopes the digest by filter/sort/page", () => {
    const base = kvKeys.farmer("u").requirements({ page: 1, filter: "all", sort: "score" });
    expect(base).toEqual(kvKeys.farmer("u").requirements({ page: 1, filter: "all", sort: "score" }));
    expect(base).not.toEqual(
      kvKeys.farmer("u").requirements({ page: 1, filter: "strong", sort: "score" }),
    );
    expect(base).not.toEqual(
      kvKeys.farmer("u").requirements({ page: 2, filter: "all", sort: "score" }),
    );
    expect(base).not.toEqual(
      kvKeys.farmer("u").requirements({ page: 1, filter: "all", sort: "deadline" }),
    );
  });

  it("keeps offer detail and offer list keys distinct", () => {
    expect(kvKeys.farmer("u").offer("offer-1")).not.toEqual(kvKeys.farmer("u").offers(1));
  });
});

describe("invalidation helpers — targeted, never over-broad", () => {
  it("invalidateOffers only touches the acting user's offer queries", async () => {
    const queryClient = freshClient();
    const farmerKeys = kvKeys.farmer("u1");

    queryClient.setQueryData(farmerKeys.offers(1), { offers: [], meta: {} });
    queryClient.setQueryData(farmerKeys.offer("offer-1"), { id: "offer-1" });
    queryClient.setQueryData(farmerKeys.produce, [{ id: "p1" }]);
    queryClient.setQueryData(kvKeys.farmer("u2").offers(1), { offers: [], meta: {} });

    await invalidateOffers(queryClient, "farmer", "u1");

    expect(queryClient.getQueryState(farmerKeys.offers(1))?.isInvalidated).toBe(true);
    expect(queryClient.getQueryState(farmerKeys.offer("offer-1"))?.isInvalidated).toBe(true);
    // Unrelated data for the same user stays fresh.
    expect(queryClient.getQueryState(farmerKeys.produce)?.isInvalidated).toBe(false);
    // Another user's cache is never invalidated.
    expect(queryClient.getQueryState(kvKeys.farmer("u2").offers(1))?.isInvalidated).toBe(false);
  });

  it("invalidateRequirementOffers only invalidates that requirement's offer page", async () => {
    const queryClient = freshClient();
    const vendorKeys = kvKeys.vendor("u1");

    queryClient.setQueryData(vendorKeys.offers(1, "req-1"), { offers: [], meta: {} });
    queryClient.setQueryData(vendorKeys.offers(1), { offers: [], meta: {} });

    await invalidateRequirementOffers(queryClient, "u1", "req-1");

    expect(queryClient.getQueryState(vendorKeys.offers(1, "req-1"))?.isInvalidated).toBe(true);
    expect(queryClient.getQueryState(vendorKeys.offers(1))?.isInvalidated).toBe(false);
  });

  it("invalidateVendorRequirements also refreshes the dashboard, not offers", async () => {
    const queryClient = freshClient();
    const vendorKeys = kvKeys.vendor("u1");

    queryClient.setQueryData(vendorKeys.requirements, { requirements: [], counts: null });
    queryClient.setQueryData(vendorKeys.dashboard, { requirements: [], counts: {}, pendingCounts: {} });
    queryClient.setQueryData(vendorKeys.offers(1), { offers: [], meta: {} });

    await invalidateVendorRequirements(queryClient, "u1");

    expect(queryClient.getQueryState(vendorKeys.requirements)?.isInvalidated).toBe(true);
    expect(queryClient.getQueryState(vendorKeys.dashboard)?.isInvalidated).toBe(true);
    expect(queryClient.getQueryState(vendorKeys.offers(1))?.isInvalidated).toBe(false);
  });

  it("invalidateFarmerProduce also refreshes the dashboard", async () => {
    const queryClient = freshClient();
    const farmerKeys = kvKeys.farmer("u1");

    queryClient.setQueryData(farmerKeys.produce, [{ id: "p1" }]);
    queryClient.setQueryData(farmerKeys.dashboard, { recent: [] });
    queryClient.setQueryData(farmerKeys.offers(1), { offers: [], meta: {} });

    await invalidateFarmerProduce(queryClient, "u1");

    expect(queryClient.getQueryState(farmerKeys.produce)?.isInvalidated).toBe(true);
    expect(queryClient.getQueryState(farmerKeys.dashboard)?.isInvalidated).toBe(true);
    expect(queryClient.getQueryState(farmerKeys.offers(1))?.isInvalidated).toBe(false);
  });

  it("invalidateAfterNegotiationAction refreshes offers + dashboard, and requirements for vendors", async () => {
    const queryClient = freshClient();
    const farmerKeys = kvKeys.farmer("u1");
    const vendorKeys = kvKeys.vendor("u1");

    queryClient.setQueryData(farmerKeys.offers(1), { offers: [], meta: {} });
    queryClient.setQueryData(farmerKeys.offer("offer-1"), { id: "offer-1" });
    queryClient.setQueryData(farmerKeys.produce, [{ id: "p1" }]);

    await invalidateAfterNegotiationAction(queryClient, "farmer", "u1");

    expect(queryClient.getQueryState(farmerKeys.offers(1))?.isInvalidated).toBe(true);
    expect(queryClient.getQueryState(farmerKeys.offer("offer-1"))?.isInvalidated).toBe(true);
    expect(queryClient.getQueryState(farmerKeys.produce)?.isInvalidated).toBe(false);

    const fresh = freshClient();
    fresh.setQueryData(vendorKeys.requirements, { requirements: [], counts: null });
    fresh.setQueryData(vendorKeys.dashboard, { requirements: [], counts: {}, pendingCounts: {} });
    fresh.setQueryData(vendorKeys.offers(1), { offers: [], meta: {} });

    await invalidateAfterNegotiationAction(fresh, "vendor", "u1");

    expect(fresh.getQueryState(vendorKeys.requirements)?.isInvalidated).toBe(true);
    expect(fresh.getQueryState(vendorKeys.dashboard)?.isInvalidated).toBe(true);
    expect(fresh.getQueryState(vendorKeys.offers(1))?.isInvalidated).toBe(true);
  });
});