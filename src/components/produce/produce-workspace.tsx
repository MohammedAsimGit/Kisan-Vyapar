"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronRight,
  MapPin,
  Rocket,
  Save,
  Sprout,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { CROPS, getCropVarieties } from "@/constants/crops";
import {
  MEASUREMENT_UNITS,
  type MeasurementUnit,
} from "@/constants/measurement-units";
import {
  QUALITY_GRADE_OPTIONS,
  type QualityGrade,
} from "@/constants/quality-grades";
import type { ProduceListingStatus } from "@/constants/produce-listing-statuses";
import { getJson, patchJson, postJson, ApiRequestError } from "@/lib/client/fetch-json";
import { Alert, Button, Field, Input, linkButtonClass } from "@/components/ui";
import { CropBadge, CropPicker } from "./crop-picker";
import {
  AskingPriceCard,
  formatInr,
  RecommendationCard,
  unitLabel,
  type PricePanelState,
  type PriceRecommendation,
} from "./price-panel";

export interface ProduceWorkspaceLocation {
  village?: string;
  district?: string;
  state?: string;
  pincode?: string;
}

export interface ProduceWorkspaceInitial {
  crop?: string;
  variety?: string;
  quantity?: number;
  unit?: MeasurementUnit;
  quality?: QualityGrade;
  location?: ProduceWorkspaceLocation;
  expectedHarvestDate?: string;
  askingPrice?: number;
}

interface ProduceWorkspaceProps {
  mode: "create" | "edit";
  listingId?: string;
  initial?: ProduceWorkspaceInitial;
  initialStatus?: ProduceListingStatus;
  profileLocation?: ProduceWorkspaceLocation;
}

const QUICK_QUANTITIES = [5, 10, 20, 50, 100];

const UNIT_OPTIONS: { value: MeasurementUnit; label: string; hint: string }[] = [
  { value: MEASUREMENT_UNITS.KILOGRAM, label: "Kg", hint: "Kilogram" },
  { value: MEASUREMENT_UNITS.QUINTAL, label: "Quintal", hint: "100 kg" },
  { value: MEASUREMENT_UNITS.TONNE, label: "Tonne", hint: "1000 kg" },
];

const dateOnlyPattern = /^\d{4}-\d{2}-\d{2}$/;

interface RecommendationResponse {
  availability: string;
  guidance: {
    hasSuggestion: boolean;
    suggestedPrice?: number;
    suggestedRange?: { min?: number; max?: number };
    latestModalPrice?: number;
    observedRange?: { min?: number; max?: number };
    trend: string;
    confidence: string;
    observationCount: number;
    factors: string[];
    unit: string;
    lastUpdated?: string;
  };
}

const UNCONFIGURED_COPY =
  "Market price data is not configured on this deployment yet. Prices are never invented — you can still set your asking price manually.";

