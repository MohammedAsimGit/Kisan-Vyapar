"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { USER_ROLES, type UserRole } from "@/constants/roles";
import { postJson, ApiRequestError } from "@/lib/client/fetch-json";
import {
  Alert,
  Button,
  Field,
  Input,
} from "@/components/ui";

interface RegisterPayload {
  fullName: string;
  phone: string;
  email?: string;
  password: string;
  role: UserRole;
}

interface RoleOption {
  role: UserRole;
  title: string;
  description: string;
}

const ROLE_OPTIONS: RoleOption[] = [
  {
    role: USER_ROLES.FARMER,
    title: "Farmer",
    description: "I want to sell my produce.",
  },
  {
    role: USER_ROLES.VENDOR,
    title: "Vendor",
    description: "I want to buy agricultural produce.",
  },
];

export function RegisterForm() {
  const router = useRouter();

  const [step, setStep] = useState<1 | 2>(1);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canContinue =
    fullName.trim().length >= 2 &&
    phone.trim().length >= 10 &&
    password.length >= 8;

  async function handleRoleChoose(role: UserRole) {
    setError(null);
    setSubmitting(true);

    const payload: RegisterPayload = {
      fullName: fullName.trim(),
      phone: phone.trim(),
      password,
      role,
    };
    if (email.trim()) {
      payload.email = email.trim();
    }

    try {
      await postJson("/api/auth/register", payload);
      router.push("/onboarding");
    } catch (err) {
      const message =
        err instanceof ApiRequestError
          ? err.message
          : "We couldn't create your account. Please try again.";
      setError(message);
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Create your account</h1>
        <p className="text-muted-foreground">
          {step === 1
            ? "Tell us a little about yourself."
            : "Choose how you will use Kisan Vyapar."}
        </p>
      </div>

      <ol className="flex items-center gap-2 text-sm text-muted-foreground" aria-label="Progress">
        <li className={step === 1 ? "font-semibold text-foreground" : ""}>Your details</li>
        <li aria-hidden="true">→</li>
        <li className={step === 2 ? "font-semibold text-foreground" : ""}>Your role</li>
      </ol>

      {error ? (
        <Alert tone="error" title="We couldn't create your account.">
          {error}
        </Alert>
      ) : null}

      {step === 1 ? (
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            setError(null);
            setStep(2);
          }}
        >
          <Field label="Your name" htmlFor="fullName" required>
            <Input
              id="fullName"
              name="fullName"
              autoComplete="name"
              placeholder="e.g. Ramesh Kumar"
              value={fullName}
              minLength={2}
              maxLength={120}
              onChange={(event) => setFullName(event.target.value)}
              required
            />
          </Field>

          <Field
            label="Mobile number"
            htmlFor="phone"
            required
            hint="We will use this to recognise your account."
          >
            <Input
              id="phone"
              name="phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="e.g. 9876543210"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              required
            />
          </Field>

          <Field label="Email (optional)" htmlFor="email">
            <Input
              id="email"
              name="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </Field>

          <Field
            label="Password"
            htmlFor="password"
            required
            hint="At least 8 characters, with a letter and a number."
          >
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder="Create a strong password"
                value={password}
                minLength={8}
                maxLength={72}
                onChange={(event) => setPassword(event.target.value)}
                className="pr-24"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                className="absolute inset-y-0 right-2 my-auto flex h-8 items-center rounded-lg px-3 text-sm font-medium text-muted-foreground hover:bg-muted"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </Field>

          <Button type="submit" size="lg" className="w-full" disabled={!canContinue}>
            Continue
          </Button>
        </form>
      ) : (
        <div className="space-y-3" role="group" aria-label="Choose a role">
          {ROLE_OPTIONS.map((option) => (
            <button
              key={option.role}
              type="button"
              disabled={submitting}
              onClick={() => handleRoleChoose(option.role)}
              className="flex w-full flex-col items-start gap-1 rounded-2xl border border-border bg-background p-5 text-left transition-colors hover:border-primary hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-60"
            >
              <span className="text-lg font-semibold">{option.title}</span>
              <span className="text-muted-foreground">{option.description}</span>
            </button>
          ))}

          {submitting ? (
            <p role="status" className="text-center text-sm text-muted-foreground">
              Creating your account…
            </p>
          ) : (
            <div className="flex flex-col gap-3 pt-2 sm:flex-row">
              <Button variant="ghost" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setStep(1)}
              >
                Change my details
              </Button>
            </div>
          )}
        </div>
      )}

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/auth/login" className="font-medium text-primary underline-offset-4 hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
