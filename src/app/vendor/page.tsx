import type { Metadata } from "next";
import {
  Check,
  ClipboardList,
  Package,
  Plus,
  Store,
  TrendingUp,
  Truck,
  Users,
} from "lucide-react";
import { Badge, PageHeader } from "@/components/ui";
import { greetingForHour } from "@/lib/utils/greeting";
import { getVendorProfile } from "@/features/profiles/profile-service";
import { requirePageUser } from "@/features/auth/lib/page-guards";
import { cn } from "@/lib/utils/cn";

export const metadata: Metadata = {
  title: "Vendor dashboard",
};

export const dynamic = "force-dynamic";

const QUICK_ACTIONS = [
  {
    icon: ClipboardList,
    title: "Requirements",
    body: "Tell farmers exactly what you need to buy.",
  },
  {
    icon: Users,
    title: "Farmers",
    body: "Discover farmers who match your needs.",
  },
  {
    icon: Package,
    title: "Orders",
    body: "Track every purchase from offer to delivery.",
  },
  {
    icon: Truck,
    title: "Procurement",
    body: "Keep sourcing reliable and on time.",
  },
];

export default async function VendorDashboardPage() {
  const user = await requirePageUser();
  const profile = await getVendorProfile(user.id);

  const firstName = user.fullName.split(/\s+/)[0] ?? user.fullName;
  const business = profile?.businessName;
  const locationText = [profile?.city, profile?.state].filter(Boolean).join(", ");
  const greeting = greetingForHour(new Date().getHours());

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <PageHeader
        eyebrow="Vendor dashboard"
        title={`${greeting}, ${firstName}`}
        description="Here's what to focus on for your buying today."
        actions={
          <Badge tone="warning" className="px-3 py-1.5">
            Buyer
          </Badge>
        }
      />

      {/* Featured sourcing card (honest planned state) */}
      <section className="relative overflow-hidden rounded-3xl border border-border bg-surface shadow-raised">
        <div className="bg-gradient-to-br from-accent-soft via-surface to-surface p-7 sm:p-9">
          <div className="max-w-2xl">
            <span className="inline-flex size-11 items-center justify-center rounded-xl bg-accent text-white shadow-sm">
              <Store className="size-6" />
            </span>
            <p className="mt-5 text-xs font-semibold uppercase tracking-[0.18em] text-accent-foreground/80">
              Sourcing, soon
            </p>
            <h2 className="mt-2 text-2xl font-semibold leading-tight tracking-tight sm:text-3xl">
              Tell farmers what you want to buy.
            </h2>
            <p className="mt-3 max-w-xl text-base leading-7 text-muted-foreground">
              Post a requirement and farmers who match your needs can find you.
              This becomes your hub for farmer matches and incoming offers.
            </p>
            <button
              type="button"
              disabled
              className="mt-6 inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-primary px-6 text-base font-medium text-primary-foreground shadow-sm disabled:opacity-70"
            >
              <Plus className="size-4" />
              Post a requirement
              <span className="rounded-full bg-primary-foreground/15 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-primary-foreground">
                Next update
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* Setup checklist */}
      <section className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="rounded-2xl border border-border bg-surface p-6 shadow-card">
          <h2 className="text-lg font-semibold tracking-tight">Ready to source</h2>
          <ul className="mt-4 space-y-3">
            <SetupRow
              done
              label="Business profile complete"
              detail={
                business
                  ? `${business}${locationText ? ` · ${locationText}` : ""}`
                  : "Buying with Kisan Vyapar"
              }
            />
            <SetupRow
              label="Post your first requirement"
              detail="Requirements arrive in the next update"
              pending
            />
            <SetupRow
              label="Find matching farmers"
              detail="Built on real matching in an upcoming sprint"
              pending
            />
          </ul>
        </div>

        <div className="flex items-center justify-center rounded-2xl border border-dashed border-border-strong bg-surface-muted/60 p-6 text-center">
          <p className="max-w-xs text-sm leading-6 text-muted-foreground">
            No active requirements, farmer matches or orders yet. They will appear
            here as the marketplace grows — we never show numbers we don&apos;t really have.
          </p>
        </div>
      </section>

      {/* Quick actions */}
      <section>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {QUICK_ACTIONS.map((action) => (
            <div
              key={action.title}
              className="group rounded-2xl border border-border bg-surface p-6 shadow-card transition-all duration-150 hover:-translate-y-0.5 hover:shadow-raised"
            >
              <span className="inline-flex size-11 items-center justify-center rounded-xl bg-primary-soft text-primary-soft-fg">
                <action.icon className="size-5" />
              </span>
              <div className="mt-4 flex items-center gap-2">
                <h3 className="text-base font-semibold tracking-tight text-foreground">
                  {action.title}
                </h3>
                <Badge tone="outline">Soon</Badge>
              </div>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{action.body}</p>
            </div>
          ))}
        </div>
      </section>

      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <TrendingUp className="size-4 text-accent-foreground" />
        Sourcing insight: a headline price is not what a farmer takes home — we
        build features around fair, honest trade for both sides.
      </p>
    </div>
  );
}

function SetupRow({
  label,
  detail,
  done = false,
  pending = false,
}: {
  label: string;
  detail: string;
  done?: boolean;
  pending?: boolean;
}) {
  return (
    <li
      className={cn(
        "flex items-start gap-3 rounded-xl border p-3.5",
        done ? "border-success-border bg-success-bg/60" : "border-border bg-background",
      )}
    >
      <span
        className={cn(
          "mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-full",
          done
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-muted-foreground",
        )}
      >
        {done ? (
          <Check className="size-3.5" />
        ) : (
          <span aria-hidden="true" className="size-2 rounded-full bg-border-strong" />
        )}
      </span>
      <div className="min-w-0">
        <p className={cn("text-sm font-medium", done ? "text-success-fg" : "text-foreground")}>
          {label}
          {pending ? (
            <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              Next
            </span>
          ) : null}
        </p>
        <p className="mt-0.5 text-sm text-muted-foreground">{detail}</p>
      </div>
    </li>
  );
}
