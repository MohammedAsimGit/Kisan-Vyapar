import { cn } from "@/lib/utils/cn";
import { Badge, type BadgeTone } from "@/components/ui";
import {
  OFFER_STATUS_LABELS,
  type OfferStatus,
} from "@/constants/offer-statuses";

const STATUS_TONES: Record<OfferStatus, BadgeTone> = {
  pending: "warning",
  countered: "info",
  accepted: "success",
  rejected: "neutral",
  withdrawn: "outline",
};

export function OfferStatusBadge({
  status,
  className,
}: {
  status: OfferStatus;
  className?: string;
}) {
  return (
    <Badge tone={STATUS_TONES[status] ?? "neutral"} className={cn("px-2.5 py-1", className)}>
      {OFFER_STATUS_LABELS[status] ?? status}
    </Badge>
  );
}