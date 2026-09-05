import { cn } from "@/lib/utils/cn";
import { Badge, type BadgeTone } from "@/components/ui";
import {
  BUYER_REQUIREMENT_STATUS_LABELS,
  type BuyerRequirementStatus,
} from "@/constants/buyer-requirement-statuses";

const STATUS_TONES: Record<BuyerRequirementStatus, BadgeTone> = {
  active: "success",
  paused: "warning",
  fulfilled: "info",
  expired: "neutral",
  cancelled: "outline",
};

export function requirementStatusLabel(status: BuyerRequirementStatus): string {
  return BUYER_REQUIREMENT_STATUS_LABELS[status] ?? status;
}

export function RequirementStatusBadge({
  status,
  className,
}: {
  status: BuyerRequirementStatus;
  className?: string;
}) {
  return (
    <Badge tone={STATUS_TONES[status] ?? "neutral"} className={cn("px-2.5 py-1", className)}>
      {requirementStatusLabel(status)}
    </Badge>
  );
}
