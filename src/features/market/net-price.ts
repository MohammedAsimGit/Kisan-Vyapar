export interface MarketCostConfig {
  transportPerQuintal?: number;
  otherPerQuintal?: number;
  commissionPercent?: number;
}

export function hasCostConfig(costs: MarketCostConfig): boolean {
  return Boolean(
    (costs.transportPerQuintal ?? 0) > 0 ||
      (costs.otherPerQuintal ?? 0) > 0 ||
      (costs.commissionPercent ?? 0) > 0,
  );
}

export function expectedNetPrice(
  modalPrice: number,
  costs: MarketCostConfig,
): number {
  const commission =
    modalPrice * ((costs.commissionPercent ?? 0) / 100);
  const totalCosts =
    (costs.transportPerQuintal ?? 0) +
    (costs.otherPerQuintal ?? 0) +
    commission;
  return Math.max(0, Math.round(modalPrice - totalCosts));
}
