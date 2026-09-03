export const MEASUREMENT_UNITS = {
  KILOGRAM: "kg",
  QUINTAL: "quintal",
  TONNE: "tonne",
} as const;

export type MeasurementUnit =
  (typeof MEASUREMENT_UNITS)[keyof typeof MEASUREMENT_UNITS];

export const MEASUREMENT_UNIT_VALUES = Object.values(MEASUREMENT_UNITS);
