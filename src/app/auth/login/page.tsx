import type { Metadata } from "next";
import { AuthLayout } from "@/components/auth/auth-layout";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Sign in",
};

export default function LoginPage() {
  return (
    <AuthLayout>
      <div className="rounded-3xl border border-border bg-surface p-6 shadow-raised sm:p-8">
        <LoginForm />
      </div>
    </AuthLayout>
  );
}
