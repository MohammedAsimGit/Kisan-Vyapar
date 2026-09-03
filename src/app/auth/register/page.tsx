import type { Metadata } from "next";
import { AuthLayout } from "@/components/auth/auth-layout";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = {
  title: "Create an account",
};

export default function RegisterPage() {
  return (
    <AuthLayout>
      <div className="rounded-3xl border border-border bg-surface p-6 shadow-raised sm:p-8">
        <RegisterForm />
      </div>
    </AuthLayout>
  );
}
