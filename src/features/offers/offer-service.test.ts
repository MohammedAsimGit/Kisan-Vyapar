import { describe, expect, it } from "vitest";
import {
  canActOnOffer,
  computeTotalAmount,
  remainingQuantityInUnit,
  toQuintalQuantity,
} from "./offer-service";
import { partyToRespond } from "./types";

describe("computeTotalAmount", () => {
  it("multiplies quantity by price per unit", () => {
    expect(computeTotalAmount(20, 2750)).toBe(55000);
    expect(computeTotalAmount(50, 2600)).toBe(130000);
  });

  it("keeps monetary totals deterministic with fractional inputs", () => {
    expect(computeTotalAmount(2.5, 100.5)).toBe(251.25);
    expect(computeTotalAmount(0.5, 2750)).toBe(1375);
  });
});

describe("toQuintalQuantity", () => {
  it("normalises units to quintals", () => {
    expect(toQuintalQuantity(50, "quintal")).toBe(50);
    expect(toQuintalQuantity(5000, "kg")).toBe(50);
    expect(toQuintalQuantity(5, "tonne")).toBe(50);
  });
});

describe("remainingQuantityInUnit", () => {
  it("subtracts committed quantity from the requirement total", () => {
    const requirement = { quantity: 50, unit: "quintal" as const, allocatedQuantity: 20 };
    expect(remainingQuantityInUnit(requirement, "quintal")).toBe(30);
  });

  it("never goes negative", () => {
    const requirement = { quantity: 10, unit: "quintal" as const, allocatedQuantity: 15 };
    expect(remainingQuantityInUnit(requirement, "quintal")).toBe(0);
  });

  it("converts between units (kg offer against a quintal requirement)", () => {
    const requirement = { quantity: 5, unit: "quintal" as const, allocatedQuantity: 2 };
    // 3 quintals remaining = 300 kg
    expect(remainingQuantityInUnit(requirement, "kg")).toBe(300);
  });
});

describe("partyToRespond", () => {
  it("maps pending to the vendor and countered to the farmer", () => {
    expect(partyToRespond("pending")).toBe("vendor");
    expect(partyToRespond("countered")).toBe("farmer");
  });

  it("returns null for terminal states", () => {
    expect(partyToRespond("accepted")).toBeNull();
    expect(partyToRespond("rejected")).toBeNull();
    expect(partyToRespond("withdrawn")).toBeNull();
  });
});

describe("canActOnOffer", () => {
  describe("PENDING (farmer's proposal awaits the buyer)", () => {
    it("lets the vendor accept, reject or counter", () => {
      expect(canActOnOffer("accept", "pending", "vendor").ok).toBe(true);
      expect(canActOnOffer("reject", "pending", "vendor").ok).toBe(true);
      expect(canActOnOffer("counter", "pending", "vendor").ok).toBe(true);
    });

    it("blocks the farmer from responding to their own proposal", () => {
      const result = canActOnOffer("accept", "pending", "farmer");
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.message).toContain("buyer");
      }
      expect(canActOnOffer("reject", "pending", "farmer").ok).toBe(false);
      expect(canActOnOffer("counter", "pending", "farmer").ok).toBe(false);
    });

    it("lets the farmer withdraw their own pending offer", () => {
      expect(canActOnOffer("withdraw", "pending", "farmer").ok).toBe(true);
      expect(canActOnOffer("withdraw", "pending", "vendor").ok).toBe(false);
    });
  });

  describe("COUNTERED (buyer's counter awaits the farmer)", () => {
    it("lets the farmer accept, reject or counter", () => {
      expect(canActOnOffer("accept", "countered", "farmer").ok).toBe(true);
      expect(canActOnOffer("reject", "countered", "farmer").ok).toBe(true);
      expect(canActOnOffer("counter", "countered", "farmer").ok).toBe(true);
    });

    it("blocks the vendor from responding to their own counter", () => {
      expect(canActOnOffer("accept", "countered", "vendor").ok).toBe(false);
      expect(canActOnOffer("reject", "countered", "vendor").ok).toBe(false);
      expect(canActOnOffer("counter", "countered", "vendor").ok).toBe(false);
    });

    it("lets the vendor withdraw their own counter", () => {
      expect(canActOnOffer("withdraw", "countered", "vendor").ok).toBe(true);
      expect(canActOnOffer("withdraw", "countered", "farmer").ok).toBe(false);
    });
  });

  describe("terminal states", () => {
    it("blocks every action once accepted", () => {
      expect(canActOnOffer("accept", "accepted", "farmer").ok).toBe(false);
      expect(canActOnOffer("accept", "accepted", "vendor").ok).toBe(false);
      expect(canActOnOffer("counter", "accepted", "vendor").ok).toBe(false);
      expect(canActOnOffer("withdraw", "accepted", "farmer").ok).toBe(false);
    });

    it("blocks every action once rejected", () => {
      expect(canActOnOffer("accept", "rejected", "vendor").ok).toBe(false);
      expect(canActOnOffer("reject", "rejected", "vendor").ok).toBe(false);
      expect(canActOnOffer("withdraw", "rejected", "farmer").ok).toBe(false);
    });

    it("blocks every action once withdrawn", () => {
      expect(canActOnOffer("accept", "withdrawn", "vendor").ok).toBe(false);
      expect(canActOnOffer("counter", "withdrawn", "farmer").ok).toBe(false);
    });
  });
});