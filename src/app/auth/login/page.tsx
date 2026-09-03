import type { Metadata } from "next";
import { AuthCardContainer, Card } from "@/components/ui";
import { Brand } from "@/components/shared/brand";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Sign in",
};

export default function LoginPage() {
  return (
    <AuthCardContainer>
      <div className="mb-6 flex justify-center">
        <Brand />
      </div>
      <Card>
        <LoginForm />
      </Card>
    </AuthCardContainer>
  );
}
