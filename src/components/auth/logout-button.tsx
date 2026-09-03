"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { postJson } from "@/lib/client/fetch-json";
import { Button } from "@/components/ui";

export function LogoutButton({
  className,
}: {
  className?: string;
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
      className={className}
      onClick={handleLogout}
      loading={submitting}
    >
      Sign out
    </Button>
  );
}
