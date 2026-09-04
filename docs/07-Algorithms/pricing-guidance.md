# Price Guidance Methodology (Sprint 4)

All numbers are derived **deterministically** from real market observations stored
by the Sprint 3 data.gov.in pipeline. No AI, no random values, no fabrication.

## Data used
- Recent modal prices per market/observation with `arrivalDate` within the
  configured observation window (7 days) of the newest arrival.
- min/max prices, fetched timestamps, market names, variety/grade when present.
- Quality is currently treated as **neutral** (no adjustment) — there is no
  reliable empirical basis for grade multipliers yet. Quality remains visible to
  the farmer but does not change the suggested number.

## Baseline
- One representative observation per market is selected (the row with the latest
  arrival date for that market).
- Baseline = **median** of those per-market modal prices.
- The **median**, not the highest price, is used so a single high observation
  cannot dominate the suggestion.

## Suggested range
- `suggestedPrice` = round(median).
- Padding = `median × RANGE_PADDING_FRACTION` (centralized, default 5%).
- `suggestedMin`/`suggestedMax` = median ∓ padding, clamped to the observed
  min/max of the selected observations.

## Trend
- Daily median modal price is computed from all valid observations grouped by
  arrival date.
- With ≥ 2 distinct days, percentage change = (latest − earliest)/earliest.
  Direction: rising ≥ +1%, falling ≤ −1%, otherwise stable.
- With fewer than 2 distinct days the trend is `insufficient_data` (never shown
  as a number).

## Volatility
- Coefficient of variation (stddev/median) of the per-market modal prices.
- Thresholds (centralized): < 0.10 low, ≤ 0.25 moderate, else high.

## Confidence
Deterministic heuristic (0–1) using only real signals:
- observation count (capped at 0.5)
- freshness: fresh 0.3 / stale 0.1 / unknown 0.15
- volatility: low 0.2, moderate 0.12, high 0.05

Mapped: ≥ 0.75 high, ≥ 0.55 medium, ≥ 0.35 low, else limited. A single
observation is always "limited". Zero observations = "insufficient" and no
suggestion is emitted.

## Data sufficiency
- 0 observations → no suggestion (unavailable/insufficient).
- 1 observation → suggestion with **limited** confidence.
- ≥ 5 observations → full confidence scoring.

## Freshness
- Uses the newest `fetchedAt` of the selected observations against the shared
  6-hour TTL. Stale data lowers confidence and is labelled honestly (never
  "live").

## Explicit non-goals
- The highest observed market price is **never** used as the suggestion.
- No guarantee, "best price", or profit claims are made.
- The farmer always decides the final asking price (suggested value may be used,
  or the farmer sets their own; both only update their own listing).

## API
`GET /api/farmer/produce/:id/recommendation` (farmer, ownership-checked) returns
the guidance DTO. `PATCH /api/farmer/produce/:id/asking-price` saves the farmer's
chosen asking price to the listing (`pricePerUnit`).
