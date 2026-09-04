import { describe, expect, it } from "vitest";
import mongoose from "mongoose";
import { ProduceListingModel } from "./produce-listing";

const base = () => ({
  farmer: new mongoose.Types.ObjectId(),
  crop: "tomato",
  quantity: 10,
  unit: "kg",
  quality: "a",
  location: {
    address: {
      village: "Bangalore",
      district: "Bangalore",
      state: "Karnataka",
      pincode: "560047",
    },
  },
});

describe("ProduceListing GeoJSON handling (no live database)", () => {
  it("does not fabricate a geo field when only an address is provided", async () => {
    const doc = new ProduceListingModel(base());
    await expect(doc.validate()).resolves.toBeUndefined();

    const plain = doc.toObject();
    const location = plain.location as { geo?: unknown } | undefined;
    expect(location?.geo).toBeUndefined();
  });

  it("persists a valid GeoJSON point when coordinates are explicitly provided", async () => {
    const doc = new ProduceListingModel(base());
    doc.set("location.geo", {
      type: "Point",
      coordinates: [77.5946, 12.9716],
    });
    await expect(doc.validate()).resolves.toBeUndefined();

    const geo = doc.get("location.geo") as {
      type: string;
      coordinates: number[];
    };
    expect(geo.type).toBe("Point");
    expect(geo.coordinates).toEqual([77.5946, 12.9716]);
  });

  it("keeps the 2dsphere index declared on the schema", () => {
    const indexes = ProduceListingModel.schema.indexes().map(
      (entry) => entry[0],
    );
    expect(indexes.some((index) => index["location.geo"] === "2dsphere")).toBe(
      true,
    );
  });
});
