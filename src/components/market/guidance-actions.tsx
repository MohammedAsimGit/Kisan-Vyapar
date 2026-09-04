"use client";

import { useState } from "react";
import { Check, Pencil } from "lucide-react";
import { patchJson, ApiRequestError } from "@/lib/client/fetch-json";
import { Alert, Button, Input } from "@/components/ui";

export function GuidanceActions({
  listingId,
  suggestedPrice,
  unit,
  suggestedMin,
  suggestedMax,
}: {
  listingId: string;
  suggestedPrice?: number;
  unit: string;
  suggestedMin?: number;
  suggestedMax?: number;
}) {
  const [mode, setMode] = useState<"idle" | "custom" | "done">("idle");
  const [custom, setCustom] = useState(suggestedPrice ? String(suggestedPrice) : "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function save(price: number) {
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const data = await patchJson<{ askingPrice: number }>(
        `/api/farmer/produce/${listingId}/asking-price`,
        { pricePerUnit: price },
      );
      setMessage(`Asking price set to ${formatInr(data.askingPrice)}/${unit}.`);
      setMode("done");
    } catch (err) {
      setError(
        err instanceof ApiRequestError
          ? err.message
          : "We couldn't save your price. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {error ? <Alert tone="error">{error}</Alert> : null}
      {message ? (
        <p className="flex items-center gap-2 rounded-xl bg-success-bg px-3 py-2 text-sm font-medium text-success-fg">
          <Check className="size-4" />
          {message}
        </p>
      ) : null}

      {mode === "idle" || mode === "done" ? (
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            disabled={suggestedPrice === undefined || mode === "done"}
            onClick={() => suggestedPrice !== undefined && void save(suggestedPrice)}
            loading={saving}
          >
            {suggestedPrice !== undefined
              ? `Use ${formatInr(suggestedPrice)}`
              : "Suggested price unavailable"}
          </Button>
          <Button
            variant="outline"
            disabled={mode === "done"}
            onClick={() => {
              setMode("custom");
              if (!custom && suggestedPrice !== undefined) {
                setCustom(String(suggestedPrice));
              }
            }}
          >
            <Pencil className="size-4" />
            Set My Own Price
          </Button>
        </div>
      ) : (
        <form
          className="flex flex-col gap-3 sm:flex-row sm:items-end"
          onSubmit={(event) => {
            event.preventDefault();
            const parsed = Number(custom);
            if (!Number.isFinite(parsed) || parsed < 0) {
              setError("Please enter a valid price.");
              return;
            }
            void save(parsed);
          }}
        >
          <label htmlFor="askingPrice" className="block flex-1">
            <span className="mb-1.5 block text-sm font-medium text-foreground">
              Your asking price (per {unit})
            </span>
            <Input
              id="askingPrice"
              type="number"
              inputMode="numeric"
              min={0}
              value={custom}
              onChange={(event) => setCustom(event.target.value)}
              placeholder="e.g. 2750"
              className="h-12 text-lg font-semibold"
              required
            />
          </label>
          <div className="flex gap-2">
            <Button type="submit" loading={saving}>
              Save Price
            </Button>
            <Button type="button" variant="ghost" onClick={() => setMode("idle")}>
              Cancel
            </Button>
          </div>
        </form>
      )}

      {mode !== "idle" && custom && !message ? (
        <p className="text-xs text-muted-foreground">
          {suggestedMin !== undefined &&
          suggestedMax !== undefined &&
          Number(custom) >= 0 &&
          (Number(custom) < suggestedMin || Number(custom) > suggestedMax)
            ? "Your price is outside the suggested range. You are free to set it."
            : "You remain in control of your final asking price."}
        </p>
      ) : null}
    </div>
  );
}

function formatInr(value: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}
