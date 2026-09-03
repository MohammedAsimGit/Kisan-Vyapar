export const MODEL_NAMES = {
  USER: "User",
  FARMER_PROFILE: "FarmerProfile",
  VENDOR_PROFILE: "VendorProfile",
  PRODUCE_LISTING: "ProduceListing",
  BUYER_REQUIREMENT: "BuyerRequirement",
  MARKET_PRICE: "MarketPrice",
  OFFER: "Offer",
  ORDER: "Order",
  SESSION: "Session",
} as const;

export type ModelName = (typeof MODEL_NAMES)[keyof typeof MODEL_NAMES];

export const MODEL_NAME_VALUES = Object.values(MODEL_NAMES);
