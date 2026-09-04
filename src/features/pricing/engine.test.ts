import { describe, expect, it } from "vitest";
import { generatePricingGuidance } from "./engine";
import type { ObservationInput } from "./config";

const NOW = Date.parse("2026-09-05T06:00:00.000Z");

function row(
  market: string,
  modalPrice: number,
  arrival: string,
  fetched = NOW - 60 * 60 * 1000,
): ObservationInput {
  return {
    market,
    modalPrice,
    minPrice: modalPrice - 100,
    maxPrice: modalPrice + 100,
    arrivalDate: `${arrival}T00:00:00.000Z`,
    fetchedAt: new Date(fetched).toISOString(),
  };
}

describe("pricing guidance engine", () => {
  it("is deterministic for identical inputs", () => {
    const rows = [row("A", 2500, "2026-09-04"), row("B", 2600, "2026-09-04")];
    const first = generatePricingGuidance(rows, { now: NOW });
    const second = generatePricingGuidance(rows, { now: NOW });
    expect(first).toEqual(second);
  });

  it("returns insufficient state when there are no observations", () => {
    const result = generatePricingGuidance([], { now: NOW });
    expect(result.hasSuggestion).toBe(false);
    expect(result.confidence).toBe("insufficient");
    expect(result.suggestedPrice).toBeUndefined();
  });

  it("emits a suggestion with limited confidence from one observation", () => {
    const result = generatePricingGuidance([row("A", 2500, "2026-09-04")], { now: NOW });
    expect(result.hasSuggestion).toBe(true);
    expect(result.confidence).toBe("limited");
    expect(result.observationCount).toBe(1);
  });

  it("uses the median, not the highest market price, as the baseline", () => {
    const rows = [
      row("A", 1000, "2026-09-04"),
      row("B", 1050, "2026-09-04"),
      row("C", 5000, "2026-09-04"),
    ];
    const result = generatePricingGuidance(rows, { now: NOW });
    expect(result.suggestedPrice).toBe(1050);
    expect(result.latestModalPrice).toBe(1050);
  });

  it("detects a rising trend from recent daily medians", () => {
    const rows = [
      row("A", 2400, "2026-09-03"),
      row("B", 2500, "2026-09-03"),
      row("A", 2600, "2026-09-04"),
      row("B", 2650, "2026-09-04"),
      row("A", 2700, "2026-09-05"),
      row("B", 2750, "2026-09-05"),
    ];
    const result = generatePricingGuidance(rows, { now: NOW });
    expect(result.trend.direction).toBe("rising");
    expect(result.trend.percentageChange).toBeGreaterThan(0);
    expect(result.distinctDays).toBeGreaterThanOrEqual(2);
  });

  it("detects a falling trend", () => {
    const rows = [
      row("A", 2800, "2026-09-03"),
      row("A", 2500, "2026-09-05"),
    ];
    const result = generatePricingGuidance(rows, { now: NOW });
    expect(result.trend.direction).toBe("falling");
  });

  it("reports insufficient trend data for a single day", () => {
    const rows = [row("A", 2500, "2026-09-04"), row("B", 2600, "2026-09-04")];
    const result = generatePricingGuidance(rows, { now: NOW });
    expect(result.trend.direction).toBe("insufficient_data");
  });

  it("clamps the suggested range to observed prices", () => {
    const rows = [
      row("A", 2400, "2026-09-04"),
      row("B", 2400, "2026-09-04"),
    ];
    const result = generatePricingGuidance(rows, { now: NOW });
    expect(result.suggestedPrice).toBe(2400);
    expect(result.suggestedMinPrice).toBeGreaterThanOrEqual(result.observedRange!.min!);
    expect(result.suggestedMaxPrice).toBeLessThanOrEqual(result.observedRange!.max!);
  });

  it("treats stale observations honestly", () => {
    const rows = [row("A", 2500, "2026-09-04", NOW - 30 * 60 * 60 * 1000)];
    const result = generatePricingGuidance(rows, { now: NOW });
    expect(result.freshness).toBe("stale");
  });

  it("ignores rows without a modal price", () => {
    const rows: ObservationInput[] = [
      { market: "A", fetchedAt: new Date(NOW).toISOString() },
    ];
    const result = generatePricingGuidance(rows, { now: NOW });
    expect(result.hasSuggestion).toBe(false);
  });
});
