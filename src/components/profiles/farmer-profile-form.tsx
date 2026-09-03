"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { patchJson, ApiRequestError } from "@/lib/client/fetch-json";
import { Alert, Button, Field, Input, Textarea } from "@/components/ui";
import type { FarmerProfileView } from "@/features/profiles/types";

export function FarmerProfileForm({
  initial,
}: {
  initial: FarmerProfileView | null;
}) {
  const router = useRouter();
  const [bio, setBio] = useState(initial?.bio ?? "");
  const [village, setVillage] = useState(initial?.village ?? "");
  const [district, setDistrict] = useState(initial?.district ?? "");
  const [state, setState] = useState(initial?.state ?? "");
  const [pincode, setPincode] = useState(initial?.pincode ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSave =
    district.trim().length > 0 && state.trim().length > 0 && !submitting;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!canSave) {
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await patchJson("/api/profile", {
        bio: bio.trim(),
        village: village.trim(),
        district: district.trim(),
        state: state.trim(),
        pincode: pincode.trim(),
      });
      router.replace("/farmer");
      router.refresh();
    } catch (err) {
      const message =
        err instanceof ApiRequestError
          ? err.message
          : "We couldn't save your profile. Please try again.";
      setError(message);
      setSubmitting(false);
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      {error ? (
        <Alert tone="error" title="We couldn't save your profile.">
          {error}
        </Alert>
      ) : null}

      <Field label="Village / town" htmlFor="village">
        <Input
          id="village"
          name="village"
          autoComplete="address-level4"
          placeholder="e.g. Devanahalli"
          value={village}
          onChange={(event) => setVillage(event.target.value)}
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="District" htmlFor="district" required>
          <Input
            id="district"
            name="district"
            autoComplete="address-level2"
            placeholder="e.g. Bengaluru Rural"
            value={district}
            onChange={(event) => setDistrict(event.target.value)}
            required
          />
        </Field>
        <Field label="State" htmlFor="state" required>
          <Input
            id="state"
            name="state"
            autoComplete="address-level1"
            placeholder="e.g. Karnataka"
            value={state}
            onChange={(event) => setState(event.target.value)}
            required
          />
        </Field>
      </div>

      <Field
        label="PIN code (optional)"
        htmlFor="pincode"
        hint="A PIN code helps us show closer buyers."
      >
        <Input
          id="pincode"
          name="pincode"
          inputMode="numeric"
          autoComplete="postal-code"
          placeholder="e.g. 562110"
          value={pincode}
          onChange={(event) => setPincode(event.target.value)}
        />
      </Field>

      <Field label="About your farm (optional)" htmlFor="bio">
        <Textarea
          id="bio"
          name="bio"
          placeholder="e.g. Growing tomatoes and brinjal on 3 acres."
          value={bio}
          maxLength={400}
          onChange={(event) => setBio(event.target.value)}
        />
      </Field>

      <Button type="submit" size="lg" className="w-full" loading={submitting} disabled={!canSave}>
        Save and continue
      </Button>
    </form>
  );
}
