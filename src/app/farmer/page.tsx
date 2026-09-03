import type { Metadata } from "next";
import {
  Check,
  ClipboardList,
  Package,
  Plus,
  Sprout,
  TrendingUp,
  Users,
} from "lucide-react";
import { Badge, PageHeader } from "@/components/ui";
import { greetingForHour } from "@/lib/utils/greeting";
import { getFarmerProfile } from "@/features/profiles/profile-service";
import { requirePageUser } from "@/features/auth/lib/page-guards";
import { cn } from "@/lib/utils/cn";

export const metadata: Metadata = {
  title: "Farmer dashboard",
};

export const dynamic = "force-dynamic";

const QUICK_ACTIONS = [
  {
    icon: Package,
    title: "My Produce",
    body: "List what you grow and keep it updated.",
  },
  {
    icon: TrendingUp,
    title: "Today's Prices",
    body: "See real market context for your crops.",
  },
  {
    icon: Users,
    title: "Find Buyers",
    body: "Discover buyers looking for your produce.",
  },
  {
    icon: ClipboardList,
    title: "My Orders",
    body: "Track every sale from offer to payment.",
  },
];

export default async function FarmerDashboardPage() {
  const user = await requirePageUser();
  const profile = await getFarmerProfile(user.id);

  const firstName = user.fullName.split(/\s+/)[0] ?? user.fullName;
  const locationText = [profile?.village, profile?.district].filter(Boolean).join(", ");
  const greeting = greetingForHour(new Date().getHours());

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <PageHeader
        eyebrow="Farmer dashboard"
        title={`${greeting}, ${firstName}`}
        description="Here's what matters for your farm today."
        actions={
          <Badge tone="success" className="px-3 py-1.5">
            Farmer
          </Badge>
        }
      />

      {/* Featured opportunity (honest planned state) */}
      <section className="relative overflow-hidden rounded-3xl bg-primary p-7 text-primary-foreground shadow-raised sm:p-9">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-15 [background-image:radial-gradient(circle_at_85%_20%,white_0,transparent_40%),radial-gradient(circle_at_10%_100%,white_0,transparent_35%)]"
        />
        <div className="relative max-w-2xl">
          <span className="inline-flex size-11 items-center justify-center rounded-xl bg-primary-foreground/15 text-primary-foreground">
            <Sprout className="size-6" />
          </span>
          <p className="mt-5 text-xs font-semibold uppercase tracking-[0.18em] text-primary-foreground/80">
            Your opportunity, soon
          </p>
          <h2 className="mt-2 text-2xl font-semibold leading-tight tracking-tight sm:text-3xl">
            Your market opportunity will appear here once you add produce.
          </h2>
          <p className="mt-3 max-w-xl text-base leading-7 text-primary-foreground/85">
            Add your first crop and this becomes your home for buyer interest,
            market context and honest net-earning estimates.
          </p>
          <button
            type="button"
            disabled
            className="mt-6 inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-primary-foreground px-6 text-base font-medium text-primary shadow-sm disabled:opacity-70"
          >
            <Plus className="size-4" />
            Add your first crop
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-primary">
              Next update
            </span>
          </button>
        </div>
      </section>

      {/* Setup checklist */}
      <section className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="rounded-2xl border border-border bg-surface p-6 shadow-card">
          <h2 className="text-lg font-semibold tracking-tight">Set up to sell</h2>
          <ul className="mt-4 space-y-3">
            <SetupRow
              done
              label="Farmer profile complete"
              detail={locationText ? `Farming near ${locationText}` : "Farming with Kisan Vyapar"}
            />
            <SetupRow
              label="Add your first produce"
              detail="Produce listings arrive in the next update"
              pending
            />
            <SetupRow
              label="Discover market opportunities"
              detail="Built on real data in an upcoming sprint"
              pending
            />
          </ul>
        </div>

        <div className="flex items-center justify-center rounded-2xl border border-dashed border-border-strong bg-surface-muted/60 p-6 text-center">
          <p className="max-w-xs text-sm leading-6 text-muted-foreground">
            No buyer matches or orders yet. They will show up here once you start
            listing produce — we never show numbers we don&apos;t really have.
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
