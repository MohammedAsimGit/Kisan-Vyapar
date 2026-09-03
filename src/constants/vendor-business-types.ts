export const VENDOR_BUSINESS_TYPES = {
  RETAILER: "retailer",
  WHOLESALER: "wholesaler",
  PROCESSOR: "processor",
  EXPORTER: "exporter",
} as const;

export type VendorBusinessType =
  (typeof VENDOR_BUSINESS_TYPES)[keyof typeof VENDOR_BUSINESS_TYPES];

export const VENDOR_BUSINESS_TYPE_VALUES = Object.values(VENDOR_BUSINESS_TYPES);
