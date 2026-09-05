import { cn } from "@/lib/utils/cn";
import { CalendarDays, MapPin } from "lucide-react";

export interface ListingFactsProps {
  cropName: string;
  cropEmoji?: string;
  variety?: string;
  quantity: number;
  unitLabel: string;
  qualityLabel: string;
  askingPricePerUnit?: number;
  locationText?: string;
  expectedHarvestDate?: string;
  farmerName?: string;
  className?: string;
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

export function ListingFacts({
  cropName,
  cropEmoji,
  variety,
  quantity,
  unitLabel,
  qualityLabel,
  askingPricePerUnit,
  locationText,
  expectedHarvestDate,
  farmerName,
  className,
}: ListingFactsProps) {
  return (
    <div className={cn("space-y-3 text-sm", className)}>
      <div className="flex items-start gap-3">
        <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-xl">
          <span aria-hidden="true">{cropEmoji ?? "🌱"}</span>
        </span>
        <div className="min-w-0">
          <p className="truncate text-lg font-semibold tracking-tight text-foreground">
            {cropName}
          </p>
          {variety ? (
            <p className="truncate text-sm text-muted-foreground">{variety}</p>
          ) : null}
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-x-4 gap-y-2.5 sm:grid-cols-3">
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Quantity
          </dt>
          <dd className="mt-0.5 font-medium text-foreground">
            {quantity} {unitLabel}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Grade
          </dt>
          <dd className="mt-0.5 font-medium text-foreground">{qualityLabel}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Asking price
          </dt>
          <dd className="mt-0.5 font-medium text-foreground">
            {askingPricePerUnit !== undefined ? (
              <>
                {formatInr(askingPricePerUnit)}
                <span className="text-muted-foreground"> / {unitLabel}</span>
              </>
            ) : (
              <span className="text-muted-foreground">Not set</span>
            )}
          </dd>
        </div>
      </dl>

      <div className="space-y-1.5 text-muted-foreground">
        {farmerName ? (
          <p className="font-medium text-foreground">{farmerName}</p>
        ) : null}
        {locationText ? (
          <p className="flex items-start gap-1.5">
            <MapPin className="mt-0.5 size-3.5 shrink-0 text-primary" />
            {locationText}
          </p>
        ) : null}
        {expectedHarvestDate ? (
          <p className="flex items-start gap-1.5">
            <CalendarDays className="mt-0.5 size-3.5 shrink-0 text-primary" />
            Ready: {formatDate(expectedHarvestDate)}
          </p>
        ) : null}
      </div>
    </div>
  );
}
