"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, notFound } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowLeft,
  Banknote,
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
  fetchVendorOrder,
  fetchVendorLogistics,
} from "@/lib/client/api-queries";
import { kvKeys } from "@/lib/client/query-keys";
import { DYNAMIC_STALE_TIME } from "@/lib/client/query-client";
import { postJson, ApiRequestError } from "@/lib/client/fetch-json";
import {
  ScreenError,
  ScreenSkeleton,
} from "@/components/dashboard/screen-skeleton";

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
  vendorDeliveryConfirmedAt?: string;
  farmerDeliveryConfirmedAt?: string;
  deliveryIssueReported?: boolean;
  deliveryIssueReason?: string;
  paymentStatus?: "pending" | "confirmed";
  paymentConfirmedAt?: string;
  updatedAt?: string;
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
/* Vendor Order Status Timeline                                               */
/* -------------------------------------------------------------------------- */

function VendorOrderStatusTimeline({ order }: { order: OrderData }) {
  const status = order.status as string;

  const steps = [
    { key: "confirmed", label: "Order Confirmed", icon: CheckCircle2 },
    { key: "in_transit", label: "In Transit", icon: Truck },
    { key: "vendor_confirmed_delivery", label: "Vendor Confirmed Delivery", icon: CheckCircle2 },
    { key: "farmer_confirmed_delivery", label: "Awaiting Farmer Confirmation", icon: Loader2 },
    { key: "payment_pending", label: "Payment Pending", icon: Banknote },
    { key: "payment_confirmed", label: "Payment Confirmed", icon: CheckCircle2 },
    { key: "completed", label: "Completed", icon: CheckCircle2 },
  ];

  return (
    <div className="space-y-1">
      {steps.map((step) => {
        const isReached =
          ["confirmed", "in_transit", "vendor_confirmed_delivery", "farmer_confirmed_delivery", "payment_pending", "payment_confirmed", "completed"].indexOf(status) >
          ["confirmed", "in_transit", "vendor_confirmed_delivery", "farmer_confirmed_delivery", "payment_pending", "payment_confirmed", "completed"].indexOf(step.key);
        const isCurrent = status === step.key;
        const Icon = step.icon;
        const iconClass = isReached
          ? "text-emerald-500"
          : isCurrent
            ? "text-primary animate-pulse"
            : "text-muted-foreground/40";

        return (
          <div key={step.key} className="flex items-center gap-3">
            <Icon className={`size-5 shrink-0 ${iconClass}`} />
            <div>
              <p className={`text-sm font-medium ${
                isReached || isCurrent ? "text-foreground" : "text-muted-foreground"
              }`}>
                {step.label}
              </p>
              {isReached && (
                <p className="text-xs text-muted-foreground">
                  {isCurrent ? order.updatedAt ? formatDateTime(order.updatedAt) : "" : ""}
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
/* Vendor Delivery Confirmation Button                                         */
/* -------------------------------------------------------------------------- */

function VendorDeliveryConfirmButton({ order, onConfirm }: { order: OrderData; onConfirm: () => void }) {
  const [showDialog, setShowDialog] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);

  if (order.status !== "in_transit") {
    return null;
  }

  return (
    <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <Truck className="mt-0.5 size-5 shrink-0 text-primary" />
        <div>
          <h3 className="text-sm font-semibold text-foreground">
            Confirm Delivery
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Confirm that the crop has been delivered to the farmer.
          </p>
        </div>
      </div>

      <div className="mt-4 flex gap-3">
        <Button
          size="lg"
          onClick={() => setShowDialog(true)}
          className="flex-1"
        >
          Confirm Delivery
        </Button>
      </div>

      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
        onClick={() => setShowDialog(false)}
      >
        <div className="w-full max-w-sm rounded-2xl border border-border bg-surface p-6 shadow-lg" onClick={(e) => e.stopPropagation()}>
          <h3 className="text-base font-semibold text-foreground">Confirm Delivery</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Confirm that this crop has been delivered to the farmer?
          </p>
          <div className="mt-6 flex gap-3">
            <Button variant="ghost" className="flex-1" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button
              className="flex-1"
              loading={confirmLoading}
              onClick={async () => {
                setConfirmLoading(true);
                setShowDialog(false);
                onConfirm();
              }}
            >
              Confirm Delivery
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Page                                                                        */
/* -------------------------------------------------------------------------- */

export default function VendorOrderDetailPage() {
  const params = useParams<{ id: string }>();
  const orderId = params?.id ?? "";

  const session = useSessionUser();
  const queryClient = useQueryClient();
  const userId = session.data?.id;

  const orderQuery = useQuery({
    queryKey: kvKeys.vendor(userId ?? "").order(orderId),
    queryFn: () => fetchVendorOrder(orderId),
    staleTime: DYNAMIC_STALE_TIME,
    enabled: Boolean(userId && orderId),
  });

  const logisticsQuery = useQuery({
    queryKey: kvKeys.vendor(userId ?? "").logistics(1),
    queryFn: () => fetchVendorLogistics(1),
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
        href="/vendor/orders"
        className="inline-flex items-center gap-1.5 rounded text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <ArrowLeft className="size-4" />
        My orders
      </Link>

      <PageHeader
        eyebrow="Order"
        title={order.orderNumber}
        description={`Order with farmer ${order.farmer.name ?? "seller"}.`}
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
              Farmer: {order.farmer.name ?? "Seller"}
            </p>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-foreground">
              {formatInr(order.totalValue)}
            </p>
            <p className="text-sm text-muted-foreground">
              {order.quantity} {order.unit} x {formatInr(order.agreedPricePerUnit)}/
              {order.unit}
            </p>
          </div>
        </div>

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

      {/* Vendor Delivery Confirmation Button */}
      {order.status !== "cancelled" && order.status === "in_transit" && (
        <VendorDeliveryConfirmButton
          order={order}
          onConfirm={async () => {
            try {
              await postJson(`/api/vendor/orders/${order.id}/delivery/confirm`, {});
              await queryClient.invalidateQueries({ queryKey: kvKeys.vendor(userId ?? "").order(order.id) });
              void queryClient.invalidateQueries({ queryKey: kvKeys.vendor(userId ?? "").orders(1) });
              window.location.reload();
            } catch (err) {
              // Error shown by the page error boundary
            }
          }}
        />
      )}

      {/* Logistics section — READ ONLY for Vendor */}
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
              <h3 className="text-sm font-semibold text-foreground">Transportation Information</h3>
              <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                {logistics.statusLabel}
              </span>
            </div>

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
                  <p className="text-xs text-muted-foreground">
                    Est. transport cost
                  </p>
                  <p className="text-sm font-medium text-foreground">
                    {formatInr(logistics.estimatedTransportCost)}
                  </p>
                </div>
              )}
              {logistics.pickupScheduledAt && (
                <div>
                  <p className="text-xs text-muted-foreground">
                    Pickup scheduled
                  </p>
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

            <div className="mt-5 border-t border-border pt-4">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Tracking
              </h4>
              <div className="mt-3">
                <LogisticsTimeline logistics={logistics} />
              </div>
            </div>

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
                      -{formatInr(logistics.netRealization.estimatedTransportCost)}
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
        /* No logistics yet — show read-only message, NOT an editable form */
        <div className="rounded-2xl border border-dashed border-border bg-surface-muted/40 p-6">
          <div className="flex items-start gap-3">
            <Truck className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
            <div>
              <h3 className="text-sm font-semibold text-foreground">Transportation Information</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                The farmer has not added transportation details yet. Transportation information will appear here once the farmer arranges the transport.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Order Status Timeline */}
      {!isCancelled && (
        <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-foreground mb-4">Order Status</h3>
          <VendorOrderStatusTimeline order={order} />
        </div>
      )}

      {/* Awaiting Farmer Confirmation state */}
      {order.status === "farmer_confirmed_delivery" && !order.deliveryIssueReported && (
        <div className="rounded-2xl border border-warning-border bg-warning-bg/50 p-5 shadow-card">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 size-5 shrink-0 text-amber-500" />
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                Awaiting Farmer Confirmation
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                You have confirmed delivery. The farmer must now independently confirm they received the crop before payment can be confirmed.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Delivery Issue Reported state */}
      {order.deliveryIssueReported && order.status === "farmer_confirmed_delivery" && (
        <div className="rounded-2xl border border-danger-border bg-danger-bg/50 p-5 shadow-card">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 size-5 shrink-0 text-red-500" />
            <div>
              <h3 className="text-sm font-semibold text-danger-fg">
                Delivery Issue Reported
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                The farmer reported an issue with the delivery.
              </p>
              {order.deliveryIssueReason && (
                <p className="mt-2 text-sm text-foreground">{order.deliveryIssueReason}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Payment Pending state */}
      {order.status === "payment_pending" && (
        <div className="rounded-2xl border border-info-border bg-info-bg/50 p-5 shadow-card">
          <div className="flex items-start gap-3">
            <Banknote className="mt-0.5 size-5 shrink-0 text-blue-500" />
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                Payment Pending
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                The farmer has confirmed delivery. Payment confirmation is now available to the farmer.
              </p>
              {order.paymentStatus === "confirmed" && (
                <p className="mt-2 text-sm text-emerald-600">
                  Payment has been confirmed by the farmer.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Completed state */}
      {order.status === "completed" && (
        <div className="rounded-2xl border border-success-border bg-success-bg/50 p-5 shadow-card">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-500" />
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                Order Completed
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Delivery and payment have both been confirmed. The order is complete.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
