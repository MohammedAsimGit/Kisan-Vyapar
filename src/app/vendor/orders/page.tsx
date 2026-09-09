"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Package } from "lucide-react";
import { EmptyState, PageHeader } from "@/components/ui";
import { useSessionUser } from "@/lib/client/use-session-user";
import { fetchVendorOrders } from "@/lib/client/api-queries";
import { kvKeys } from "@/lib/client/query-keys";
import { DYNAMIC_STALE_TIME } from "@/lib/client/query-client";
import { ScreenError, ScreenSkeleton } from "@/components/dashboard/screen-skeleton";

/* -------------------------------------------------------------------------- */
/* Types                                                                       */
/* -------------------------------------------------------------------------- */

interface OrderRow {
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
  createdAt?: string;
  updatedAt?: string;
}

interface OrdersResult {
  orders: OrderRow[];
  total: number;
  page: number;
  limit: number;
}

/* -------------------------------------------------------------------------- */
/* Helpers                                                                     */
/* -------------------------------------------------------------------------- */

function readPage(sp: string | null): number {
  const n = parseInt(sp ?? "1", 10);
  return Number.isFinite(n) && n > 0 ? n : 1;
}

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

const STATUS_STYLES: Record<string, string> = {
  confirmed: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  pending: "bg-amber-50 text-amber-700 ring-amber-200",
  in_transit: "bg-blue-50 text-blue-700 ring-blue-200",
  delivered: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  completed: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  cancelled: "bg-red-50 text-red-600 ring-red-200",
};

function OrderCard({ order }: { order: OrderRow }) {
  const statusKey = order.status.toLowerCase().replace(/\s+/g, "_");
  const style = STATUS_STYLES[statusKey] ?? "bg-muted text-muted-foreground ring-border";

  return (
    <Link
      href={`/vendor/orders/${order.id}`}
      className="block rounded-2xl border border-border bg-surface p-4 shadow-sm transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-foreground">
              {order.orderNumber}
            </span>
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${style}`}
            >
              {order.status.replace(/_/g, " ")}
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {order.cropName}
            {order.quality ? ` · ${order.quality}` : ""}
          </p>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Farmer: {order.farmer.name ?? "Seller"}
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold text-foreground">
            {formatInr(order.totalValue)}
          </p>
          <p className="text-xs text-muted-foreground">
            {order.quantity} {order.unit}
          </p>
          <p className="text-xs text-muted-foreground">
            {formatInr(order.agreedPricePerUnit)}/{order.unit}
          </p>
        </div>
      </div>
      <div className="mt-3 border-t border-border pt-2">
        <p className="text-xs text-muted-foreground">
          Created {formatDate(order.createdAt)}
        </p>
      </div>
    </Link>
  );
}

/* -------------------------------------------------------------------------- */
/* Page                                                                        */
/* -------------------------------------------------------------------------- */

export default function VendorOrdersPage() {
  return (
    <Suspense fallback={<ScreenSkeleton maxWidth="max-w-4xl" />}>
      <VendorOrdersContent />
    </Suspense>
  );
}

function VendorOrdersContent() {
  const searchParams = useSearchParams();
  const page = readPage(searchParams.get("page"));
  const session = useSessionUser();
  const userId = session.data?.id;

  const ordersQuery = useQuery({
    queryKey: kvKeys.vendor(userId ?? "").orders(page),
    queryFn: () => fetchVendorOrders(page),
    staleTime: DYNAMIC_STALE_TIME,
    placeholderData: keepPreviousData,
    enabled: Boolean(userId),
  });

  if (!userId) {
    return <ScreenSkeleton maxWidth="max-w-4xl" />;
  }
  if (ordersQuery.isPending) {
    return <ScreenSkeleton maxWidth="max-w-4xl" />;
  }
  if (ordersQuery.isError) {
    return (
      <ScreenError
        onRetry={() => void ordersQuery.refetch()}
        description="We couldn't load your orders right now. Please try again."
      />
    );
  }

  const result = ordersQuery.data as unknown as OrdersResult;

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <PageHeader
        eyebrow="Orders"
        title="My orders"
        description="Orders created from accepted negotiations."
      />

      {result.orders.length === 0 ? (
        <EmptyState
          icon={<Package className="size-6" />}
          title="No orders yet"
          description="When a farmer accepts your offer, the order will appear here."
        />
      ) : (
        <>
          <p className="text-sm text-muted-foreground">
            {result.total} {result.total === 1 ? "order" : "orders"}
          </p>
          <div className="space-y-3">
            {result.orders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
