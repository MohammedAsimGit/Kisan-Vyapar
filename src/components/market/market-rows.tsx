"use client";

import { useMemo, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export interface MarketRowItem {
  market: string;
  district?: string;
  state?: string;
  variety?: string;
  grade?: string;
  modalPrice: number;
  minPrice?: number;
  maxPrice?: number;
  arrivalDate?: string;
  fetchedAt: string;
  source?: string;
}

type SortMode = "original" | "highest" | "lowest";

export function MarketRows({
  rows,
  unit,
}: {
  rows: MarketRowItem[];
  unit: string;
}) {
  const [sort, setSort] = useState<SortMode>("original");
  const [expanded, setExpanded] = useState<string | null>(null);

  const sorted = useMemo(() => {
    const copy = [...rows];
    if (sort === "highest") {
      copy.sort((a, b) => b.modalPrice - a.modalPrice);
    } else if (sort === "lowest") {
      copy.sort((a, b) => a.modalPrice - b.modalPrice);
    }
    return copy;
  }, [rows, sort]);

  return (
    <div className="space-y-4">
      {rows.length > 1 ? (
        <div className="flex flex-wrap gap-2" role="group" aria-label="Sort markets">
          <SortChip active={sort === "original"} onClick={() => setSort("original")}>
            All
          </SortChip>
          <SortChip active={sort === "highest"} onClick={() => setSort("highest")}>
            Price high → low
          </SortChip>
          <SortChip active={sort === "lowest"} onClick={() => setSort("lowest")}>
            Price low → high
          </SortChip>
        </div>
      ) : null}

      <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface shadow-card">
        {sorted.map((row) => {
          const open = expanded === row.market;
          return (
            <li key={`${row.market}-${row.variety ?? ""}-${row.grade ?? ""}`}>
              <button
                type="button"
                aria-expanded={open}
                onClick={() => setExpanded(open ? null : row.market)}
                className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring sm:px-5"
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium text-foreground">
                    {row.market}
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {formatCompact(row.modalPrice)} ·{" "}
                    {row.minPrice !== undefined && row.maxPrice !== undefined
                      ? `${formatCompact(row.minPrice)}–${formatCompact(row.maxPrice)}`
                      : "range n/a"}
                    {row.district ? ` · ${row.district}` : ""}
                  </span>
                </span>
                <span className="shrink-0 text-right font-semibold text-foreground">
                  {formatInr(row.modalPrice)}
                </span>
                {open ? (
                  <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
                ) : (
                  <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                )}
              </button>

              {open ? (
                <div className="border-t border-border bg-muted/40 px-4 py-4 sm:px-5">
                  <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-3">
                    <Detail label="Min price" value={row.minPrice !== undefined ? formatInr(row.minPrice) : "—"} />
                    <Detail label="Modal price" value={formatInr(row.modalPrice)} />
                    <Detail label="Max price" value={row.maxPrice !== undefined ? formatInr(row.maxPrice) : "—"} />
                    <Detail label="Location" value={[row.district, row.state].filter(Boolean).join(", ") || "—"} />
                    <Detail label="Arrival" value={row.arrivalDate ? formatDate(row.arrivalDate) : "—"} />
                    <Detail label="Source" value={row.source ?? "Government market data"} />
                  </dl>
                  <p className="mt-3 text-xs text-muted-foreground">
                    {row.variety || row.grade
                      ? `Variety: ${row.variety ?? "—"} · Grade: ${row.grade ?? "—"} · `
                      : ""}
                    Unit: per {unit}
                  </p>
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function SortChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "inline-flex h-9 items-center rounded-full border px-3.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-surface text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 font-medium text-foreground">{value}</dd>
    </div>
  );
}

function formatInr(value: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatCompact(value: number): string {
  if (value >= 1000) {
    return `₹${(value / 1000).toFixed(value % 1000 === 0 ? 0 : 1)}k`;
  }
  return `₹${value}`;
}

function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
