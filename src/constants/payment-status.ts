export const PAYMENT_STATUS = {
  PENDING: "pending",
  CONFIRMED: "confirmed",
} as const;

export type PaymentStatus = (typeof PAYMENT_STATUS)[keyof typeof PAYMENT_STATUS];

export const PAYMENT_STATUS_VALUES = Object.values(PAYMENT_STATUS);
