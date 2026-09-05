import { cn } from "@/lib/utils/cn";
import { MapPin } from "lucide-react";

export interface RequirementFactsProps {
  quantity: number;
  unitLabel: string;
  qualityLabel: string;
  targetPriceMin: number;
  targetPriceMax: number;
  locationText?: string;
  requiredBy: string;
  notes?: string;
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

export function RequirementFacts({
  quantity,
  unitLabel,
  qualityLabel,
  targetPriceMin,
  targetPriceMax,
  locationText,
  requiredBy,
  notes,
  className,
}: RequirementFactsProps) {
  return (
    <div className={cn("space-y-3 text-sm", className)}>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-2.5 sm:grid-cols-3">
        <Fact label="Quantity" value={`${quantity} ${unitLabel}`} />
        <Fact label="Grade" value={qualityLabel} />
        <Fact
          label="Target price"
          value={`${formatInr(targetPriceMin)} – ${formatInr(targetPriceMax)}`}
        />
        {locationText ? (
          <div className="col-span-2 sm:col-span-1">
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Preferred location
            </dt>
            <dd className="mt-0.5 flex items-start gap-1 font-medium text-foreground">
              <MapPin className="mt-0.5 size-3.5 shrink-0 text-primary" />
              <span>{locationText}</span>
            </dd>
          </div>
        ) : null}
        <Fact label="Required by" value={formatDate(requiredBy)} />
      </dl>

      {notes ? (
        <p className="rounded-xl bg-muted/60 px-3.5 py-2.5 text-sm leading-6 text-muted-foreground">
          <span className="font-medium text-foreground">Notes:</span> {notes}
        </p>
      ) : null}
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-0.5 font-medium text-foreground">{value}</dd>
    </div>
  );
}
