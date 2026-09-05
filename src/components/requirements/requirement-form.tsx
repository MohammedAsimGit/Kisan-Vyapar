"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { postJson, patchJson, ApiRequestError } from "@/lib/client/fetch-json";
import {
  Alert,
  Button,
  Field,
  Input,
  Select,
  Textarea,
  linkButtonClass,
} from "@/components/ui";
import {
  CROP_CATEGORIES,
  CROP_CATEGORY_LABELS,
  CROPS,
  getCropById,
  getCropVarieties,
} from "@/constants/crops";
import { MEASUREMENT_UNIT_VALUES } from "@/constants/measurement-units";
import {
  QUALITY_GRADE_OPTIONS,
  QUALITY_GRADE_VALUES,
} from "@/constants/quality-grades";
import type { BuyerRequirementView } from "@/features/buyer-requirements/types";

const UNIT_LABELS: Record<(typeof MEASUREMENT_UNIT_VALUES)[number], string> = {
  kg: "Kg",
  quintal: "Quintal",
  tonne: "Tonne",
};

const CATEGORY_ORDER = Object.values(CROP_CATEGORIES);

export interface RequirementFormInitial {
  crop: string;
  variety?: string;
  quality: string;
  quantity: number;
  unit: string;
  targetPriceMin: number;
  targetPriceMax: number;
  requiredBy: string;
  notes?: string;
  location: {
    village?: string;
    district?: string;
    state?: string;
    pincode?: string;
  };
}

export function initialFromView(view: BuyerRequirementView): RequirementFormInitial {
  return {
    crop: view.crop,
    variety: view.variety,
    quality: view.quality,
    quantity: view.quantity,
    unit: view.unit,
    targetPriceMin: view.targetPriceMin,
    targetPriceMax: view.targetPriceMax,
    requiredBy: view.requiredBy,
    notes: view.notes,
    location: {
      village: view.location.village,
      district: view.location.district,
      state: view.location.state,
      pincode: view.location.pincode,
    },
  };
}

