"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Ban, CheckCircle2, Power, Trash2 } from "lucide-react";
import { patchJson, deleteJson, ApiRequestError } from "@/lib/client/fetch-json";
import { Alert, Button } from "@/components/ui";

export function ProduceActions({
  listingId,
  active,
}: {
  listingId: string;
  active: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<null | "status" | "delete">(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggleStatus() {
    setBusy("status");
    setError(null);
    try {
      await patchJson(`/api/farmer/produce/${listingId}`, {
        status: active ? "withdrawn" : "active",
      });
      router.refresh();
    } catch (err) {
      setError(
        err instanceof ApiRequestError ? err.message : "Couldn't update this crop.",
      );
      setBusy(null);
    }
  }

  async function remove() {
    setBusy("delete");
    setError(null);
    try {
      await deleteJson(`/api/farmer/produce/${listingId}`);
      router.push("/farmer/produce");
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Couldn't delete this crop.");
      setBusy(null);
    }
  }

  return (
    <div className="flex flex-col items-start gap-3">
      {error ? <Alert tone="error">{error}</Alert> : null}
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button variant="outline" onClick={() => void toggleStatus()} loading={busy === "status"}>
          {active ? (
            <>
              <Ban className="size-4" />
              Deactivate
            </>
          ) : (
            <>
              <Power className="size-4" />
              Reactivate
            </>
          )}
        </Button>
        {confirmDelete ? (
          <div className="flex items-center gap-2 rounded-xl border border-danger-border bg-danger-bg px-3 py-2">
            <p className="text-sm font-medium text-danger-fg">Delete this crop?</p>
            <Button
              size="sm"
              variant="danger"
              onClick={() => void remove()}
              loading={busy === "delete"}
            >
              Yes, delete
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setConfirmDelete(false)}>
              Cancel
            </Button>
          </div>
        ) : (
          <Button variant="ghost" onClick={() => setConfirmDelete(true)}>
            <Trash2 className="size-4" />
            Delete
          </Button>
        )}
      </div>
      {confirmDelete ? (
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <CheckCircle2 className="size-3.5" />
          Deleting removes this crop permanently.
        </p>
      ) : null}
    </div>
  );
}
