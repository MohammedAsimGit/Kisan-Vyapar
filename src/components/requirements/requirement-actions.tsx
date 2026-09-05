"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Ban, CheckCircle2, Play, Trash2 } from "lucide-react";
import { patchJson, ApiRequestError } from "@/lib/client/fetch-json";
import { Alert, Button } from "@/components/ui";
import type { BuyerRequirementStatus } from "@/constants/buyer-requirement-statuses";

export function RequirementActions({
  requirementId,
  status,
}: {
  requirementId: string;
  status: BuyerRequirementStatus;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<"cancel" | "fulfill" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function transition(action: "pause" | "resume" | "fulfill" | "cancel") {
    setBusy(action);
    setError(null);
    try {
      const statusMap = {
        pause: "paused",
        resume: "active",
        fulfill: "fulfilled",
        cancel: "cancelled",
      } as const;
      await patchJson(`/api/vendor/requirements/${requirementId}`, {
        status: statusMap[action],
      });
      setConfirm(null);
      router.refresh();
    } catch (err) {
      setError(
        err instanceof ApiRequestError
          ? err.message
          : "We couldn't update this requirement. Please try again.",
      );
    } finally {
      setBusy(null);
    }
  }

  if (status !== "active" && status !== "paused") {
    return null;
  }

  return (
    <div className="flex flex-col items-start gap-3">
      {error ? <Alert tone="error">{error}</Alert> : null}

      {confirm ? (
        <div className="flex items-center gap-2 rounded-xl border border-danger-border bg-danger-bg px-3 py-2">
          <p className="text-sm font-medium text-danger-fg">
            {confirm === "cancel"
              ? "Cancel this requirement?"
              : "Mark this requirement as fulfilled?"}
          </p>
          <Button
            size="sm"
            variant="danger"
            loading={busy === confirm}
            onClick={() => void transition(confirm)}
          >
            {confirm === "cancel" ? "Yes, cancel" : "Yes, fulfilled"}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setConfirm(null)}>
            Keep it
          </Button>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        {status === "active" ? (
          <>
            <Button variant="outline" loading={busy === "pause"} onClick={() => void transition("pause")}>
              <Ban className="size-4" />
              Pause
            </Button>
            <Button
              variant="secondary"
              loading={busy === "fulfill"}
              onClick={() => setConfirm("fulfill")}
            >
              <CheckCircle2 className="size-4" />
              Mark fulfilled
            </Button>
            <Button
              variant="ghost"
              loading={busy === "cancel"}
              onClick={() => setConfirm("cancel")}
            >
              <Trash2 className="size-4" />
              Cancel
            </Button>
          </>
        ) : (
          <>
            <Button loading={busy === "resume"} onClick={() => void transition("resume")}>
              <Play className="size-4" />
              Resume
            </Button>
            <Button
              variant="ghost"
              loading={busy === "cancel"}
              onClick={() => setConfirm("cancel")}
            >
              <Trash2 className="size-4" />
              Cancel
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