export function RequirementForm({
  mode,
  requirementId,
  initial,
}: {
  mode: "create" | "edit";
  requirementId?: string;
  initial?: RequirementFormInitial;
}) {
  const router = useRouter();
  const [crop, setCrop] = useState(initial?.crop ?? "");
  const [variety, setVariety] = useState(initial?.variety ?? "");
  const [quality, setQuality] = useState(initial?.quality ?? "");
  const [quantity, setQuantity] = useState(
    initial?.quantity !== undefined ? String(initial.quantity) : "",
  );
  const [unit, setUnit] = useState(initial?.unit ?? "");
  const [targetPriceMin, setTargetPriceMin] = useState(
    initial?.targetPriceMin !== undefined ? String(initial.targetPriceMin) : "",
  );
  const [targetPriceMax, setTargetPriceMax] = useState(
    initial?.targetPriceMax !== undefined ? String(initial.targetPriceMax) : "",
  );
  const [requiredBy, setRequiredBy] = useState(initial?.requiredBy ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [village, setVillage] = useState(initial?.location.village ?? "");
  const [district, setDistrict] = useState(initial?.location.district ?? "");
  const [state, setState] = useState(initial?.location.state ?? "");
  const [pincode, setPincode] = useState(initial?.location.pincode ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cropVarieties = crop ? getCropVarieties(crop) : undefined;
  const today = new Date().toISOString().slice(0, 10);

  const canSave =
    crop.trim().length > 0 &&
    quality.length > 0 &&
    quantity.trim().length > 0 &&
    Number(quantity) > 0 &&
    unit.length > 0 &&
    targetPriceMin.trim().length > 0 &&
    targetPriceMax.trim().length > 0 &&
    Number(targetPriceMax) >= Number(targetPriceMin) &&
    requiredBy.trim().length > 0 &&
    district.trim().length > 0 &&
    state.trim().length > 0 &&
    !submitting;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!canSave) {
      return;
    }
    setError(null);
    setSubmitting(true);

    const payload = {
      crop,
      variety: variety || undefined,
      quality,
      quantity: Number(quantity),
      unit,
      targetPriceMin: Number(targetPriceMin),
      targetPriceMax: Number(targetPriceMax),
      requiredBy,
      notes: notes.trim() || undefined,
      location: {
        village: village.trim() || undefined,
        district: district.trim(),
        state: state.trim(),
        pincode: pincode.trim() || undefined,
      },
    };

    try {
      let id = requirementId;
      if (mode === "edit" && requirementId) {
        await patchJson(`/api/vendor/requirements/${requirementId}`, payload);
      } else {
        const data = await postJson<{ requirement: { id: string } }>(
          "/api/vendor/requirements",
          payload,
        );
        id = data.requirement.id;
      }
      router.replace(id ? `/vendor/requirements/${id}` : "/vendor/requirements");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof ApiRequestError
          ? err.message
          : "We couldn't save this requirement. Please try again.",
      );
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href={mode === "edit" && requirementId ? `/vendor/requirements/${requirementId}` : "/vendor/requirements"}
        className="mb-5 inline-flex items-center gap-1.5 rounded text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <ArrowLeft className="size-4" />
        Back to Buying Requirements
      </Link>

      <div className="rounded-3xl border border-border bg-surface p-6 shadow-raised sm:p-8">
        <h1 className="text-2xl font-semibold tracking-tight">
          {mode === "create" ? "Post a buying requirement" : "Edit requirement"}
        </h1>
        <p className="mt-1.5 text-muted-foreground">
          {mode === "create"
            ? "Tell farmers exactly what you need to buy. It becomes active immediately."
            : "Update the details below. Changes apply to this requirement only."}
        </p>

        <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
          {error ? (
            <Alert tone="error" title="We couldn't save this requirement.">
              {error}
            </Alert>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Crop" htmlFor="crop" required className="sm:col-span-2">
              <Select
                id="crop"
                name="crop"
                value={crop}
                onChange={(event) => {
                  setCrop(event.target.value);
                  setVariety("");
                }}
                required
              >
                <option value="" disabled>
                  Choose a crop
                </option>
                {CATEGORY_ORDER.map((category) => {
                  const options = CROPS.filter((item) => item.category === category);
                  if (options.length === 0) {
                    return null;
                  }
                  return (
                    <optgroup key={category} label={CROP_CATEGORY_LABELS[category]}>
                      {options.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name}
                          {item.popular ? " · Popular" : ""}
                        </option>
                      ))}
                    </optgroup>
                  );
                })}
              </Select>
            </Field>

            {cropVarieties && cropVarieties.length > 0 ? (
              <Field label="Variety" htmlFor="variety" className="sm:col-span-2">
                <Select id="variety" name="variety" value={variety} onChange={(event) => setVariety(event.target.value)}>
                  <option value="">Not specified</option>
                  {cropVarieties.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </Select>
              </Field>
            ) : (
              <Field
                label="Variety (optional)"
                htmlFor="variety"
                hint={
                  crop && getCropById(crop)?.varieties
                    ? `Choose from ${cropVarieties?.join(", ")}`
                    : undefined
                }
                className="sm:col-span-2"
              >
                <Input
                  id="variety"
                  name="variety"
                  placeholder="e.g. Hybrid"
                  value={variety}
                  onChange={(event) => setVariety(event.target.value)}
                />
              </Field>
            )}

            <Field label="Quality / grade" htmlFor="quality" required>
              <Select
                id="quality"
                name="quality"
                value={quality}
                onChange={(event) => setQuality(event.target.value)}
                required
              >
                <option value="" disabled>
                  Choose a grade
                </option>
                {QUALITY_GRADE_VALUES.map((value) => {
                  const option = QUALITY_GRADE_OPTIONS.find((item) => item.value === value);
                  return (
                    <option key={value} value={value}>
                      {option?.label ?? value}
                    </option>
                  );
                })}
              </Select>
            </Field>

            <Field label="Unit" htmlFor="unit" required>
              <Select
                id="unit"
                name="unit"
                value={unit}
                onChange={(event) => setUnit(event.target.value)}
                required
              >
                <option value="" disabled>
                  Choose a unit
                </option>
                {MEASUREMENT_UNIT_VALUES.map((value) => (
                  <option key={value} value={value}>
                    {UNIT_LABELS[value]}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Quantity" htmlFor="quantity" required>
              <Input
                id="quantity"
                name="quantity"
                type="number"
                inputMode="decimal"
                min={1}
                step="any"
                placeholder="e.g. 50"
                value={quantity}
                onChange={(event) => setQuantity(event.target.value)}
                required
              />
            </Field>

            <Field label="Required by date" htmlFor="requiredBy" required>
              <Input
                id="requiredBy"
                name="requiredBy"
                type="date"
                min={today}
                value={requiredBy}
                onChange={(event) => setRequiredBy(event.target.value)}
                required
              />
            </Field>

            <Field
              label="Target price — minimum (₹/unit)"
              htmlFor="targetPriceMin"
              hint="The lowest price you expect to pay per unit."
              required
            >
              <Input
                id="targetPriceMin"
                name="targetPriceMin"
                type="number"
                inputMode="decimal"
                min={0}
                step="any"
                placeholder="e.g. 2600"
                value={targetPriceMin}
                onChange={(event) => setTargetPriceMin(event.target.value)}
                required
              />
            </Field>

            <Field
              label="Target price — maximum (₹/unit)"
              htmlFor="targetPriceMax"
              hint="The most you are willing to pay per unit."
              required
            >
              <Input
                id="targetPriceMax"
                name="targetPriceMax"
                type="number"
                inputMode="decimal"
                min={0}
                step="any"
                placeholder="e.g. 2800"
                value={targetPriceMax}
                onChange={(event) => setTargetPriceMax(event.target.value)}
                required
              />
            </Field>
            {targetPriceMin.trim() !== "" &&
            targetPriceMax.trim() !== "" &&
            Number(targetPriceMax) < Number(targetPriceMin) ? (
              <p role="alert" className="-mt-2 text-sm text-red-600 sm:col-span-2">
                The maximum price must be at least the minimum price.
              </p>
            ) : null}

            <div className="grid gap-4 rounded-2xl border border-border bg-muted/30 p-4 sm:col-span-2">
              <p className="text-sm font-semibold text-foreground">Preferred location</p>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Village / area (optional)" htmlFor="location.village">
                  <Input
                    id="location.village"
                    name="location.village"
                    placeholder="e.g. Pimpalgaon"
                    value={village}
                    onChange={(event) => setVillage(event.target.value)}
                  />
                </Field>
                <Field label="District" htmlFor="location.district" required>
                  <Input
                    id="location.district"
                    name="location.district"
                    placeholder="e.g. Nashik"
                    value={district}
                    onChange={(event) => setDistrict(event.target.value)}
                    required
                  />
                </Field>
                <Field label="State" htmlFor="location.state" required>
                  <Input
                    id="location.state"
                    name="location.state"
                    placeholder="e.g. Maharashtra"
                    value={state}
                    onChange={(event) => setState(event.target.value)}
                    required
                  />
                </Field>
                <Field label="PIN code (optional)" htmlFor="location.pincode">
                  <Input
                    id="location.pincode"
                    name="location.pincode"
                    inputMode="numeric"
                    autoComplete="postal-code"
                    placeholder="e.g. 422003"
                    value={pincode}
                    onChange={(event) => setPincode(event.target.value)}
                  />
                </Field>
              </div>
            </div>

            <Field
              label="Additional notes (optional)"
              htmlFor="notes"
              className="sm:col-span-2"
              hint="Anything farmers should know — packing, timing, delivery point, etc."
            >
              <Textarea
                id="notes"
                name="notes"
                placeholder="e.g. Need produce packed in clean crates, delivered to our Nashik godown."
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                maxLength={400}
              />
            </Field>
          </div>

          <div className="flex flex-col gap-3 pt-2 sm:flex-row">
            <Button type="submit" size="lg" className="sm:flex-1" loading={submitting} disabled={!canSave}>
              {mode === "create" ? "Post requirement" : "Save changes"}
            </Button>
            <Link
              href={mode === "edit" && requirementId ? `/vendor/requirements/${requirementId}` : "/vendor/requirements"}
              className={linkButtonClass("outline", "lg", "sm:flex-none")}
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
