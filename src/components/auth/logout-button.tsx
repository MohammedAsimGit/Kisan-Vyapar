"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { postJson } from "@/lib/client/fetch-json";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui";

export function LogoutButton({
  className,
  label = "Sign out",
}: {
  className?: string;
  label?: string;
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  async function handleLogout() {
    setSubmitting(true);
    try {
      await postJson("/api/auth/logout", {});
    } finally {
      router.replace("/");
      router.refresh();
    }
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className={cn("gap-2", className)}
      onClick={handleLogout}
      loading={submitting}
      aria-label={label}
    >
      <LogOut className="size-4" />
      <span className="hidden sm:inline">{label}</span>
    </Button>
  );
}
