import { describe, expect, it } from "vitest";
import {
  produceLocationText,
  toDateOnly,
  toProduceListingView,
  type ProduceListingView,
} from "./types";

describe("produce DTO", () => {
  it("formats a date into a date-only string", () => {
    expect(toDateOnly(new Date("2026-09-20T00:00:00Z"))).toBe("2026-09-20");
    expect(toDateOnly(null)).toBeUndefined();
  });

  it("builds a location text from available fields", () => {
    expect(
      produceLocationText({
        address: { district: "Mysuru", state: "Karnataka" },
      }),
    ).toBe("Mysuru, Karnataka");
    expect(produceLocationText(undefined)).toBe("");
  });

  it("maps a stored listing into a clean view", () => {
    const view = toProduceListingView({
      _id: "64b000000000000000000001",
      crop: "tomato",
      variety: "Hybrid",
      quality: "a",
      quantity: 20,
      unit: "quintal",
      expectedHarvestDate: new Date("2026-09-20T00:00:00Z"),
      location: {
        label: "Devanahalli",
        address: {
          district: "Bengaluru Rural",
          state: "Karnataka",
        },
      },
      status: "active",
      createdAt: new Date("2026-01-01T00:00:00Z"),
      updatedAt: new Date("2026-01-01T00:00:00Z"),
    });

    expect(view).toEqual<ProduceListingView>({
      id: "64b000000000000000000001",
      crop: "tomato",
      cropName: "Tomato",
      cropEmoji: "🍅",
      variety: "Hybrid",
      quantity: 20,
      unit: "quintal",
      unitLabel: "Quintal",
      quality: "a",
      qualityLabel: "A Grade",
      location: {
        district: "Bengaluru Rural",
        state: "Karnataka",
        pincode: undefined,
        village: undefined,
        label: "Devanahalli",
      },
      locationText: "Devanahalli, Bengaluru Rural, Karnataka",
      expectedHarvestDate: "2026-09-20",
      status: "active",
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    });
  });

  it("falls back to the raw crop id when not in the catalogue", () => {
    const view = toProduceListingView({
      _id: "64b000000000000000000002",
      crop: "future-crop",
      quantity: 1,
      unit: "kg",
      quality: "ungraded",
      status: "active",
    });
    expect(view.cropName).toBe("future-crop");
  });
});
