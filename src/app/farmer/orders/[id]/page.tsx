"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, notFound } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Circle,
  Loader2,
  MapPin,
  Truck,
} from "lucide-react";
import { Button, PageHeader } from "@/components/ui";
import { useSessionUser } from "@/lib/client/use-session-user";
import {
  fetchFarmerOrder,
  fetchFarmerLogistics,
} from "@/lib/client/api-queries";
import { kvKeys } from "@/lib/client/query-keys";
import { DYNAMIC_STALE_TIME } from "@/lib/client/query-client";
import { postJson } from "@/lib/client/fetch-json";
import {
  ScreenError,
  ScreenSkeleton,
} from "@/components/dashboard/screen-skeleton";
import { ApiRequestError } from "@/lib/client/fetch-json";

/* -------------------------------------------------------------------------- */
/* Types                                                                       */
/* -------------------------------------------------------------------------- */

interface OrderData {
  id: string;
  orderNumber: string;
  status: string;
  quantity: number;
  unit: string;
  agreedPricePerUnit: number;
  totalValue: number;
  currency: string;
  cropName: string;
  quality?: string;
  farmer: { profileId: string; name?: string };
  vendor: { profileId: string; businessName?: string };
  pickupLocation?: {
    label?: string;
    address?: { line?: string; village?: string; district?: string; state?: string };
  };
  deliveryLocation?: {
    label?: string;
    address?: { line?: string; village?: string; district?: string; state?: string };
  };
  createdAt?: string;
}

interface LogisticsItem {
  id: string;
  orderId: string;
  status: string;
  statusLabel: string;
  quantity: number;
  unit: string;
  cropName: string;
  pickup: { label?: string; address?: { village?: string; district?: string; state?: string } };
  delivery: { label?: string; address?: { village?: string; district?: string; state?: string } };
  distanceKm: number | null;
  vehicleType?: string;
  estimatedTransportCost: number | null;
  pickupScheduledAt?: string;
  estimatedDeliveryAt?: string;
  timeline: Array<{ status: string; label: string; reached: boolean; current: boolean }>;
  netRealization?: {
    grossValue: number;
    estimatedTransportCost: number;
    netValue: number;
    netPerUnit: number;
  };
  createdAt?: string;
}

interface LogisticsListResult {
  logistics: LogisticsItem[];
  total: number;
}

/* -------------------------------------------------------------------------- */
/* Helpers                                                                     */
/* -------------------------------------------------------------------------- */

