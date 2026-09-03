"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Brand } from "@/components/shared/brand";
import { linkButtonClass } from "@/components/ui";

export function LandingHeader() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto w-full max-w-7xl px-4 pt-[env(safe-area-inset-top)] sm:px-6 lg:px-8">
        <div className="flex min-h-16 items-center justify-between gap-3 py-2.5 sm:py-0">
          <Brand className="min-w-0 shrink-0" />

          {/* Desktop actions */}
          <nav
            aria-label="Account"
            className="hidden shrink-0 items-center gap-1.5 sm:flex"
          >
            <Link href="/auth/login" className={linkButtonClass("ghost", "md")}>
              Sign in
            </Link>
            <Link href="/auth/register" className={linkButtonClass("primary", "md")}>
              Create account
            </Link>
          </nav>

          {/* Mobile hamburger */}
          <button
            type="button"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={() => setOpen((value) => !value)}
            className="inline-flex size-11 shrink-0 items-center justify-center rounded-lg text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:hidden"
          >
            <span
              aria-hidden="true"
              className="relative block h-4 w-6"
            >
              <span
                className={`absolute left-0 top-0.5 h-0.5 w-6 rounded-full bg-current transition-all duration-200 ease-out ${
                  open ? "top-1/2 -translate-y-1/2 rotate-45" : ""
                }`}
              />
              <span
                className={`absolute left-0 bottom-0.5 h-0.5 w-6 rounded-full bg-current transition-all duration-200 ease-out ${
                  open ? "bottom-1/2 translate-y-1/2 -rotate-45" : ""
                }`}
              />
            </span>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open ? (
        <div
          id="mobile-menu"
          className="animate-[nav-drop_0.2s_ease-out] border-t border-border bg-surface shadow-card sm:hidden"
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
          <nav
            aria-label="Account"
            className="mx-auto w-full max-w-7xl space-y-2 px-4 py-4"
          >
            <Link
              href="/auth/login"
              onClick={() => setOpen(false)}
              className="flex h-12 w-full items-center justify-center rounded-lg border border-border text-base font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
            >
              Sign in
            </Link>
            <Link
              href="/auth/register"
              onClick={() => setOpen(false)}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-primary text-base font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
            >
              Create account
            </Link>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
