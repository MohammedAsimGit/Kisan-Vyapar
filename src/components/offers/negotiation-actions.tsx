"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Ban, CheckCircle2, Handshake, XCircle } from "lucide-react";
import { postJson, ApiRequestError } from "@/lib/client/fetch-json";
import { Alert, Button, Field, Input, Textarea } from "@/components/ui";
import type { OfferView } from "@/features/offers/types";

type OfferParty = "farmer" | "vendor";

function formatInr(value: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Role-aware negotiation controls. Which actions are offered depends purely on
 * the current offer state and who is looking — the server enforces the same
 * rules, so the UI can never do more than the API allows.
 */
export function NegotiationActions({
  offer,
  role,
}: {
  offer: OfferView;
  role: OfferParty;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<"accept" | "reject" | "withdraw" | null>(null);
  const [counterOpen, setCounterOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Counter form state, prefilled with the current proposal.
  const [counterQuantity, setCounterQuantity] = useState(String(offer.quantity));
  const [counterPrice, setCounterPrice] = useState(String(offer.pricePerUnit));
  const [counterNote, setCounterNote] = useState("");

  const isMyTurn = offer.turn === role;
  const proposer: OfferParty | null =
    offer.turn === "farmer" ? "vendor" : offer.turn === "vendor" ? "farmer" : null;
  const canWithdraw = proposer === role && offer.turn !== null;

  const otherParty =
    role === "farmer" ? (offer.vendor.businessName ?? "the buyer") : (offer.farmer.farmerName ?? "the farmer");

  const counterQuantityValue = Number(counterQuantity);
  const counterPriceValue = Number(counterPrice);
  const counterTotal = useMemo(() => {
    if (!Number.isFinite(counterQuantityValue) || !Number.isFinite(counterPriceValue)) {
      return null;
    }
    return Math.round(counterQuantityValue * counterPriceValue * 100) / 100;
  }, [counterQuantityValue, counterPriceValue]);

  const counterOverListing = counterQuantityValue > offer.produce.availableQuantity;
  const counterOverRemaining = counterQuantityValue > offer.requirement.remainingQuantity;
  const counterValid =
    counterQuantityValue > 0 &&
    counterPriceValue > 0 &&
    !counterOverListing &&
    !counterOverRemaining;

  async function run(action: "accept" | "reject" | "withdraw") {
    setBusy(action);
    setError(null);
    try {
      await postJson(`/api/${role}/offers/${offer.id}/${action}`, {});
      setConfirm(null);
      router.refresh();
    } catch (err) {
      setError(
        err instanceof ApiRequestError
          ? err.message
          : "We couldn't update this negotiation. Please try again.",
      );
      setBusy(null);
    }
  }

  async function submitCounter(event: React.FormEvent) {
    event.preventDefault();
    if (!counterValid) {
      return;
    }
    setBusy("counter");
    setError(null);
    try {
      await postJson(`/api/${role}/offers/${offer.id}/counter`, {
        quantity: counterQuantityValue,
        pricePerUnit: counterPriceValue,
        note: counterNote.trim() || undefined,
      });
      setCounterOpen(false);
      setCounterNote("");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof ApiRequestError
          ? err.message
          : "We couldn't send the counter. Please try again.",
      );
      setBusy(null);
    }
  }

  // Terminal states have no actions — the page shows the outcome.
  if (offer.turn === null) {
    return null;
  }

  return (
    <div className="flex flex-col items-start gap-3">
      {error ? <Alert tone="error">{error}</Alert> : null}

      {confirm ? (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-danger-border bg-danger-bg px-3 py-2">
          <p className="text-sm font-medium text-danger-fg">
            {confirm === "accept"
              ? `Accept this ${offer.quantity} ${offer.unitLabel} offer? The agreed terms will be locked.`
              : confirm === "reject"
                ? "Reject this proposal? The negotiation will close."
                : "Withdraw your proposal? The negotiation will close."}
          </p>
          <Button
            size="sm"
            variant={confirm === "accept" ? "primary" : "danger"}
            loading={busy === confirm}
            onClick={() => void run(confirm)}
          >
            {confirm === "accept" ? "Yes, accept" : confirm === "reject" ? "Yes, reject" : "Yes, withdraw"}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setConfirm(null)}>
            Keep it
          </Button>
        </div>
      ) : null}

      {counterOpen ? (
        <form
          onSubmit={submitCounter}
          className="w-full max-w-md space-y-4 rounded-2xl border border-border bg-muted/30 p-4"
        >
          <p className="text-sm font-semibold text-foreground">
            Counter — your revised proposal
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={`Quantity (${offer.unitLabel})`} htmlFor="counterQuantity" required>
              <Input
                id="counterQuantity"
                name="counterQuantity"
                type="number"
                inputMode="decimal"
                min={1}
                step="any"
                value={counterQuantity}
                onChange={(event) => setCounterQuantity(event.target.value)}
                required
              />
            </Field>
            <Field label={`Price per ${offer.unitLabel} (₹)`} htmlFor="counterPrice" required>
              <Input
                id="counterPrice"
                name="counterPrice"
                type="number"
                inputMode="decimal"
                min={1}
                step="any"
                value={counterPrice}
                onChange={(event) => setCounterPrice(event.target.value)}
                required
              />
            </Field>
          </div>
          {counterOverListing ? (
            <p role="alert" className="text-sm text-red-600">
              The listing has {offer.produce.availableQuantity} {offer.unitLabel} left to offer — you can&apos;t offer more.
            </p>
          ) : null}
          {!counterOverListing && counterOverRemaining ? (
            <p role="alert" className="text-sm text-red-600">
              The buyer still needs {offer.requirement.remainingQuantity} {offer.unitLabel} — you can&apos;t offer more.
            </p>
          ) : null}
          <Field label="Note (optional)" htmlFor="counterNote">
            <Textarea
              id="counterNote"
              name="counterNote"
              placeholder="e.g. Can we meet at this price?"
              value={counterNote}
              onChange={(event) => setCounterNote(event.target.value)}
              maxLength={400}
            />
          </Field>
          <p className="text-sm text-muted-foreground">
            Total{" "}
            {counterTotal !== null ? (
              <span className="font-semibold tabular-nums text-foreground">
                {formatInr(counterTotal)}
              </span>
            ) : (
              "—"
            )}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <Button type="submit" loading={busy === "counter"} disabled={!counterValid}>
              <Handshake className="size-4" />
              Send counter
            </Button>
            <Button type="button" variant="ghost" onClick={() => setCounterOpen(false)}>
              Cancel
            </Button>
          </div>
        </form>
      ) : null}

      {isMyTurn ? (
        <div className="flex flex-wrap items-center gap-3">
          <Button loading={busy === "accept"} onClick={() => setConfirm("accept")}>
            <CheckCircle2 className="size-4" />
            Accept
          </Button>
          <Button variant="outline" onClick={() => setCounterOpen((open) => !open)}>
            <Handshake className="size-4" />
            Counter
          </Button>
          <Button variant="ghost" loading={busy === "reject"} onClick={() => setConfirm("reject")}>
            <XCircle className="size-4" />
            Reject
          </Button>
        </div>
      ) : (
        <div className="flex flex-col items-start gap-3">
          <p className="text-sm leading-6 text-muted-foreground">
            Waiting for {otherParty}&apos;s response.
          </p>
          {canWithdraw ? (
            <Button
              variant="outline"
              loading={busy === "withdraw"}
              onClick={() => setConfirm("withdraw")}
            >
              <Ban className="size-4" />
              Withdraw my proposal
            </Button>
          ) : null}
        </div>
      )}
    </div>
  );
}