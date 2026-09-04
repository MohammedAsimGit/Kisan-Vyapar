import { CURRENCIES } from "@/constants/currencies";
import {
  MEASUREMENT_UNIT_VALUES,
  type MeasurementUnit,
} from "@/constants/measurement-units";
import type { StoredObservation } from "./types";

export type NormalizeResult =
  | { ok: true; value: StoredObservation }
  | { ok: false; reason: string };

function asRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function firstDefined(
  record: Record<string, unknown>,
  keys: string[],
): unknown {
  for (const key of keys) {
    const value = record[key];
    if (value !== undefined && value !== null && value !== "") {
      return value;
    }
  }
  return undefined;
}

function toNumber(value: unknown): number | undefined {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : undefined;
  }
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value.trim().replace(/,/g, ""));
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

function parseDate(value: unknown): Date | undefined {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? undefined : value;
  }
  if (typeof value !== "string" || value.trim() === "") {
    return undefined;
  }
  const text = value.trim();
  // dd-mm-yyyy (common in official mandi exports) — must be handled first so
  // the generic Date parser never misreads it.
  const dmy = /^(\d{1,2})-(\d{1,2})-(\d{4})$/.exec(text);
  if (dmy) {
    const [, day, month, year] = dmy;
    const date = new Date(`${year}-${month}-${day}T00:00:00Z`);
    return Number.isNaN(date.getTime()) ? undefined : date;
  }
  const iso = new Date(text);
  return Number.isNaN(iso.getTime()) ? undefined : iso;
}

function toDateOnlyString(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function normalizeMarketObservation(
  raw: unknown,
  options?: { defaultUnit?: MeasurementUnit; source?: string; crop?: string },
): NormalizeResult {
  const record = asRecord(raw);
  if (!record) {
    return { ok: false, reason: "record is not an object" };
  }

  const commodityValue = firstDefined(record, [
    "commodity",
    "commodity_name",
    "commodityName",
  ]);
  if (typeof commodityValue !== "string" || commodityValue.trim() === "") {
    return { ok: false, reason: "missing commodity" };
  }

  const marketValue = firstDefined(record, ["market", "market_name", "marketName"]);
  if (typeof marketValue !== "string" || marketValue.trim() === "") {
    return { ok: false, reason: "missing market" };
  }

  const stateValue = firstDefined(record, ["state", "state_name", "stateName"]);
  const districtValue = firstDefined(record, [
    "district",
    "district_name",
    "districtName",
  ]);
  const varietyValue = firstDefined(record, ["variety", "variety_name"]);
  const gradeValue = firstDefined(record, ["grade", "grade_name"]);

  if (
    stateValue !== undefined &&
    typeof stateValue !== "string"
  ) {
    return { ok: false, reason: "invalid state" };
  }
  if (
    districtValue !== undefined &&
    typeof districtValue !== "string"
  ) {
    return { ok: false, reason: "invalid district" };
  }

  const modal = toNumber(firstDefined(record, ["modal_price", "modalPrice", "modal"]));
  const min = toNumber(firstDefined(record, ["min_price", "minPrice", "min"]));
  const max = toNumber(firstDefined(record, ["max_price", "maxPrice", "max"]));

  if (modal === undefined || modal < 0) {
    return { ok: false, reason: "invalid modal price" };
  }
  if (min !== undefined && min < 0) {
    return { ok: false, reason: "invalid minimum price" };
  }
  if (max !== undefined && max < 0) {
    return { ok: false, reason: "invalid maximum price" };
  }
  if (min !== undefined && max !== undefined && min > max) {
    return { ok: false, reason: "minimum price exceeds maximum" };
  }

  const unitValue = firstDefined(record, ["unit", "price_unit", "priceUnit"]);
  const unit =
    typeof unitValue === "string" &&
    (MEASUREMENT_UNIT_VALUES as readonly string[]).includes(unitValue)
      ? (unitValue as MeasurementUnit)
      : options?.defaultUnit;

  if (!unit) {
    return { ok: false, reason: "unsupported or missing unit" };
  }

  const externalIdValue = firstDefined(record, [
    "id",
    "record_id",
    "recordId",
    "external_id",
  ]);
  const rawDateValue = firstDefined(record, ["arrival_date", "arrivalDate", "date"]);
  const arrivalDate = parseDate(rawDateValue);
  if (rawDateValue !== undefined && !arrivalDate) {
    return { ok: false, reason: "invalid date" };
  }

  return {
    ok: true,
    value: {
      commodity: commodityValue.trim(),
      crop: options?.crop,
      variety:
        typeof varietyValue === "string" && varietyValue.trim()
          ? varietyValue.trim()
          : undefined,
      grade:
        typeof gradeValue === "string" && gradeValue.trim()
          ? gradeValue.trim()
          : undefined,
      market: marketValue.trim(),
      district:
        typeof districtValue === "string" && districtValue.trim()
          ? districtValue.trim()
          : undefined,
      state:
        typeof stateValue === "string" && stateValue.trim()
          ? stateValue.trim()
          : undefined,
      unit,
      minPrice: min,
      maxPrice: max,
      modalPrice: modal,
      currency: CURRENCIES.INR,
      arrivalDate,
      source: options?.source,
      externalId:
        typeof externalIdValue === "string" && externalIdValue.trim()
          ? externalIdValue.trim()
          : undefined,
    },
  };
}

export function buildRecordKey(observation: {
  commodity: string;
  market: string;
  arrivalDate?: Date;
  variety?: string;
  grade?: string;
  source?: string;
}): string {
  const date = observation.arrivalDate
    ? toDateOnlyString(observation.arrivalDate)
    : "nodate";
  return [
    observation.source ?? "unknown",
    observation.commodity.toLowerCase(),
    observation.market.toLowerCase(),
    date,
    (observation.variety ?? "").toLowerCase(),
    (observation.grade ?? "").toLowerCase(),
  ].join("|");
}
