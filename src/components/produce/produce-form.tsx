"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  MapPin,
  Search,
  Sprout,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import {
  CROPS,
  CROP_CATEGORY_LABELS,
  getCropVarieties,
  POPULAR_CROPS,
  type CropDefinition,
} from "@/constants/crops";
import {
  MEASUREMENT_UNITS,
  type MeasurementUnit,
} from "@/constants/measurement-units";
import {
  QUALITY_GRADE_OPTIONS,
  type QualityGrade,
} from "@/constants/quality-grades";
import { patchJson, postJson, ApiRequestError } from "@/lib/client/fetch-json";
import { Alert, Button, Field, Input, linkButtonClass } from "@/components/ui";

export interface ProduceProfileLocation {
  village?: string;
  district?: string;
  state?: string;
  pincode?: string;
}

export interface ProduceInitialValues {
  crop?: string;
  variety?: string;
  quantity?: number;
  unit?: MeasurementUnit;
  quality?: QualityGrade;
  location?: ProduceProfileLocation;
  expectedHarvestDate?: string;
}

interface ProduceFormProps {
  mode: "create" | "edit";
  listingId?: string;
  initial?: ProduceInitialValues;
  profileLocation?: ProduceProfileLocation;
}

const QUICK_QUANTITIES = [5, 10, 20, 50, 100];

const UNIT_OPTIONS: { value: MeasurementUnit; label: string; hint: string }[] = [
  { value: MEASUREMENT_UNITS.KILOGRAM, label: "Kg", hint: "Kilogram" },
  { value: MEASUREMENT_UNITS.QUINTAL, label: "Quintal", hint: "100 kg" },
  { value: MEASUREMENT_UNITS.TONNE, label: "Tonne", hint: "1000 kg" },
];

const dateOnlyPattern = /^\d{4}-\d{2}-\d{2}$/;

