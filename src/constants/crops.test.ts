import { describe, expect, it } from "vitest";
import {
  CROPS,
  POPULAR_CROPS,
  getCropById,
  getCropVarieties,
  isSupportedCrop,
} from "./crops";

describe("crop catalogue", () => {
  it("contains the popular six crops for quick access", () => {
    const names = POPULAR_CROPS.map((crop) => crop.name);
    expect(names).toContain("Tomato");
    expect(names).toContain("Onion");
    expect(names).toContain("Potato");
    expect(names).toContain("Wheat");
    expect(names).toContain("Rice");
    expect(names).toContain("Maize");
  });

  it("uses stable, unique ids", () => {
    const ids = CROPS.map((crop) => crop.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toContain("tomato");
  });

  it("recognises supported crops", () => {
    expect(isSupportedCrop("tomato")).toBe(true);
    expect(isSupportedCrop("rice")).toBe(true);
  });

  it("rejects unsupported crops", () => {
    expect(isSupportedCrop("unicorn")).toBe(false);
    expect(isSupportedCrop("")).toBe(false);
  });

  it("looks up a crop by id", () => {
    expect(getCropById("onion")?.name).toBe("Onion");
    expect(getCropById("missing")).toBeUndefined();
  });

  it("exposes varieties where configured", () => {
    expect(getCropVarieties("tomato")).toContain("Hybrid");
    expect(getCropVarieties("potato")).toBeUndefined();
  });
});
