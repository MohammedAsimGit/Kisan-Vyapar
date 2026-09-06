import { describe, expect, it } from "vitest";
import { Types } from "mongoose";
import type { OfferStatus } from "@/constants/offer-statuses";
import {
  OFFER_ACTION_LABELS,
  OFFER_PARTY_LABELS,
  partyToRespond,
  realCoordinatesOf,
  toOfferView,
  type OfferViewContext,
} from "./types";

function fixtureContext(): OfferViewContext {
  return {
    produce: {
      _id: new Types.ObjectId(),
      crop: "tomato",
      variety: "Hybrid",
      quality: "a",
      quantity: 20,
      committedQuantity: 5,
      unit: "quintal",
      pricePerUnit: 2750,
      status: "active",
      expectedHarvestDate: new Date("2026-09-20T00:00:00Z"),
      location: {
        address: { village: "Pimpalgaon", district: "Nashik", state: "Maharashtra" },
        geo: { type: "Point", coordinates: [73.9, 20.0] },
      },
    },
    requirement: {
      _id: new Types.ObjectId(),
      crop: "tomato",
      quality: "a",
      quantity: 50,
      unit: "quintal",
      allocatedQuantity: 20,
      targetPriceMin: 2600,
      targetPriceMax: 2800,
      requiredBy: new Date("2026-09-30T00:00:00Z"),
      status: "active",
      location: {
        address: { district: "Nashik", state: "Maharashtra" },
        geo: { type: "Point", coordinates: [73.9, 20.0] },
      },
    },
    farmerName: "Rahul Farm",
    businessName: "ABC Fresh Foods",
  };
}

function offerDoc() {
  const now = new Date("2026-09-10T09:10:00Z");
  const base = {
    _id: new Types.ObjectId(),
    produceListing: new Types.ObjectId(),
    requirement: new Types.ObjectId(),
    farmer: new Types.ObjectId(),
    vendor: new Types.ObjectId(),
    quantity: 20,
    unit: "quintal" as const,
    pricePerUnit: 2720,
    totalAmount: 54400,
    status: "pending" as const,
    history: [
      {
        party: "farmer" as const,
        action: "offer" as const,
        quantity: 20,
        unit: "quintal" as const,
        pricePerUnit: 2750,
        totalAmount: 55000,
        at: now,
      },
      {
        party: "vendor" as const,
        action: "counter" as const,
        quantity: 20,
        unit: "quintal" as const,
        pricePerUnit: 2680,
        totalAmount: 53600,
        note: "Can we do 2680?",
        at: new Date("2026-09-10T09:35:00Z"),
      },
      {
        party: "farmer" as const,
        action: "counter" as const,
        quantity: 20,
        unit: "quintal" as const,
        pricePerUnit: 2720,
        totalAmount: 54400,
        at: new Date("2026-09-10T09:50:00Z"),
      },
    ],
    createdAt: now,
    updatedAt: now,
  };
  return base as {
    _id: Types.ObjectId;
    produceListing: Types.ObjectId;
    requirement: Types.ObjectId;
    farmer: Types.ObjectId;
    vendor: Types.ObjectId;
    quantity: number;
    unit: "quintal";
    pricePerUnit: number;
    totalAmount: number;
    status: OfferStatus;
    history: typeof base.history;
    createdAt: Date;
    updatedAt: Date;
  };
}

describe("toOfferView", () => {
  it("maps the current terms and immutable history", () => {
    const view = toOfferView(offerDoc(), fixtureContext());
    expect(view.quantity).toBe(20);
    expect(view.pricePerUnit).toBe(2720);
    expect(view.totalAmount).toBe(54400);
    expect(view.history).toHaveLength(3);
    expect(view.history[1].partyLabel).toBe(OFFER_PARTY_LABELS.vendor);
    expect(view.history[1].actionLabel).toBe(OFFER_ACTION_LABELS.counter);
    expect(view.history[1].note).toBe("Can we do 2680?");
    expect(view.history[0].at).toBe("2026-09-10T09:10:00.000Z");
  });

  it("exposes the remaining requirement quantity honestly", () => {
    const view = toOfferView(offerDoc(), fixtureContext());
    expect(view.requirement.quantity).toBe(50);
    expect(view.requirement.remainingQuantity).toBe(30);
  });

  it("exposes available produce after commitments", () => {
    const view = toOfferView(offerDoc(), fixtureContext());
    expect(view.produce.quantity).toBe(20);
    expect(view.produce.availableQuantity).toBe(15);
  });

  it("keeps real coordinates in the location context", () => {
    const view = toOfferView(offerDoc(), fixtureContext());
    expect(view.produce.location.geo?.coordinates).toEqual([73.9, 20.0]);
  });

  it("derives the responder from the status", () => {
    const doc = offerDoc();
    expect(toOfferView(doc, fixtureContext()).turn).toBe("vendor");

    doc.status = "countered";
    expect(toOfferView(doc, fixtureContext()).turn).toBe("farmer");

    doc.status = "accepted";
    expect(toOfferView(doc, fixtureContext()).turn).toBeNull();
  });
});

describe("realCoordinatesOf", () => {
  it("accepts real coordinates", () => {
    expect(realCoordinatesOf({ type: "Point", coordinates: [73.9, 20.0] })).toEqual([73.9, 20.0]);
  });

  it("rejects the [0,0] placeholder origin", () => {
    expect(realCoordinatesOf({ type: "Point", coordinates: [0, 0] })).toBeUndefined();
  });

  it("rejects missing or malformed coordinates", () => {
    expect(realCoordinatesOf(undefined)).toBeUndefined();
    expect(realCoordinatesOf({ type: "Point" })).toBeUndefined();
    expect(realCoordinatesOf({ type: "Point", coordinates: [73.9] })).toBeUndefined();
    expect(realCoordinatesOf({ type: "Point", coordinates: [Number.NaN, 20] })).toBeUndefined();
  });
});

describe("partyToRespond", () => {
  it("maps statuses to the awaiting party only", () => {
    expect(partyToRespond("pending")).toBe("vendor");
    expect(partyToRespond("countered")).toBe("farmer");
    expect(partyToRespond("accepted")).toBeNull();
    expect(partyToRespond("rejected")).toBeNull();
    expect(partyToRespond("withdrawn")).toBeNull();
  });
});