export function ProduceForm({
  mode,
  listingId,
  initial,
  profileLocation,
}: ProduceFormProps) {
  const isEdit = mode === "edit";

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Crop step
  const [cropId, setCropId] = useState<string | null>(initial?.crop ?? null);
  const [query, setQuery] = useState("");
  const [showAll, setShowAll] = useState(false);

  // Details step
  const [quantity, setQuantity] = useState(
    initial?.quantity !== undefined ? String(initial.quantity) : "",
  );
  const [unit, setUnit] = useState<MeasurementUnit>(initial?.unit ?? "quintal");
  const [quality, setQuality] = useState<QualityGrade | null>(
    initial?.quality ?? null,
  );
  const [variety, setVariety] = useState(initial?.variety ?? "");
  const [village, setVillage] = useState(
    initial?.location?.village ?? profileLocation?.village ?? "",
  );
  const [district, setDistrict] = useState(
    initial?.location?.district ?? profileLocation?.district ?? "",
  );
  const [state, setState] = useState(
    initial?.location?.state ?? profileLocation?.state ?? "",
  );
  const [pincode, setPincode] = useState(
    initial?.location?.pincode ?? profileLocation?.pincode ?? "",
  );
  const [alreadyHarvested, setAlreadyHarvested] = useState(false);
  const [harvestDate, setHarvestDate] = useState(
    initial?.expectedHarvestDate ?? "",
  );

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cropDef = cropId ? CROPS.find((crop) => crop.id === cropId) : undefined;

  const filteredCrops = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) {
      return [];
    }
    return CROPS.filter(
      (crop) =>
        crop.name.toLowerCase().includes(term) || crop.id.includes(term),
    );
  }, [query]);

  const searchActive = query.trim().length > 0;

  function chooseCrop(crop: CropDefinition) {
    setCropId(crop.id);
    setError(null);
    setVariety("");
  }

  const quantityNumber = Number(quantity);

  const detailsErrors: string[] = [];
  if (!quantity || !Number.isFinite(quantityNumber) || quantityNumber <= 0) {
    detailsErrors.push("Please enter how much you grew (more than zero).");
  }
  if (!quality) {
    detailsErrors.push("Please choose a quality.");
  }
  if (!district.trim() || !state.trim()) {
    detailsErrors.push("Please add your district and state.");
  }
  if (harvestDate !== "today" && !dateOnlyPattern.test(harvestDate)) {
    detailsErrors.push("Please choose when your crop will be ready.");
  }

  function goToDetails() {
    setError(null);
    setStep(2);
  }

  function goToReview() {
    setError(null);
    if (detailsErrors.length > 0) {
      setError(detailsErrors[0]);
      return;
    }
    setStep(3);
  }

  function payload() {
    return {
      crop: cropId,
      variety: variety.trim() || undefined,
      quantity: quantityNumber,
      unit,
      quality,
      location: {
        address: {
          village: village.trim() || undefined,
          district: district.trim(),
          state: state.trim(),
          pincode: pincode.trim() || undefined,
        },
      },
      expectedHarvestDate:
        alreadyHarvested || harvestDate === "today"
          ? new Date().toISOString().slice(0, 10)
          : harvestDate,
    };
  }

  async function submit() {
    if (!cropId || !quality) {
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      if (isEdit && listingId) {
        await patchJson(`/api/farmer/produce/${listingId}`, payload());
      } else {
        await postJson("/api/farmer/produce", payload());
      }
      setStep(4);
    } catch (err) {
      setError(
        err instanceof ApiRequestError
          ? err.message
          : isEdit
            ? "We couldn't update your crop. Please try again."
            : "We couldn't save your crop. Please try again.",
      );
      setSubmitting(false);
    }
  }

  function setHarvestToday() {
    setAlreadyHarvested(true);
    setHarvestDate("today");
  }

  if (step === 4) {
    const viewHref = isEdit && listingId ? `/farmer/produce/${listingId}` : "/farmer/produce";
    return (
      <div className="mx-auto max-w-lg py-6 text-center">
        <span className="inline-flex size-16 items-center justify-center rounded-full bg-success-bg text-success-fg">
          <Check className="size-8" />
        </span>
        <h1 className="mt-6 text-2xl font-semibold tracking-tight">
          {isEdit ? "Your crop has been updated" : "Your crop has been saved"}
        </h1>
        <p className="mx-auto mt-2 max-w-md text-muted-foreground">
          Next, we&apos;ll help you understand today&apos;s market price for your{" "}
          {cropDef?.name?.toLowerCase()}. That arrives in an upcoming update.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href={viewHref} className={linkButtonClass("outline", "md")}>
            View My Crop
          </Link>
          <Link href="/farmer/produce" className={linkButtonClass("primary", "md")}>
            Go to My Produce
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <StepProgress step={step} />

      {error ? (
        <div className="mt-6">
          <Alert tone="error" title="We couldn't continue.">
            {error}
          </Alert>
        </div>
      ) : null}

      {step === 1 ? (
        <CropStep
          selectedCropId={cropId}
          query={query}
          setQuery={setQuery}
          showAll={showAll}
          setShowAll={setShowAll}
          searchActive={searchActive}
          filteredCrops={filteredCrops}
          onChoose={chooseCrop}
          onContinue={goToDetails}
        />
      ) : null}

      {step === 2 && cropDef ? (
        <div className="mt-8 space-y-8">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="inline-flex size-11 items-center justify-center rounded-xl bg-primary-soft text-xl">
                {cropDef.emoji ?? "🌱"}
              </span>
              <div>
                <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
                  {cropDef.name}
                </h1>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                >
                  Change crop
                </button>
              </div>
            </div>
          </div>

          {/* Quantity */}
          <section className="space-y-3">
            <StepHeading>How much did you grow?</StepHeading>
            <div className="flex items-end gap-3">
              <Input
                type="number"
                inputMode="decimal"
                min={1}
                value={quantity}
                onChange={(event) => setQuantity(event.target.value)}
                placeholder="e.g. 20"
                aria-label="Quantity"
                className="h-14 text-2xl font-semibold"
              />
              <p className="pb-2 text-lg font-medium text-foreground">
                {UNIT_OPTIONS.find((option) => option.value === unit)?.label}
              </p>
            </div>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Quick quantity">
              {QUICK_QUANTITIES.map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setQuantity(String(value))}
                  className="inline-flex h-10 items-center rounded-full border border-border bg-background px-4 text-sm font-medium text-foreground transition-colors hover:border-primary hover:bg-primary-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {value}
                  {value === 100 ? "+" : ""}
                </button>
              ))}
            </div>
          </section>

          {/* Unit */}
          <section className="space-y-3">
            <StepHeading>Which unit?</StepHeading>
            <div className="grid grid-cols-3 gap-3" role="radiogroup" aria-label="Unit">
              {UNIT_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  role="radio"
                  aria-checked={unit === option.value}
                  onClick={() => setUnit(option.value)}
                  className={cn(
                    "rounded-xl border p-4 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                    unit === option.value
                      ? "border-primary bg-primary-soft shadow-card"
                      : "border-border bg-surface hover:border-primary/50",
                  )}
                >
                  <span className="block text-base font-semibold">{option.label}</span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    {option.hint}
                  </span>
                </button>
              ))}
            </div>
          </section>

          {/* Quality */}
          <section className="space-y-3">
            <StepHeading>What&apos;s the quality of your produce?</StepHeading>
            <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Quality">
              {QUALITY_GRADE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  role="radio"
                  aria-checked={quality === option.value}
                  onClick={() => setQuality(option.value)}
                  className={cn(
                    "flex items-center gap-3 rounded-xl border p-4 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                    quality === option.value
                      ? "border-primary bg-primary-soft shadow-card"
                      : "border-border bg-surface hover:border-primary/50",
                  )}
                >
                  <span
                    aria-hidden="true"
                    className={cn(
                      "inline-flex size-6 shrink-0 items-center justify-center rounded-full border",
                      quality === option.value
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border-strong",
                    )}
                  >
                    {quality === option.value ? <Check className="size-3.5" /> : null}
                  </span>
                  <span>
                    <span className="block text-base font-semibold">{option.label}</span>
                    <span className="block text-xs text-muted-foreground">
                      {option.description}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </section>

          {/* Variety */}
          {getCropVarieties(cropId ?? "")?.length ? (
            <section className="space-y-3">
              <StepHeading>Which variety?</StepHeading>
              <Field label="Variety (optional)" htmlFor="variety">
                <select
                  id="variety"
                  value={variety}
                  onChange={(event) => setVariety(event.target.value)}
                  className="flex h-12 w-full appearance-none rounded-lg border border-border bg-background px-3.5 text-base text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  <option value="">Not sure / Other</option>
                  {(getCropVarieties(cropDef.id) ?? []).map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
              </Field>
            </section>
          ) : null}

          {/* Location */}
          <section className="space-y-3">
            <StepHeading>Where is the crop?</StepHeading>
            <div className="rounded-2xl border border-border bg-surface p-5 shadow-card">
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 size-5 shrink-0 text-primary" />
                <div className="grid flex-1 gap-3 sm:grid-cols-2">
                  <Field label="Village / town" htmlFor="locVillage">
                    <Input
                      id="locVillage"
                      value={village}
                      onChange={(event) => setVillage(event.target.value)}
                      placeholder="e.g. Devanahalli"
                    />
                  </Field>
                  <Field label="District" htmlFor="locDistrict">
                    <Input
                      id="locDistrict"
                      value={district}
                      onChange={(event) => setDistrict(event.target.value)}
                      placeholder="e.g. Bengaluru Rural"
                    />
                  </Field>
                  <Field label="State" htmlFor="locState">
                    <Input
                      id="locState"
                      value={state}
                      onChange={(event) => setState(event.target.value)}
                      placeholder="e.g. Karnataka"
                    />
                  </Field>
                  <Field label="PIN code (optional)" htmlFor="locPincode">
                    <Input
                      id="locPincode"
                      inputMode="numeric"
                      value={pincode}
                      onChange={(event) => setPincode(event.target.value)}
                      placeholder="e.g. 562110"
                    />
                  </Field>
                </div>
              </div>
              <p className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground">
                <Check className="size-3.5 text-primary" />
                This only changes this listing — not your profile.
              </p>
            </div>
          </section>

          {/* Harvest date */}
          <section className="space-y-3">
            <StepHeading>When will your crop be ready?</StepHeading>
            <div className="rounded-2xl border border-border bg-surface p-5 shadow-card">
              <div className="flex items-start gap-3">
                <CalendarDays className="mt-0.5 size-5 shrink-0 text-primary" />
                <div className="flex-1 space-y-4">
                  <Field label="Expected date" htmlFor="harvestDate">
                    <Input
                      id="harvestDate"
                      type="date"
                      value={harvestDate === "today" ? "" : harvestDate}
                      disabled={alreadyHarvested}
                      onChange={(event) => {
                        setHarvestDate(event.target.value);
                        setAlreadyHarvested(false);
                      }}
                    />
                  </Field>
                  <label className="flex cursor-pointer items-center gap-3">
                    <input
                      type="checkbox"
                      checked={alreadyHarvested}
                      onChange={(event) =>
                        event.target.checked ? setHarvestToday() : setHarvestDate("")
                      }
                      className="size-5 rounded border-border accent-[color:var(--primary)]"
                    />
                    <span className="text-sm font-medium text-foreground">
                      Already harvested
                    </span>
                  </label>
                </div>
              </div>
            </div>
          </section>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
            <Button variant="ghost" onClick={() => setStep(1)}>
              <ArrowLeft className="size-4" />
              Back
            </Button>
            <Button size="lg" onClick={goToReview}>
              Review crop
              <ArrowRight className="size-4" />
            </Button>
          </div>
        </div>
      ) : null}

      {step === 3 && cropDef ? (
        <div className="mt-8 space-y-6">
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">Review your crop</h1>
          <ReviewRow label="Crop">
            <span className="text-lg">{cropDef.emoji ?? "🌱"} {cropDef.name}</span>
          </ReviewRow>
          <ReviewRow label="Quantity">
            {quantityNumber} {UNIT_OPTIONS.find((option) => option.value === unit)?.label}
          </ReviewRow>
          <ReviewRow label="Quality">
            {QUALITY_GRADE_OPTIONS.find((option) => option.value === quality)?.label ??
              "Not set"}
          </ReviewRow>
          {variety ? <ReviewRow label="Variety">{variety}</ReviewRow> : null}
          <ReviewRow label="Location">
            {[village, district, state].filter(Boolean).join(", ") || "—"}
          </ReviewRow>
          <ReviewRow label="Ready">
            {alreadyHarvested || harvestDate === "today"
              ? "Already harvested"
              : formatDate(harvestDate)}
          </ReviewRow>

          <div className="rounded-2xl border border-border bg-primary-soft/50 p-5 text-sm leading-6 text-primary-soft-fg">
            Next, we&apos;ll help you understand today&apos;s market price for this crop.
          </div>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
            <Button variant="ghost" onClick={() => setStep(2)}>
              <ArrowLeft className="size-4" />
              Back
            </Button>
            <Button size="lg" onClick={() => void submit()} loading={submitting}>
              {isEdit ? "Update My Crop" : "Save My Crop"}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function StepProgress({ step }: { step: 1 | 2 | 3 | 4 }) {
  const labels = ["Crop", "Details", "Review"];
  return (
    <ol className="flex items-center gap-2" aria-label="Progress">
      {labels.map((label, index) => {
        const position = (index + 1) as 1 | 2 | 3;
        const done = step > position || step === 4;
        const current = step === position;
        return (
          <li key={label} className={cn("flex items-center gap-2", index > 0 && "flex-1")}>
            {index > 0 ? (
              <span
                aria-hidden="true"
                className={cn("h-px flex-1", done ? "bg-primary" : "bg-border")}
              />
            ) : null}
            <span
              className={cn(
                "inline-flex items-center gap-1.5 text-xs font-medium",
                current ? "text-foreground" : done ? "text-primary" : "text-muted-foreground",
              )}
            >
              <span
                className={cn(
                  "inline-flex size-6 items-center justify-center rounded-full text-[11px] font-semibold",
                  current
                    ? "bg-primary text-primary-foreground"
                    : done
                      ? "bg-primary-soft text-primary-soft-fg"
                      : "bg-muted text-muted-foreground",
                )}
              >
                {done ? <Check className="size-3" /> : position}
              </span>
              <span className="hidden sm:inline">{label}</span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function StepHeading({ children }: { children: React.ReactNode }) {
  return <h2 className="text-lg font-semibold tracking-tight sm:text-xl">{children}</h2>;
}

function ReviewRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-6 border-b border-border pb-4">
      <dt className="text-sm font-medium text-muted-foreground">{label}</dt>
      <dd className="text-right text-base font-medium text-foreground">{children}</dd>
    </div>
  );
}

function formatDate(dateOnly: string): string {
  if (!dateOnlyPattern.test(dateOnly)) {
    return dateOnly;
  }
  const date = new Date(`${dateOnly}T00:00:00Z`);
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

function CropStep({
  selectedCropId,
  query,
  setQuery,
  showAll,
  setShowAll,
  searchActive,
  filteredCrops,
  onChoose,
  onContinue,
}: {
  selectedCropId: string | null;
  query: string;
  setQuery: (value: string) => void;
  showAll: boolean;
  setShowAll: (value: boolean) => void;
  searchActive: boolean;
  filteredCrops: CropDefinition[];
  onChoose: (crop: CropDefinition) => void;
  onContinue: () => void;
}) {
  const selected = CROPS.find((crop) => crop.id === selectedCropId);

  const categories = showAll
    ? ([...new Set(CROPS.map((crop) => crop.category))] as CropDefinition["category"][])
    : [];

  return (
    <div className="mt-8 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">What did you grow?</h1>
        <p className="mt-2 text-muted-foreground">Select the crop you want to sell.</p>
      </div>

      <div className="relative">
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute left-3.5 top-1/2 size-5 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          type="search"
          role="searchbox"
          aria-label="Search crops"
          placeholder="Search for a crop…"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="h-12 pl-11 pr-11"
        />
        {searchActive ? (
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => setQuery("")}
            className="absolute right-2 top-1/2 inline-flex size-8 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X className="size-4" />
          </button>
        ) : null}
      </div>

      {searchActive ? (
        filteredCrops.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border-strong bg-surface-muted/60 p-10 text-center">
            <p className="font-medium">No crop found with “{query}”.</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Try a different spelling, or browse the full list.
            </p>
            <Button variant="outline" className="mt-4" onClick={() => setQuery("")}>
              View all crops
            </Button>
          </div>
        ) : (
          <CropGrid crops={filteredCrops} selectedCropId={selectedCropId} onChoose={onChoose} />
        )
      ) : showAll ? (
        <div className="space-y-8">
          {categories.map((category) => (
            <section key={category}>
              <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                {CROP_CATEGORY_LABELS[category]}
              </h2>
              <div className="mt-3">
                <CropGrid
                  crops={CROPS.filter((crop) => crop.category === category)}
                  selectedCropId={selectedCropId}
                  onChoose={onChoose}
                />
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
        <div className="space-y-6">
          <section>
            <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Popular crops
            </h2>
            <div className="mt-3">
              <CropGrid crops={POPULAR_CROPS} selectedCropId={selectedCropId} onChoose={onChoose} />
            </div>
          </section>
          <button
            type="button"
            onClick={() => setShowAll(true)}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
          >
            View all crops
            <ArrowRight className="size-4" />
          </button>
        </div>
      )}

      <div className="flex flex-col gap-3 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
        {selected ? (
          <p className="text-sm text-muted-foreground">
            Selected: <span className="font-semibold text-foreground">{selected.name}</span>
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">
            <Sprout className="mr-1 inline size-4 align-[-2px]" />
            Can&apos;t find your crop? Try the full list above.
          </p>
        )}
        <Button size="lg" disabled={!selectedCropId} onClick={onContinue}>
          Continue
          <ArrowRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}

function CropGrid({
  crops,
  selectedCropId,
  onChoose,
}: {
  crops: CropDefinition[];
  selectedCropId: string | null;
  onChoose: (crop: CropDefinition) => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
      {crops.map((crop) => {
        const selected = selectedCropId === crop.id;
        return (
          <button
            key={crop.id}
            type="button"
            aria-pressed={selected}
            onClick={() => onChoose(crop)}
            className={cn(
              "relative flex flex-col items-center gap-1.5 rounded-2xl border bg-surface p-3 pt-4 text-center transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              selected
                ? "border-primary bg-primary-soft shadow-card"
                : "border-border hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-card",
            )}
          >
            {selected ? (
              <span
                aria-hidden="true"
                className="absolute right-2 top-2 inline-flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground"
              >
                <Check className="size-3" />
              </span>
            ) : null}
            <span aria-hidden="true" className="text-3xl leading-none">
              {crop.emoji ?? "🌱"}
            </span>
            <span className="w-full text-center text-xs font-medium leading-tight text-foreground">
              {crop.name}
            </span>
          </button>
        );
      })}
    </div>
  );
}
