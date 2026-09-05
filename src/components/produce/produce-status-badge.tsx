import { cn } from "@/lib/utils/cn";
import { Badge, type BadgeTone } from "@/components/ui";
import type { ProduceListingStatus } from "@/constants/produce-listing-statuses";

export const PRODUCE_STATUS_LABELS: Record<ProduceListingStatus, string> = {
  draft: "Draft",
  active: "Published",
  sold_out: "Sold out",
  withdrawn: "Inactive",
};

const STATUS_TONES: Record<ProduceListingStatus, BadgeTone> = {
  draft: "warning",
  active: "success",
  sold_out: "neutral",
  withdrawn: "outline",
};

export function produceStatusLabel(status: ProduceListingStatus): string {
  return PRODUCE_STATUS_LABELS[status] ?? status;
}

export function ProduceStatusBadge({
  status,
  className,
}: {
  status: ProduceListingStatus;
  className?: string;
}) {
  return (
    <Badge tone={STATUS_TONES[status] ?? "neutral"} className={cn("px-2.5 py-1", className)}>
      {produceStatusLabel(status)}
    </Badge>
  );
}
