"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { postJson, ApiRequestError } from "@/lib/client/fetch-json";
import {
  Button,
  Field,
  Input,
  Select,
} from "@/components/ui";
import {
  VENDOR_BUSINESS_TYPES,
  VENDOR_BUSINESS_TYPE_VALUES,
} from "@/constants/vendor-business-types";
import type { VendorProfileView } from "@/features/profiles/types";

const BUSINESS_TYPE_LABELS: Record<(typeof VENDOR_BUSINESS_TYPE_VALUES)[number], string> = {
  [VENDOR_BUSINESS_TYPES.RETAILER]: "Retailer / shop",
  [VENDOR_BUSINESS_TYPES.WHOLESALER]: "Wholesaler / trader",
  [VENDOR_BUSINESS_TYPES.PROCESSOR]: "Processor",
  [VENDOR_BUSINESS_TYPES.EXPORTER]: "Exporter",
};

export function VendorProfileForm({
  initial,
}: {
  initial: VendorProfileView | null;
}) {
  const router = useRouter();
  const [businessName, setBusinessName] = useState(initial?.businessName ?? "");
  const [businessType, setBusinessType] = useState(initial?.businessType ?? "");
  const [city, setCity] = useState(initial?.city ?? "");
  const [district, setDistrict] = useState(initial?.district ?? "");
  const [state, setState] = useState(initial?.state ?? "");
  const [pincode, setPincode] = useState(initial?.pincode ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSave =
    businessName.trim().length > 0 &&
    businessType.length > 0 &&
    state.trim().length > 0 &&
    !submitting;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!canSave) {
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await postJson("/api/profile", {
        businessName: businessName.trim(),
        businessType,
        city: city.trim(),
        district: district.trim(),
        state: state.trim(),
        pincode: pincode.trim(),
      });
      router.replace("/vendor");
      router.refresh();
    } catch (err) {
      const message =
        err instanceof ApiRequestError
          ? err.message
          : "We couldn't save your profile. Please try again.";
      setError(message);
      setSubmitting(false);
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <p className="text-sm leading-6 text-muted-foreground">
        This tells farmers who you are and where you buy. You can change this later.
      </p>

      {error ? (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
          {error}
        </p>
      ) : null}

      <Field label="Business name" htmlFor="businessName" required>
        <Input
          id="businessName"
          name="businessName"
          autoComplete="organization"
          placeholder="e.g. Annapurna Fresh Mart"
          value={businessName}
          onChange={(event) => setBusinessName(event.target.value)}
          required
        />
      </Field>

      <Field label="What kind of business is this?" htmlFor="businessType" required>
        <Select
          id="businessType"
          name="businessType"
          value={businessType}
          onChange={(event) => setBusinessType(event.target.value)}
          required
        >
          <option value="" disabled>
            Choose one
          </option>
          {VENDOR_BUSINESS_TYPE_VALUES.map((value) => (
            <option key={value} value={value}>
              {BUSINESS_TYPE_LABELS[value]}
            </option>
          ))}
        </Select>
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="City / town" htmlFor="city">
          <Input
            id="city"
            name="city"
            placeholder="e.g. Mysuru"
            value={city}
            onChange={(event) => setCity(event.target.value)}
          />
        </Field>
        <Field label="State" htmlFor="state" required>
          <Input
            id="state"
            name="state"
            autoComplete="address-level1"
            placeholder="e.g. Karnataka"
            value={state}
            onChange={(event) => setState(event.target.value)}
            required
          />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="District (optional)" htmlFor="district">
          <Input
            id="district"
            name="district"
            placeholder="e.g. Mysuru"
            value={district}
            onChange={(event) => setDistrict(event.target.value)}
          />
        </Field>
        <Field label="PIN code (optional)" htmlFor="pincode">
          <Input
            id="pincode"
            name="pincode"
            inputMode="numeric"
            autoComplete="postal-code"
            placeholder="e.g. 570001"
            value={pincode}
            onChange={(event) => setPincode(event.target.value)}
          />
        </Field>
      </div>

      <Button type="submit" size="lg" className="w-full" loading={submitting} disabled={!canSave}>
        Save and continue
      </Button>
    </form>
  );
}
