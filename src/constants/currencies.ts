export const CURRENCIES = {
  INR: "INR",
} as const;

export type Currency = (typeof CURRENCIES)[keyof typeof CURRENCIES];

export const CURRENCY_VALUES = Object.values(CURRENCIES);
