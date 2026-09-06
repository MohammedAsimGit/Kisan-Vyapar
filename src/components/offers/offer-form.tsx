"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { postJson, ApiRequestError } from "@/lib/client/fetch-json";
import { Alert, Button, Field, Input, Textarea, linkButtonClass } from "@/components/ui";

export interface OfferFormProduce {
  id: string;
  cropName: string;
  cropEmoji?: string;
  variety?: string;
  quantity: number;
  availableQuantity: number;
  committedQuantity: number;
  unitLabel: string;
  askingPricePerUnit?: number;
  locationText?: string;
}

export interface OfferFormRequirement {
  id: string;
  cropName: string;
  quantity: number;
  unitLabel: string;
  remainingQuantity: number;
  targetPriceMin: number;
  targetPriceMax: number;
  requiredBy: string;
  vendor?: { businessName?: string };
}

function formatInr(value: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(dateOnly: string): string {
  const date = new Date(`${dateOnly}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) {
    return dateOnly;
  }
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

/**
 * Farmer's offer form against a real buying requirement. Price defaults to the
 * asking price but the farmer explicitly decides it; the server recomputes the
 * authoritative total.
 */
export function OfferForm({
  produce,
  requirement,
  defaultQuantity,
}: {
  produce: OfferFormProduce;
  requirement: OfferFormRequirement;
  defaultQuantity: number;
}) {
  const router = useRouter();
  const [quantity, setQuantity] = useState(
    defaultQuantity > 0 ? String(defaultQuantity) : "",
  );
  const [pricePerUnit, setPricePerUnit] = useState(
    produce.askingPricePerUnit !== undefined
      ? String(produce.askingPricePerUnit)
      : "",
  );
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const quantityValue = Number(quantity);
  const priceValue = Number(pricePerUnit);
  const total = useMemo(() => {
    if (!Number.isFinite(quantityValue) || !Number.isFinite(priceValue)) {
      return null;
    }
    return Math.round(quantityValue * priceValue * 100) / 100;
  }, [quantityValue, priceValue]);

  const overListing = quantityValue > produce.availableQuantity;
  const overRemaining = quantityValue > requirement.remainingQuantity;

  const canSave =
    quantityValue > 0 &&
    priceValue > 0 &&
    !overListing &&
    !overRemaining &&
    !submitting;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!canSave) {
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const data = await postJson<{ offer: { id: string } }>("/api/farmer/offers", {
        produceId: produce.id,
        requirementId: requirement.id,
        quantity: quantityValue,
        pricePerUnit: priceValue,
        note: note.trim() || undefined,
      });
      router.replace(`/farmer/offers/${data.offer.id}`);
      router.refresh();
    } catch (err) {
      setError(
        err instanceof ApiRequestError
          ? err.message
          : "We couldn't send this offer. Please try again.",
      );
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href={`/farmer/requirements/${requirement.id}`}
        className="mb-5 inline-flex items-center gap-1.5 rounded text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <ArrowLeft className="size-4" />
        Back to the buyer requirement
      </Link>

      {/* What the buyer wants — real, from their posted requirement */}
      <div className="rounded-3xl border border-border bg-surface p-6 shadow-card sm:p-8">
        <div className="flex items-center gap-4">
          <span className="inline-flex size-14 items-center justify-center rounded-2xl bg-primary-soft text-2xl">
            <span aria-hidden="true">{requirement.quantity > 0 ? produce.cropEmoji ?? "🌾" : "🌾"}</span>
          </span>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Make an offer · {requirement.cropName}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {requirement.vendor?.businessName ?? "A buyer"} needs{" "}
              {requirement.quantity} {requirement.unitLabel} by{" "}
              {formatDate(requirement.requiredBy)}
            </p>
          </div>
        </div>

        <dl className="mt-6 grid grid-cols-2 gap-x-4 gap-y-3 rounded-2xl border border-border bg-muted/30 p-4 text-sm sm:grid-cols-4">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Buyer&apos;s target price
            </dt>
            <dd className="mt-0.5 font-medium tabular-nums text-foreground">
              {formatInr(requirement.targetPriceMin)} –{" "}
              {formatInr(requirement.targetPriceMax)} / {requirement.unitLabel}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Still needed
            </dt>
            <dd className="mt-0.5 font-medium text-foreground">
              {requirement.remainingQuantity} {requirement.unitLabel}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Your listing
            </dt>
            <dd className="mt-0.5 font-medium text-foreground">
              {produce.availableQuantity} {produce.unitLabel}
              {produce.committedQuantity > 0 ? (
                <span className="ml-1 text-xs text-muted-foreground">
                  ({produce.committedQuantity} committed to other agreements)
                </span>
              ) : null}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Your asking price
            </dt>
            <dd className="mt-0.5 font-medium text-foreground">
              {produce.askingPricePerUnit !== undefined ? (
                <>
                  {formatInr(produce.askingPricePerUnit)} / {produce.unitLabel}
                </>
              ) : (
                <span className="text-muted-foreground">Not set</span>
              )}
            </dd>
          </div>
        </dl>

        <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
          {error ? (
            <Alert tone="error" title="We couldn't send this offer.">
              {error}
            </Alert>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label={`Quantity (${produce.unitLabel})`}
              htmlFor="quantity"
              hint={`You can offer up to ${Math.min(
                produce.availableQuantity,
                requirement.remainingQuantity,
              )} ${produce.unitLabel}.`}
              required
            >
              <Input
                id="quantity"
                name="quantity"
                type="number"
                inputMode="decimal"
                min={1}
                step="any"
                placeholder="e.g. 20"
                value={quantity}
                onChange={(event) => setQuantity(event.target.value)}
                required
              />
            </Field>

            <Field
              label={`Price per ${produce.unitLabel} (₹)`}
              htmlFor="pricePerUnit"
              hint={
                produce.askingPricePerUnit !== undefined
                  ? `Prefilled from your asking price of ${formatInr(produce.askingPricePerUnit)} — you decide the offer price.`
                  : "Set the price you are asking for this offer."
              }
              required
            >
              <Input
                id="pricePerUnit"
                name="pricePerUnit"
                type="number"
                inputMode="decimal"
                min={1}
                step="any"
                placeholder="e.g. 2750"
                value={pricePerUnit}
                onChange={(event) => setPricePerUnit(event.target.value)}
                required
              />
            </Field>
          </div>

          {overListing ? (
            <p role="alert" className="text-sm text-red-600">
              Your listing has {produce.availableQuantity} {produce.unitLabel} left to offer
              {produce.committedQuantity > 0
                ? ` (${produce.committedQuantity} already committed to other agreements)`
                : ""} —
              you can offer at most that much.
            </p>
          ) : null}
          {!overListing && overRemaining ? (
            <p role="alert" className="text-sm text-red-600">
              The buyer still needs {requirement.remainingQuantity}{" "}
              {requirement.unitLabel} — you can offer at most that much.
            </p>
          ) : null}
          {priceValue > requirement.targetPriceMax ? (
            <p className="text-sm text-muted-foreground">
              This is above the buyer&apos;s target range of{" "}
              {formatInr(requirement.targetPriceMin)}–{formatInr(requirement.targetPriceMax)}.{" "}
              That&apos;s allowed — the buyer can accept it or counter.
            </p>
          ) : null}

          <div className="rounded-2xl border border-border bg-muted/30 px-4 py-3.5">
            <p className="text-sm text-muted-foreground">
              Total amount{" "}
              {total !== null ? (
                <span className="font-semibold tabular-nums text-foreground">
                  {formatInr(total)}
                </span>
              ) : (
                <span>—</span>
              )}
              <span className="text-xs text-muted-foreground">
                {" "}
                ({quantityValue || "?"} × {priceValue || "?"}) — calculated on the
                server before it is recorded.
              </span>
            </p>
          </div>

          <Field label="Note to the buyer (optional)" htmlFor="note">
            <Textarea
              id="note"
              name="note"
              placeholder="e.g. Harvested fresh, can deliver this week."
              value={note}
              onChange={(event) => setNote(event.target.value)}
              maxLength={400}
            />
          </Field>

          <div className="flex flex-col gap-3 pt-1 sm:flex-row">
            <Button type="submit" size="lg" className="sm:flex-1" loading={submitting} disabled={!canSave}>
              Send offer
            </Button>
            <Link
              href={`/farmer/requirements/${requirement.id}`}
              className={linkButtonClass("outline", "lg", "sm:flex-none")}
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}