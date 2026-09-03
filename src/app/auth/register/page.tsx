import type { Metadata } from "next";
import { AuthCardContainer, Card } from "@/components/ui";
import { Brand } from "@/components/shared/brand";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = {
  title: "Create an account",
};

export default function RegisterPage() {
  return (
    <AuthCardContainer>
      <div className="mb-6 flex justify-center">
        <Brand />
      </div>
      <Card>
        <RegisterForm />
      </Card>
    </AuthCardContainer>
  );
}
