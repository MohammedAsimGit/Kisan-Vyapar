import { describe, expect, it } from "vitest";
import {
  buildRecordKey,
  normalizeMarketObservation,
} from "./normalizer";

const validRecord = {
  commodity: "Tomato",
  market: "Bangalore",
  state: "Karnataka",
  district: "Bangalore",
  variety: "Hybrid",
  min_price: "2200",
  max_price: "2600",
  modal_price: "2450",
  arrival_date: "04-09-2026",
};

function without(
  input: Record<string, unknown>,
  key: string,
): Record<string, unknown> {
  const copy = { ...input };
  delete copy[key];
  return copy;
}

describe("market normalizer", () => {
  it("normalizes a valid external record", () => {
    const result = normalizeMarketObservation(validRecord, {
      crop: "tomato",
      defaultUnit: "quintal",
      source: "test-source",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.commodity).toBe("Tomato");
    expect(result.value.crop).toBe("tomato");
    expect(result.value.modalPrice).toBe(2450);
    expect(result.value.minPrice).toBe(2200);
    expect(result.value.maxPrice).toBe(2600);
    expect(result.value.state).toBe("Karnataka");
    expect(result.value.arrivalDate?.toISOString().slice(0, 10)).toBe("2026-09-04");
  });

  it("rejects a missing commodity", () => {
    const result = normalizeMarketObservation(
      without(validRecord, "commodity"),
      { defaultUnit: "quintal" },
    );
    expect(result.ok).toBe(false);
  });

  it("rejects a missing market", () => {
    const result = normalizeMarketObservation(
      without(validRecord, "market"),
      { defaultUnit: "quintal" },
    );
    expect(result.ok).toBe(false);
  });

  it("rejects a negative modal price", () => {
    const result = normalizeMarketObservation(
      { ...validRecord, modal_price: "-5" },
      { defaultUnit: "quintal" },
    );
    expect(result.ok).toBe(false);
  });

  it("rejects when minimum price exceeds maximum", () => {
    const result = normalizeMarketObservation(
      { ...validRecord, min_price: "3000", max_price: "2000" },
      { defaultUnit: "quintal" },
    );
    expect(result.ok).toBe(false);
  });

  it("rejects non-numeric prices", () => {
    const result = normalizeMarketObservation(
      { ...validRecord, modal_price: "about-two-thousand" },
      { defaultUnit: "quintal" },
    );
    expect(result.ok).toBe(false);
  });

  it("rejects an invalid date string", () => {
    const result = normalizeMarketObservation(
      { ...validRecord, arrival_date: "not-a-date" },
      { defaultUnit: "quintal" },
    );
    expect(result.ok).toBe(false);
  });

  it("rejects a missing unit when no default is supplied", () => {
    const result = normalizeMarketObservation(validRecord);
    expect(result.ok).toBe(false);
  });

  it("rejects non-object records", () => {
    expect(normalizeMarketObservation("tomato").ok).toBe(false);
    expect(normalizeMarketObservation(null).ok).toBe(false);
  });

  it("builds deterministic record keys", () => {
    const obs = {
      commodity: "Tomato",
      market: "Bangalore",
      arrivalDate: new Date("2026-09-04T00:00:00Z"),
      variety: "Hybrid",
      source: "gov",
    };
    const first = buildRecordKey(obs);
    const second = buildRecordKey({ ...obs });
    expect(first).toBe(second);
    expect(first).toContain("tomato");
    // Different date => different observation (history preserved)
    const other = buildRecordKey({ ...obs, arrivalDate: new Date("2026-09-05T00:00:00Z") });
    expect(other).not.toBe(first);
  });
});