export function ProduceWorkspace({
  mode,
  listingId,
  initial,
  initialStatus,
  profileLocation,
}: ProduceWorkspaceProps) {
  const isEdit = mode === "edit";
  const isActive = initialStatus === "active";
  const showPublish = !isEdit || !isActive;
  const router = useRouter();

  // Crop + details
  const [cropId, setCropId] = useState<string | null>(initial?.crop ?? null);
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
  const [askPrice, setAskPrice] = useState(
    initial?.askingPrice !== undefined ? String(initial.askingPrice) : "",
  );

  // Guidance orchestration
  const [panel, setPanel] = useState<PricePanelState>({ status: "waiting" });
  const listedIdRef = useRef<string | null>(listingId ?? null);
  const tokenRef = useRef(0);
  const fetchedRef = useRef(false);
  const forceRefetchRef = useRef(false);
  const createPromiseRef = useRef<Promise<string> | null>(null);
  const lastScopeRef = useRef(
    scopeKeyOf(
      initial?.crop ?? "",
      initial?.location?.district ?? "",
      initial?.location?.state ?? "",
    ),
  );
  const prevTriggerRef = useRef<string | null>(null);

  // Saving state
  const [saving, setSaving] = useState<null | "save" | "publish">(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const cropDef = cropId ? CROPS.find((crop) => crop.id === cropId) : undefined;
  const locationScopeReady =
    district.trim().length > 0 && state.trim().length > 0;
  const quantityNumber = Number(quantity);
  const quantityValid =
    quantity.trim().length > 0 &&
    Number.isFinite(quantityNumber) &&
    quantityNumber > 0;
  const dateValid =
    alreadyHarvested ||
    harvestDate === "today" ||
    dateOnlyPattern.test(harvestDate);

  const detailsComplete =
    Boolean(cropId) &&
    quantityValid &&
    Boolean(quality) &&
    locationScopeReady &&
    dateValid;

  const triggerKey = detailsComplete
    ? scopeKeyOf(cropId ?? "", district.trim(), state.trim())
    : null;

  const priceNumber = Number(askPrice);
  const priceSet =
    askPrice.trim().length > 0 &&
    Number.isFinite(priceNumber) &&
    priceNumber > 0;
  const guidanceUnit = panel.status === "ready" ? panel.data.unit : "quintal";

  const unitOfQuantity =
    UNIT_OPTIONS.find((option) => option.value === unit)?.label ?? unit;

  const detailsMissing: string[] = [];
  if (!cropId) detailsMissing.push("choose a crop");
  if (!quality) detailsMissing.push("choose a quality");
  if (!quantityValid) detailsMissing.push("add the quantity you grew");
  if (!locationScopeReady) detailsMissing.push("add district and state");
  if (!dateValid) detailsMissing.push("choose when the crop will be ready");

  function payload() {
    return {
      crop: cropId ?? "",
      variety: variety.trim() || undefined,
      quantity: quantityNumber,
      unit,
      quality: quality ?? "ungraded",
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

  /** Creates the draft listing exactly once (guarded against double submits). */
  function ensureListing(): Promise<string> {
    if (listedIdRef.current) {
      return Promise.resolve(listedIdRef.current);
    }
    if (!createPromiseRef.current) {
      createPromiseRef.current = postJson<{ listing: { id: string } }>(
        "/api/farmer/produce",
        payload(),
      ).then((data) => data.listing.id);
    }
    return createPromiseRef.current;
  }

  function applyRecommendation(response: RecommendationResponse) {
    if (response.availability === "unconfigured") {
      setPanel({ status: "unavailable", message: UNCONFIGURED_COPY });
      return;
    }
    if (response.guidance.observationCount === 0) {
      setPanel({
        status: "unavailable",
        message: `No recent market price data for ${cropDef?.name?.toLowerCase() ?? "this crop"} in your area. Prices are never invented — you can still set your asking price manually.`,
      });
      return;
    }
    const data: PriceRecommendation = {
      hasSuggestion: response.guidance.hasSuggestion,
      suggestedPrice: response.guidance.suggestedPrice,
      suggestedRange: response.guidance.suggestedRange,
      latestModalPrice: response.guidance.latestModalPrice,
      observedRange: response.guidance.observedRange,
      trend: response.guidance.trend as PriceRecommendation["trend"],
      confidence: response.guidance.confidence,
      observationCount: response.guidance.observationCount,
      factors: response.guidance.factors,
      unit: response.guidance.unit,
      lastUpdated: response.guidance.lastUpdated,
    };
    setPanel({ status: "ready", availability: response.availability, data });
  }

  /**
   * Fetches the recommendation for the scope that was current when the caller
   * ran. Every panel update happens after an await, so calling it from an
   * effect is safe. Never runs for harmless field edits (quantity, quality…).
   */
  async function loadRecommendation(forced: boolean) {
    const currentKey = triggerKey;
    if (!currentKey) {
      return;
    }
    const token = ++tokenRef.current;
    const previousScope = lastScopeRef.current;

    try {
      let id = listedIdRef.current;
      if (!id) {
        id = await ensureListing();
        listedIdRef.current = id;
      } else if (previousScope !== currentKey) {
        // Persist current form values so the recommendation reflects the
        // crop/location the farmer is looking at.
        await patchJson(`/api/farmer/produce/${id}`, payload());
      }
      lastScopeRef.current = currentKey;
      if (token !== tokenRef.current) {
        return;
      }
      if (fetchedRef.current && !forced && previousScope === currentKey) {
        return;
      }
      const response = await getJson<RecommendationResponse>(
        `/api/farmer/produce/${id}/recommendation`,
      );
      if (token !== tokenRef.current) {
        return;
      }
      fetchedRef.current = true;
      applyRecommendation(response);
    } catch (err) {
      if (token !== tokenRef.current) {
        return;
      }
      setPanel({
        status: "error",
        message:
          err instanceof ApiRequestError
            ? err.message
            : "We couldn't load the market recommendation right now.",
      });
    }
  }

  // Auto-load whenever the crop/location scope becomes complete or changes.
  useEffect(() => {
    if (!triggerKey) {
      return;
    }
    let cancelled = false;
    const previousTrigger = prevTriggerRef.current;
    prevTriggerRef.current = triggerKey;
    void (async () => {
      // Keep all panel updates off the synchronous effect path.
      await Promise.resolve();
      if (cancelled) {
        return;
      }
      if (previousTrigger !== triggerKey || !fetchedRef.current) {
        setPanel({ status: "loading" });
      }
      await loadRecommendation(false);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [triggerKey]);

  function handleCropChange(nextCropId: string | null) {
    if (!nextCropId) {
      return;
    }
    setCropId(nextCropId);
    setVariety("");
    setActionError(null);
  }

  function handleHarvestToday() {
    setAlreadyHarvested(true);
    setHarvestDate("today");
  }

  function handleUseSuggested() {
    if (panel.status === "ready" && panel.data.suggestedPrice !== undefined) {
      setAskPrice(String(panel.data.suggestedPrice));
    }
  }

  function handleRetryGuidance() {
    forceRefetchRef.current = true;
    setPanel({ status: "loading" });
    void loadRecommendation(true);
  }

  function handleSubmitDraft() {
    void submit("save");
  }

  function handleSubmitPublish() {
    void submit("publish");
  }

  async function submit(action: "save" | "publish") {
    if (!detailsComplete) {
      setActionError("Please complete all the crop details before continuing.");
      return;
    }
    setSaving(action);
    setActionError(null);
    try {
      const id = await ensureListing();
      listedIdRef.current = id;

      await patchJson(`/api/farmer/produce/${id}`, payload());
      if (priceSet) {
        await patchJson(`/api/farmer/produce/${id}/asking-price`, {
          pricePerUnit: priceNumber,
        });
      }
      if (action === "publish") {
        await patchJson(`/api/farmer/produce/${id}`, { status: "active" });
      }
      router.push(`/farmer/produce/${id}`);
      router.refresh();
    } catch (err) {
      setActionError(
        err instanceof ApiRequestError
          ? err.message
          : action === "publish"
            ? "We couldn't publish this crop. Please try again."
            : "We couldn't save this crop. Please try again.",
      );
      setSaving(null);
    }
  }

  const qualityLabelOf = (value: QualityGrade | null): string | null =>
    value
      ? QUALITY_GRADE_OPTIONS.find((option) => option.value === value)?.label ??
        value
      : null;

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div>
        <Link
          href="/farmer/produce"
          className="inline-flex items-center gap-1.5 rounded text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ArrowLeft className="size-4" />
          My Produce
        </Link>
        <div className="mt-3">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            List your crop
          </h1>
          <p className="mt-1 text-muted-foreground">
            Add your crop details and get a recommended market price — then
            publish it straight from here.
          </p>
        </div>
      </div>

      {/* Completion indicator — visual only */}
      <ol
        className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-medium text-muted-foreground"
        aria-label="Progress"
      >
        <StepChip done={detailsComplete}>Crop details</StepChip>
        <ChevronRight className="size-3.5 text-border-strong" aria-hidden="true" />
        <StepChip done={priceSet}>Price</StepChip>
        <ChevronRight className="size-3.5 text-border-strong" aria-hidden="true" />
        <StepChip done={detailsComplete}>Ready to publish</StepChip>
      </ol>

      {actionError ? (
        <Alert tone="error" title="We couldn't continue.">
          {actionError}
        </Alert>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,360px)] lg:items-start">
        {/* LEFT — crop details */}
        <section className="rounded-3xl border border-border bg-surface p-5 shadow-card sm:p-7">
          <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight">
            <span className="inline-flex size-8 items-center justify-center rounded-lg bg-primary-soft text-primary-soft-fg">
              <Sprout className="size-4" />
            </span>
            Crop details
          </h2>

          <div className="mt-6 space-y-7">
            <div className="space-y-2">
              <p className="text-sm font-semibold text-foreground">Which crop?</p>
              <CropPicker value={cropId} onChange={handleCropChange} />
            </div>

            <div className="space-y-2">
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <Field
                    label="How much did you grow?"
                    htmlFor="cropQuantity"
                    required
                  >
                    <Input
                      id="cropQuantity"
                      type="number"
                      inputMode="decimal"
                      min={1}
                      value={quantity}
                      onChange={(event) => setQuantity(event.target.value)}
                      placeholder="e.g. 20"
                      className="h-13 text-xl font-semibold"
                    />
                  </Field>
                </div>
                <p className="pb-1 text-base font-medium text-foreground">
                  {unitOfQuantity}
                </p>
              </div>
              <div
                className="flex flex-wrap gap-2 pt-1"
                role="group"
                aria-label="Quick quantity"
              >
                {QUICK_QUANTITIES.map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setQuantity(String(value))}
                    className="inline-flex h-9 items-center rounded-full border border-border bg-background px-3.5 text-sm font-medium text-foreground transition-colors hover:border-primary hover:bg-primary-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {value}
                    {value === 100 ? "+" : ""}
                  </button>
                ))}
              </div>
            </div>

            <div role="radiogroup" aria-label="Unit">
              <p className="mb-2 text-sm font-semibold text-foreground">Unit</p>
              <div className="grid grid-cols-3 gap-2.5">
                {UNIT_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    role="radio"
                    aria-checked={unit === option.value}
                    onClick={() => setUnit(option.value)}
                    className={cn(
                      "rounded-xl border p-3 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface",
                      unit === option.value
                        ? "border-primary bg-primary-soft"
                        : "border-border bg-background hover:border-primary/50",
                    )}
                  >
                    <span className="block text-sm font-semibold">
                      {option.label}
                    </span>
                    <span className="mt-0.5 block text-[11px] text-muted-foreground">
                      {option.hint}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div role="radiogroup" aria-label="Quality">
              <p className="mb-2 text-sm font-semibold text-foreground">
                Quality of your produce
              </p>
              <div className="grid gap-2.5 sm:grid-cols-2">
                {QUALITY_GRADE_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    role="radio"
                    aria-checked={quality === option.value}
                    onClick={() => setQuality(option.value)}
                    className={cn(
                      "flex items-center gap-2.5 rounded-xl border p-3 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface",
                      quality === option.value
                        ? "border-primary bg-primary-soft"
                        : "border-border bg-background hover:border-primary/50",
                    )}
                  >
                    <span
                      aria-hidden="true"
                      className={cn(
                        "inline-flex size-5 shrink-0 items-center justify-center rounded-full border",
                        quality === option.value
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border-strong",
                      )}
                    >
                      {quality === option.value ? <Check className="size-3" /> : null}
                    </span>
                    <span>
                      <span className="block text-sm font-semibold">
                        {option.label}
                      </span>
                      <span className="block text-[11px] text-muted-foreground">
                        {option.description}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {(getCropVarieties(cropId ?? "")?.length ?? 0) > 0 ? (
              <Field label="Variety (optional)" htmlFor="cropVariety">
                <select
                  id="cropVariety"
                  value={variety}
                  onChange={(event) => setVariety(event.target.value)}
                  className="flex h-11 w-full appearance-none rounded-lg border border-border bg-background px-4 text-base text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  <option value="">Not sure / Other</option>
                  {(getCropVarieties(cropId ?? "") ?? []).map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
              </Field>
            ) : null}

            <div>
              <p className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                <MapPin className="size-4 text-primary" />
                Where is the crop?
              </p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <Field label="Village / town" htmlFor="locVillage">
                  <Input
                    id="locVillage"
                    value={village}
                    onChange={(event) => setVillage(event.target.value)}
                    placeholder="e.g. Devanahalli"
                  />
                </Field>
                <Field label="District" htmlFor="locDistrict" required>
                  <Input
                    id="locDistrict"
                    value={district}
                    onChange={(event) => setDistrict(event.target.value)}
                    placeholder="e.g. Bengaluru Rural"
                  />
                </Field>
                <Field label="State" htmlFor="locState" required>
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
              <p className="mt-2 text-xs text-muted-foreground">
                This only changes this listing — not your profile.
              </p>
            </div>

            <div>
              <p className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                <CalendarDays className="size-4 text-primary" />
                When will your crop be ready?
              </p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
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
                <label className="flex cursor-pointer items-center gap-2.5 self-end pb-2.5">
                  <input
                    type="checkbox"
                    checked={alreadyHarvested}
                    onChange={(event) =>
                      event.target.checked
                        ? handleHarvestToday()
                        : setHarvestDate("")
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

          {!detailsComplete ? (
            <p className="mt-6 rounded-xl border border-dashed border-border-strong bg-surface-muted/60 px-3.5 py-2.5 text-sm text-muted-foreground">
              Still needed: {detailsMissing.join(" · ")}.
            </p>
          ) : null}
        </section>

        {/* RIGHT — recommendation + asking price */}
        <div className="space-y-5 lg:sticky lg:top-24">
          <RecommendationCard
            state={panel}
            cropName={cropDef?.name}
            onRetry={handleRetryGuidance}
            onUseSuggested={handleUseSuggested}
          />
          <AskingPriceCard
            value={askPrice}
            unit={guidanceUnit}
            suggestedRange={
              panel.status === "ready" ? panel.data.suggestedRange : undefined
            }
            onChange={setAskPrice}
          />

          <div className="rounded-2xl border border-border bg-surface p-5 shadow-card sm:p-6">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Crop summary
            </p>
            <dl className="mt-3 space-y-2 text-sm">
              <SummaryRow label="Crop">
                <CropBadge cropId={cropId} />
              </SummaryRow>
              <SummaryRow label="Quantity">
                {quantityValid ? `${quantityNumber} ${unitOfQuantity}` : "—"}
              </SummaryRow>
              <SummaryRow label="Quality">
                {qualityLabelOf(quality) ?? "—"}
              </SummaryRow>
              <SummaryRow label="Ready">
                {alreadyHarvested || harvestDate === "today"
                  ? "Already harvested"
                  : harvestDate
                    ? formatDate(harvestDate)
                    : "—"}
              </SummaryRow>
              <SummaryRow label="Asking price">
                {priceSet
                  ? `${formatInr(priceNumber)} / ${unitLabel(guidanceUnit)}`
                  : "Not set yet"}
              </SummaryRow>
              {priceSet && unit === guidanceUnit ? (
                <SummaryRow label="Estimated value">
                  {formatInr(quantityNumber * priceNumber)}
                </SummaryRow>
              ) : null}
            </dl>
          </div>
        </div>
      </div>

      {/* BOTTOM — actions */}
      <section className="rounded-3xl border border-border bg-surface p-5 shadow-card sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-md">
            <p className="text-sm font-medium text-foreground">
              {isEdit && isActive
                ? "Save changes to this published crop."
                : priceSet
                  ? "Ready to publish — buyers will see this crop with its asking price."
                  : "Publishing matches this crop with real buyer requirements."}
            </p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              {isEdit && isActive
                ? "The crop stays visible to buyers while you update it."
                : "You can also save it as a draft and finish later."}
            </p>
          </div>
          <div className="flex flex-col-reverse gap-3 sm:flex-row">
            {showPublish ? (
              <Button
                type="button"
                variant="outline"
                size="lg"
                disabled={!detailsComplete || saving !== null}
                loading={saving === "save"}
                onClick={handleSubmitDraft}
              >
                <Save className="size-4" />
                Save as Draft
              </Button>
            ) : null}
            {showPublish ? (
              <Button
                type="button"
                size="lg"
                disabled={!detailsComplete || saving !== null}
                loading={saving === "publish"}
                onClick={handleSubmitPublish}
              >
                <Rocket className="size-4" />
                Publish Crop
              </Button>
            ) : (
              <Button
                type="button"
                size="lg"
                disabled={saving !== null}
                loading={saving === "save"}
                onClick={handleSubmitDraft}
              >
                <CheckCircle2 className="size-4" />
                Save changes
              </Button>
            )}
            {isEdit ? (
              <Link
                href={`/farmer/produce/${listingId ?? ""}`}
                className={linkButtonClass("ghost", "lg")}
              >
                Cancel
              </Link>
            ) : null}
          </div>
        </div>
      </section>
    </div>
  );
}

function StepChip({ done, children }: { done: boolean; children: React.ReactNode }) {
  return (
    <li
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1",
        done ? "bg-success-bg text-success-fg" : "bg-muted text-muted-foreground",
      )}
    >
      {done ? (
        <CheckCircle2 className="size-3.5" aria-hidden="true" />
      ) : (
        <span aria-hidden="true" className="size-1.5 rounded-full bg-border-strong" />
      )}
      {children}
    </li>
  );
}

function SummaryRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium text-foreground">{children}</dd>
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

function scopeKeyOf(crop: string, district: string, state: string): string {
  return `${crop.trim().toLowerCase()}::${district.trim().toLowerCase()}::${state.trim().toLowerCase()}`;
}