function formatInr(value: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(dateStr?: string): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function addressLine(addr?: { line?: string; village?: string; district?: string; state?: string }): string {
  if (!addr) return "Address not set";
  const parts = [addr.line, addr.village, addr.district, addr.state].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : "Address not set";
}

function LocationSummary({ label, address }: { label?: string; address?: { line?: string; village?: string; district?: string; state?: string } }) {
  return (
    <div className="flex items-start gap-2">
      <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
      <div>
        {label && <p className="text-sm font-medium text-foreground">{label}</p>}
        <p className="text-sm text-muted-foreground">{addressLine(address)}</p>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Logistics Tracking Timeline                                                 */
/* -------------------------------------------------------------------------- */

function LogisticsTimeline({ logistics }: { logistics: LogisticsItem }) {
  return (
    <div className="space-y-0">
      {logistics.timeline.map((step, i) => {
        const Icon = step.reached
          ? CheckCircle2
          : step.current
            ? Loader2
            : Circle;
        const iconClass = step.reached
          ? "text-emerald-500"
          : step.current
            ? "text-primary animate-pulse"
            : "text-muted-foreground/40";

        return (
          <div key={step.status} className="flex gap-3">
            {/* Vertical line + icon */}
            <div className="flex flex-col items-center">
              <Icon className={`size-5 shrink-0 ${iconClass}`} />
              {i < logistics.timeline.length - 1 && (
                <div
                  className={`w-px flex-1 ${
                    step.reached ? "bg-emerald-300" : "bg-border"
                  }`}
                />
              )}
            </div>
            {/* Label */}
            <div className="pb-4">
              <p
                className={`text-sm font-medium ${
                  step.reached || step.current
                    ? "text-foreground"
                    : "text-muted-foreground"
                }`}
              >
                {step.label}
              </p>
              {step.current && logistics.pickupScheduledAt && step.status === "scheduled" && (
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Pickup: {formatDateTime(logistics.pickupScheduledAt)}
                </p>
              )}
              {step.current && logistics.estimatedDeliveryAt && step.status === "in_transit" && (
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Expected: {formatDateTime(logistics.estimatedDeliveryAt)}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Create Logistics Form                                                       */
/* -------------------------------------------------------------------------- */

function CreateLogisticsForm({
  orderId,
  orderNumber,
  onSuccess,
}: {
  orderId: string;
  orderNumber: string;
  onSuccess: () => void;
}) {
  const session = useSessionUser();
  const queryClient = useQueryClient();
  const userId = session.data?.id ?? "";

  const [vehicleType, setVehicleType] = useState("medium_truck");
  const [pickupDate, setPickupDate] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");

  const createMutation = useMutation({
    mutationFn: async () => {
      return postJson<{ logistics: LogisticsItem }>("/api/farmer/logistics", {
        orderId,
        vehicleType,
        pickupScheduledAt: pickupDate ? new Date(pickupDate).toISOString() : undefined,
        estimatedDeliveryAt: deliveryDate ? new Date(deliveryDate).toISOString() : undefined,
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: kvKeys.farmer(userId).orders(1),
      });
      void queryClient.invalidateQueries({
        queryKey: kvKeys.farmer(userId).logistics(1),
      });
      onSuccess();
    },
  });

  return (
    <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-foreground">Arrange Transport</h3>
      <p className="mt-1 text-xs text-muted-foreground">
        Order {orderNumber} — Create a logistics record to schedule pickup and delivery.
      </p>

      <div className="mt-4 space-y-4">
        <div>
          <label htmlFor="vehicleType" className="block text-sm font-medium text-foreground">
            Vehicle type
          </label>
          <select
            id="vehicleType"
            value={vehicleType}
            onChange={(e) => setVehicleType(e.target.value)}
            className="mt-1 block w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="tempo">Tempo</option>
            <option value="mini_truck">Mini Truck</option>
            <option value="medium_truck">Medium Truck</option>
            <option value="large_truck">Large Truck</option>
            <option value="trailer">Trailer</option>
          </select>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="pickupDate" className="block text-sm font-medium text-foreground">
              Pickup date
            </label>
            <input
              id="pickupDate"
              type="datetime-local"
              value={pickupDate}
              onChange={(e) => setPickupDate(e.target.value)}
              className="mt-1 block w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          <div>
            <label htmlFor="deliveryDate" className="block text-sm font-medium text-foreground">
              Expected delivery
            </label>
            <input
              id="deliveryDate"
              type="datetime-local"
              value={deliveryDate}
              onChange={(e) => setDeliveryDate(e.target.value)}
              className="mt-1 block w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
        </div>

        {createMutation.isError && (
          <p className="text-sm text-red-600">
            {(createMutation.error as Error).message || "Failed to create logistics."}
          </p>
        )}

        <Button
          onClick={() => createMutation.mutate()}
          disabled={createMutation.isPending}
          className="w-full"
        >
          {createMutation.isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Truck className="size-4" />
          )}
          Create Logistics Record
        </Button>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Page                                                                        */
/* -------------------------------------------------------------------------- */

export default function FarmerOrderDetailPage() {
  const params = useParams<{ id: string }>();
  const orderId = params?.id ?? "";

  const session = useSessionUser();
  const userId = session.data?.id;

  const orderQuery = useQuery({
    queryKey: kvKeys.farmer(userId ?? "").order(orderId),
    queryFn: () => fetchFarmerOrder(orderId),
    staleTime: DYNAMIC_STALE_TIME,
    enabled: Boolean(userId && orderId),
  });

  // Fetch logistics list for this user, then find the one matching this order
  const logisticsQuery = useQuery({
    queryKey: kvKeys.farmer(userId ?? "").logistics(1),
    queryFn: () => fetchFarmerLogistics(1),
    staleTime: DYNAMIC_STALE_TIME,
    enabled: Boolean(userId),
  });

  if (!userId || orderQuery.isPending) {
    return <ScreenSkeleton maxWidth="max-w-4xl" />;
  }
  if (orderQuery.isError) {
    const status = (orderQuery.error as ApiRequestError | undefined)?.status;
    if (status === 404 || status === 400) {
      notFound();
    }
    return (
      <ScreenError
        onRetry={() => void orderQuery.refetch()}
        description="We couldn't load this order right now."
      />
    );
  }

  const order = orderQuery.data as unknown as OrderData;
  const logisticsResult = logisticsQuery.data as LogisticsListResult | undefined;
  const logistics = logisticsResult?.logistics?.find((l: unknown) => (l as LogisticsItem).orderId === order.id) as LogisticsItem | undefined;

  const statusKey = order.status.toLowerCase().replace(/\s+/g, "_");
  const isCancelled = statusKey === "cancelled";

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <Link
        href="/farmer/orders"
        className="inline-flex items-center gap-1.5 rounded text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <ArrowLeft className="size-4" />
        My orders
      </Link>

      <PageHeader
        eyebrow="Order"
        title={order.orderNumber}
        description={`Created from accepted negotiation with ${order.vendor.businessName ?? "buyer"}.`}
      />

      {/* Order summary card */}
      <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-base font-semibold text-foreground">
              {order.cropName}
              {order.quality ? ` · ${order.quality}` : ""}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {order.vendor.businessName ?? "Buyer"}
            </p>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-foreground">
              {formatInr(order.totalValue)}
            </p>
            <p className="text-sm text-muted-foreground">
              {order.quantity} {order.unit} × {formatInr(order.agreedPricePerUnit)}/{order.unit}
            </p>
          </div>
        </div>

        {/* Locations */}
        {(order.pickupLocation || order.deliveryLocation) && (
          <div className="mt-4 grid gap-4 border-t border-border pt-4 sm:grid-cols-2">
            {order.pickupLocation && (
              <LocationSummary
                label="Pickup"
                address={order.pickupLocation.address}
              />
            )}
            {order.deliveryLocation && (
              <LocationSummary
                label="Delivery"
                address={order.deliveryLocation.address}
              />
            )}
          </div>
        )}

        <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
          <CalendarDays className="size-4" />
          Created {formatDate(order.createdAt)}
        </div>
      </div>

      {/* Logistics section */}
      {isCancelled ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface-muted/40 p-6 text-center">
          <p className="text-sm font-medium text-muted-foreground">
            This order has been cancelled.
          </p>
        </div>
      ) : logistics ? (
        <div className="space-y-6">
          <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <Truck className="size-5 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Logistics</h3>
              <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                {logistics.statusLabel}
              </span>
            </div>

            {/* Transport details */}
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs text-muted-foreground">Vehicle</p>
                <p className="text-sm font-medium text-foreground">
                  {logistics.vehicleType?.replace(/_/g, " ") ?? "Not set"}
                </p>
              </div>
              {logistics.distanceKm !== null && (
                <div>
                  <p className="text-xs text-muted-foreground">Distance</p>
                  <p className="text-sm font-medium text-foreground">
                    {logistics.distanceKm} km
                  </p>
                </div>
              )}
              {logistics.estimatedTransportCost !== null && (
                <div>
                  <p className="text-xs text-muted-foreground">Est. transport cost</p>
                  <p className="text-sm font-medium text-foreground">
                    {formatInr(logistics.estimatedTransportCost)}
                  </p>
                </div>
              )}
              {logistics.pickupScheduledAt && (
                <div>
                  <p className="text-xs text-muted-foreground">Pickup scheduled</p>
                  <p className="text-sm font-medium text-foreground">
                    {formatDateTime(logistics.pickupScheduledAt)}
                  </p>
                </div>
              )}
              {logistics.estimatedDeliveryAt && (
                <div>
                  <p className="text-xs text-muted-foreground">Est. delivery</p>
                  <p className="text-sm font-medium text-foreground">
                    {formatDateTime(logistics.estimatedDeliveryAt)}
                  </p>
                </div>
              )}
            </div>

            {/* Timeline */}
            <div className="mt-5 border-t border-border pt-4">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Tracking
              </h4>
              <div className="mt-3">
                <LogisticsTimeline logistics={logistics} />
              </div>
            </div>

            {/* Net realization */}
            {logistics.netRealization && (
              <div className="mt-4 rounded-xl bg-muted/50 p-4">
                <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Net realization
                </h4>
                <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-muted-foreground">Gross</p>
                    <p className="font-medium text-foreground">
                      {formatInr(logistics.netRealization.grossValue)}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Transport</p>
                    <p className="font-medium text-foreground">
                      −{formatInr(logistics.netRealization.estimatedTransportCost)}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Net</p>
                    <p className="font-semibold text-foreground">
                      {formatInr(logistics.netRealization.netValue)}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Net/unit</p>
                    <p className="font-medium text-foreground">
                      {formatInr(logistics.netRealization.netPerUnit)}/{order.unit}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <CreateLogisticsForm
          orderId={order.id}
          orderNumber={order.orderNumber}
          onSuccess={() => void logisticsQuery.refetch()}
        />
      )}
    </div>
  );
}
