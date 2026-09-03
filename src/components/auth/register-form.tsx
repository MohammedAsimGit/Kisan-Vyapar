"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Store, Wheat } from "lucide-react";
import { USER_ROLES, type UserRole } from "@/constants/roles";
import { postJson, ApiRequestError } from "@/lib/client/fetch-json";
import { cn } from "@/lib/utils/cn";
import { Alert, Button, Field, Input } from "@/components/ui";

interface RegisterPayload {
  fullName: string;
  phone: string;
  email?: string;
  password: string;
  role: UserRole;
}

interface RoleOption {
  role: UserRole;
  icon: typeof Wheat;
  title: string;
  description: string;
}

const ROLE_OPTIONS: RoleOption[] = [
  {
    role: USER_ROLES.FARMER,
    icon: Wheat,
    title: "I'm a Farmer",
    description: "Sell your produce and discover better market opportunities.",
  },
  {
    role: USER_ROLES.VENDOR,
    icon: Store,
    title: "I'm a Buyer",
    description: "Find farmers and source the produce you need.",
  },
];

const PHONE_PATTERN = /^\+?[0-9]{10,15}$/;
const PASSWORD_PATTERN = /^(?=.*[A-Za-z])(?=.*\d).+$/;

export function RegisterForm() {
  const router = useRouter();

  const [step, setStep] = useState<1 | 2>(1);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nameValue = fullName.trim();
  const phoneValue = phone.trim();
  const nameOk = nameValue.length >= 2 && nameValue.length <= 120;
  const phoneOk = PHONE_PATTERN.test(phoneValue);
  const passwordOk =
    password.length >= 8 &&
    password.length <= 72 &&
    PASSWORD_PATTERN.test(password);

  const nameError =
    nameValue.length > 0 && !nameOk ? "Name must be at least 2 characters." : undefined;
  const phoneError =
    phoneValue.length > 0 && !phoneOk
      ? "Enter a valid mobile number with 10 to 15 digits (e.g. 9876543210)."
      : undefined;
  const passwordError =
    password.length > 0 && !passwordOk
      ? "Use at least 8 characters, with at least one letter and one number."
      : undefined;

  const canContinue = nameOk && phoneOk && passwordOk;

  async function submitRegistration(role: UserRole) {
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

  const actionLabel = !selectedRole
    ? "Choose a role to continue"
    : selectedRole === USER_ROLES.FARMER
      ? "Create my farmer account"
      : "Create my buyer account";

  return (
    <div className="space-y-6">
      {/* Progress */}
      <ol className="flex items-center gap-1" aria-label="Progress">
        {[
          { index: 1, label: "Account" },
          { index: 2, label: "Role" },
          { index: 3, label: "Profile" },
        ].map((item, position) => {
          const reached = step >= item.index || item.index === 3;
          const current = step === item.index;
          return (
            <li
              key={item.label}
              className={cn("flex items-center gap-1", position > 0 && "flex-1")}
            >
              {position > 0 ? (
                <span
                  aria-hidden="true"
                  className={cn(
                    "mx-1 h-px flex-1",
                    reached ? "bg-primary" : "bg-border",
                  )}
                />
              ) : null}
              <span
                aria-current={current ? "step" : undefined}
                className={cn(
                  "inline-flex items-center gap-1.5 whitespace-nowrap text-xs font-medium",
                  current
                    ? "text-foreground"
                    : reached
                      ? "text-primary"
                      : "text-muted-foreground",
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "inline-flex size-6 items-center justify-center rounded-full text-[11px] font-semibold",
                    current
                      ? "bg-primary text-primary-foreground"
                      : reached
                        ? "bg-primary-soft text-primary-soft-fg"
                        : "bg-muted text-muted-foreground",
                  )}
                >
                  {item.index}
                </span>
                <span className="hidden sm:inline">{item.label}</span>
              </span>
            </li>
          );
        })}
      </ol>

      <div className="space-y-1.5">
        <h1 className="text-2xl font-semibold tracking-tight">
          {step === 1 ? "Create your account" : "How will you use Kisan Vyapar?"}
        </h1>
        <p className="text-muted-foreground">
          {step === 1
            ? "Start with your basic details — you can finish everything else later."
            : "Pick the side of the market you are on."}
        </p>
      </div>

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
          <Field label="Your name" htmlFor="fullName" required error={nameError}>
            <Input
              id="fullName"
              name="fullName"
              autoComplete="name"
              placeholder="e.g. Ramesh Kumar"
              value={fullName}
              invalid={Boolean(nameError)}
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
            error={phoneError}
          >
            <Input
              id="phone"
              name="phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="e.g. 9876543210"
              value={phone}
              invalid={Boolean(phoneError)}
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
            error={passwordError}
          >
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder="Create a strong password"
                value={password}
                invalid={Boolean(passwordError)}
                minLength={8}
                maxLength={72}
                onChange={(event) => setPassword(event.target.value)}
                className="pr-24"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                className="absolute inset-y-0 right-2 my-auto flex h-8 items-center rounded-md px-3 text-sm font-medium text-muted-foreground hover:bg-muted"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </Field>

          <Button type="submit" size="lg" className="w-full" disabled={!canContinue}>
            Continue
            <ArrowRight className="size-4" />
          </Button>
        </form>
      ) : (
        <div className="space-y-4">
          <div className="grid gap-3" role="group" aria-label="Choose a role">
            {ROLE_OPTIONS.map((option) => {
              const selected = selectedRole === option.role;
              return (
                <button
                  key={option.role}
                  type="button"
                  aria-pressed={selected}
                  disabled={submitting}
                  onClick={() => {
                    setSelectedRole(option.role);
                    setError(null);
                  }}
                  className={cn(
                    "group flex w-full items-center gap-4 rounded-2xl border bg-background p-5 text-left transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-60",
                    selected
                      ? "border-primary bg-primary-soft/50 shadow-card"
                      : "border-border hover:border-primary/60 hover:bg-muted",
                  )}
                >
                  <span
                    className={cn(
                      "inline-flex size-12 shrink-0 items-center justify-center rounded-2xl transition-colors",
                      selected
                        ? "bg-primary text-primary-foreground"
                        : "bg-primary-soft text-primary-soft-fg group-hover:bg-primary/15",
                    )}
                  >
                    <option.icon className="size-6" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-lg font-semibold text-foreground">
                      {option.title}
                    </span>
                    <span className="mt-0.5 block text-sm leading-6 text-muted-foreground">
                      {option.description}
                    </span>
                  </span>
                  <span
                    aria-hidden="true"
                    className={cn(
                      "inline-flex size-6 shrink-0 items-center justify-center rounded-full border",
                      selected
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border-strong",
                    )}
                  >
                    {selected ? (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="size-3.5">
                        <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    ) : null}
                  </span>
                </button>
              );
            })}
          </div>

          <Button
            size="lg"
            className="w-full"
            disabled={!selectedRole}
            loading={submitting}
            onClick={() => {
              if (selectedRole) {
                void submitRegistration(selectedRole);
              }
            }}
          >
            {actionLabel}
          </Button>

          <button
            type="button"
            onClick={() => setStep(1)}
            disabled={submitting}
            className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-60"
          >
            <ArrowLeft className="size-4" />
            Back to details
          </button>
        </div>
      )}

      <div className="pt-2 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/auth/login" className="font-medium text-primary underline-offset-4 hover:underline">
          Sign in
        </Link>
      </div>
    </div>
  );
}
