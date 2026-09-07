"use client";

import { useMemo, useState } from "react";
import { ChevronDown, Search, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import {
  CROPS,
  CROP_CATEGORY_LABELS,
  POPULAR_CROPS,
  type CropCategory,
  type CropDefinition,
} from "@/constants/crops";
import { Button, Input } from "@/components/ui";

/**
 * Inline "Which crop?" chooser for the unified crop workspace. Supports a
 * quick search, popular crops on first sight, and an expandable full list —
 * without ever leaving the page.
 */
export function CropPicker({
  value,
  onChange,
  invalidHint,
}: {
  value: string | null;
  onChange: (cropId: string | null) => void;
  invalidHint?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [showAll, setShowAll] = useState(false);

  const selected = value ? CROPS.find((crop) => crop.id === value) : undefined;
  const term = query.trim().toLowerCase();

  const results = useMemo(() => {
    if (!term) {
      return [];
    }
    return CROPS.filter(
      (crop) =>
        crop.name.toLowerCase().includes(term) || crop.id.includes(term),
    );
  }, [term]);

  const searching = term.length > 0;

  function choose(crop: CropDefinition) {
    onChange(crop.id);
    setOpen(false);
    setQuery("");
    setShowAll(false);
  }

  const categories = (showAll
    ? [...new Set(CROPS.map((crop) => crop.category))]
    : []
  ) as CropCategory[];

  return (
    <div>
      {!open && selected ? (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-primary/40 bg-primary-soft/60 p-3 pl-4">
          <p className="flex min-w-0 items-center gap-2.5 font-medium text-foreground">
            <span aria-hidden="true" className="text-2xl leading-none">
              {selected.emoji ?? "🌱"}
            </span>
            <span className="truncate">{selected.name}</span>
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setOpen(true)}
            aria-label="Change crop"
          >
            Change
          </Button>
        </div>
      ) : (
        <>
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            className={cn(
              "flex h-12 w-full items-center justify-between gap-2 rounded-lg border bg-background px-4 text-base font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              !selected && invalidHint
                ? "border-danger text-foreground"
                : "border-border text-muted-foreground",
            )}
          >
            <span className="flex items-center gap-2.5">
              {selected ? (
                <>
                  <span aria-hidden="true" className="text-xl leading-none">
                    {selected.emoji ?? "🌱"}
                  </span>
                  <span className="text-foreground">{selected.name}</span>
                </>
              ) : (
                "Choose a crop…"
              )}
            </span>
            <ChevronDown
              aria-hidden="true"
              className={cn("size-4 transition-transform", open && "rotate-180")}
            />
          </button>
          {!selected && invalidHint ? (
            <p role="alert" className="mt-1.5 text-sm text-red-600">
              {invalidHint}
            </p>
          ) : null}
        </>
      )}

      {open ? (
        <div className="mt-3 space-y-4 rounded-2xl border border-border bg-surface p-4 shadow-card">
          <div className="relative">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              type="search"
              role="searchbox"
              aria-label="Search crops"
              placeholder="Search for a crop…"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="h-11 pl-9 pr-9"
              autoFocus
            />
            {searching ? (
              <button
                type="button"
                aria-label="Clear search"
                onClick={() => setQuery("")}
                className="absolute right-1.5 top-1/2 inline-flex size-8 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <X className="size-4" />
              </button>
            ) : null}
          </div>

          {searching ? (
            results.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                No crop found with “{query}”. Try a different spelling.
              </p>
            ) : (
              <div className="grid max-h-72 grid-cols-3 gap-2 overflow-y-auto pr-1 sm:grid-cols-4">
                {results.map((crop) => (
                  <CropOption key={crop.id} crop={crop} onChoose={choose} />
                ))}
              </div>
            )
          ) : showAll ? (
            <div className="max-h-80 space-y-5 overflow-y-auto pr-1">
              {categories.map((category) => (
                <section key={category}>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    {CROP_CATEGORY_LABELS[category]}
                  </p>
                  <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-4">
                    {CROPS.filter((crop) => crop.category === category).map(
                      (crop) => (
                        <CropOption key={crop.id} crop={crop} onChoose={choose} />
                      ),
                    )}
                  </div>
                </section>
              ))}
              <button
                type="button"
                onClick={() => setShowAll(false)}
                className="text-sm font-medium text-primary underline-offset-4 hover:underline"
              >
                Show popular crops only
              </button>
            </div>
          ) : (
            <>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Popular crops
                </p>
                <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {POPULAR_CROPS.map((crop) => (
                    <CropOption key={crop.id} crop={crop} onChoose={choose} />
                  ))}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAll(true)}
                className="text-sm font-medium text-primary underline-offset-4 hover:underline"
              >
                See all crops
              </button>
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}

function CropOption({
  crop,
  onChoose,
}: {
  crop: CropDefinition;
  onChoose: (crop: CropDefinition) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChoose(crop)}
      className="flex flex-col items-center gap-1 rounded-xl border border-border bg-background p-2.5 pt-3 text-center transition-colors hover:border-primary/50 hover:bg-primary-soft/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <span aria-hidden="true" className="text-2xl leading-none">
        {crop.emoji ?? "🌱"}
      </span>
      <span className="w-full text-xs font-medium leading-tight text-foreground">
        {crop.name}
      </span>
    </button>
  );
}

/** Compact selected-crop summary used in the crop summary section. */
export function CropBadge({ cropId }: { cropId: string | null }) {
  const crop = cropId ? CROPS.find((item) => item.id === cropId) : undefined;
  if (!crop) {
    return null;
  }
  return (
    <span className="inline-flex items-center gap-1.5 font-semibold text-foreground">
      <span aria-hidden="true">{crop.emoji ?? "🌱"}</span>
      {crop.name}
    </span>
  );
}

export function cropNameOf(cropId: string | null): string | undefined {
  if (!cropId) {
    return undefined;
  }
  return CROPS.find((crop) => crop.id === cropId)?.name;
}
