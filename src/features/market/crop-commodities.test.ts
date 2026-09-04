import { describe, expect, it } from "vitest";
import {
  cropIdForCommodity,
  getCommoditiesForCrop,
  getMappedCropIds,
  hasCropMapping,
  isKnownCrop,
} from "./crop-commodities";

describe("crop → commodity mapping", () => {
  it("maps tomato to tomato commodity names", () => {
    expect(getCommoditiesForCrop("tomato")).toContain("Tomato");
  });

  it("maps rice to paddy-related official commodities", () => {
    expect(getCommoditiesForCrop("rice")).toContain("Paddy");
  });

  it("returns an empty list for unmapped crops", () => {
    expect(getCommoditiesForCrop("unknown-crop")).toEqual([]);
    expect(hasCropMapping("unknown-crop")).toBe(false);
  });

  it("covers the known crop catalogue ids", () => {
    for (const id of getMappedCropIds()) {
      expect(isKnownCrop(id)).toBe(true);
    }
  });

  it("infers rice from the official 'Paddy(Common)' commodity", () => {
    expect(cropIdForCommodity("Paddy(Common)")).toBe("rice");
    expect(cropIdForCommodity("Tomato")).toBe("tomato");
    expect(cropIdForCommodity("Potato")).toBe("potato");
    expect(cropIdForCommodity("Unknown Crop")).toBeUndefined();
  });

  it("maps the real official Bajra commodity name", () => {
    expect(cropIdForCommodity("Bajra(Pearl Millet/Cumbu)")).toBe("bajra");
  });
});
