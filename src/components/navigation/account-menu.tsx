"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { LogOut, MoreVertical, User } from "lucide-react";
import { postJson } from "@/lib/client/fetch-json";
import { cn } from "@/lib/utils/cn";

export function AccountMenu({
  role,
  className,
}: {
  role: "farmer" | "vendor" | "admin";
  className?: string;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [menuOpen, setMenuOpen] = useState(false);
  const [logoutConfirm, setLogoutConfirm] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);

  const profileHref = `/${role}/profile`;

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return;
    function handleClick(e: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuOpen]);

  // Close menu on Escape
  useEffect(() => {
    if (!menuOpen) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuOpen(false);
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [menuOpen]);

  // Focus cancel button when logout dialog opens
  useEffect(() => {
    if (logoutConfirm) {
      cancelRef.current?.focus();
    }
  }, [logoutConfirm]);

  // Escape closes logout dialog
  useEffect(() => {
    if (!logoutConfirm) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setLogoutConfirm(false);
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [logoutConfirm]);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await postJson("/api/auth/logout", {});
      queryClient.clear();
    } finally {
      router.replace("/");
      router.refresh();
    }
  }

  return (
    <>
      <div className="relative" ref={menuRef}>
        <button
          ref={buttonRef}
          type="button"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Open account menu"
          aria-expanded={menuOpen}
          className={cn(
            "inline-flex size-10 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent/10 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            className,
          )}
        >
          <MoreVertical className="size-[18px]" strokeWidth={1.8} />
        </button>

        {menuOpen && (
          <div className="absolute right-0 top-full z-50 mt-2 w-48 overflow-hidden rounded-xl border border-border bg-surface shadow-raised">
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                router.push(profileHref);
              }}
              className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted/60"
            >
              <User className="size-4 text-muted-foreground" />
              Profile
            </button>
            <div className="border-t border-border" />
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                setLogoutConfirm(true);
              }}
              className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-danger transition-colors hover:bg-danger-bg/50"
            >
              <LogOut className="size-4" />
              Log out
            </button>
          </div>
        )}
      </div>

      {/* Logout confirmation dialog */}
      {logoutConfirm && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-6"
          role="dialog"
          aria-modal="true"
          aria-label="Confirm logout"
          onClick={(e) => {
            if (e.target === e.currentTarget) setLogoutConfirm(false);
          }}
        >
          <div className="w-full max-w-sm rounded-2xl border border-border bg-surface p-6 shadow-raised">
            <h3 className="text-base font-semibold text-foreground">
              Log out?
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Are you sure you want to log out of Kisan Vyapar?
            </p>
            <div className="mt-5 flex justify-end gap-3">
              <button
                ref={cancelRef}
                type="button"
                onClick={() => setLogoutConfirm(false)}
                className="rounded-xl border border-border bg-surface px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleLogout}
                disabled={loggingOut}
                className="rounded-xl bg-danger px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-danger-strong disabled:opacity-60"
              >
                {loggingOut ? "Logging out…" : "Log out"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
