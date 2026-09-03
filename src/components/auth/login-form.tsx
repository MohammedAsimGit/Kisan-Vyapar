"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { postJson, ApiRequestError } from "@/lib/client/fetch-json";
import type { SessionUser } from "@/features/auth/types";
import { Alert, Button, Field, Input } from "@/components/ui";

export function LoginForm() {
  const router = useRouter();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const data = await postJson<{ user: SessionUser }>("/api/auth/login", {
        identifier: identifier.trim(),
        password,
      });
      router.push(`/${data.user.role}`);
    } catch (err) {
      const message =
        err instanceof ApiRequestError
          ? err.message
          : "We couldn't sign you in. Please try again.";
      setError(message);
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
        <p className="text-muted-foreground">
          Sign in with your mobile number or email.
        </p>
      </div>

      {error ? (
        <Alert tone="error" title="We couldn't sign you in.">
          {error}
        </Alert>
      ) : null}

      <form className="space-y-4" onSubmit={handleSubmit}>
        <Field
          label="Mobile number or email"
          htmlFor="identifier"
          required
        >
          <Input
            id="identifier"
            name="identifier"
            autoComplete="username"
            placeholder="e.g. 9876543210"
            value={identifier}
            inputMode="text"
            onChange={(event) => setIdentifier(event.target.value)}
            required
          />
        </Field>

        <Field label="Password" htmlFor="password" required>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="Your password"
              value={password}
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

        <Button
          type="submit"
          size="lg"
          className="w-full"
          loading={submitting}
          disabled={identifier.trim().length === 0 || password.length === 0}
        >
          Sign in
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        New to Kisan Vyapar?{" "}
        <Link href="/auth/register" className="font-medium text-primary underline-offset-4 hover:underline">
          Create an account
        </Link>
      </p>
    </div>
  );
}
