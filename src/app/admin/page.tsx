import type { Metadata } from "next";
import {
  Database,
  FileBarChart2,
  ShieldCheck,
  Store,
  Wheat,
} from "lucide-react";
import { Badge, Card, CardDescription, CardTitle, PageHeader } from "@/components/ui";
import { requirePageUser } from "@/features/auth/lib/page-guards";
import { isDatabaseConfigured } from "@/config/env";
import { pingDatabase } from "@/lib/db";

export const metadata: Metadata = {
  title: "Admin dashboard",
};

export const dynamic = "force-dynamic";

const MODULES = [
  {
    icon: Wheat,
    title: "Farmers",
    body: "Farmer accounts, listings and support tools will appear here.",
  },
  {
    icon: Store,
    title: "Vendors",
    body: "Vendor accounts, requirements and support tools will appear here.",
  },
  {
    icon: ShieldCheck,
    title: "Marketplace integrity",
    body: "Moderation and trust tooling will appear here.",
  },
  {
    icon: FileBarChart2,
    title: "Reports",
    body: "Platform reports built on real data will appear here.",
  },
];

export default async function AdminDashboardPage() {
  const user = await requirePageUser();
  const firstName = user.fullName.split(/\s+/)[0] ?? user.fullName;
  const db = await pingDatabase();
  const dbConfigured = isDatabaseConfigured();

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <PageHeader
        eyebrow="Administration"
        title="Admin dashboard"
        description={`Welcome back, ${firstName}. This protected space hosts platform administration.`}
        actions={
          <Badge tone="neutral" className="px-3 py-1.5">
            Admin
          </Badge>
        }
      />

      {/* Live system status */}
      <section className="rounded-2xl border border-border bg-surface p-6 shadow-card">
        <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight">
          <Database className="size-5 text-primary" />
          System status
        </h2>
        <dl className="mt-5 grid gap-4 sm:grid-cols-3">
          <StatusItem
            label="Database"
            state={db.ok ? "connected" : dbConfigured ? "unreachable" : "not configured"}
            detail={db.ok ? "Session and profile store is reachable." : "No live connection to report yet."}
          />
          <StatusItem
            label="Authentication"
            state="active"
            detail="Registration, sessions and role-based access are live."
          />
          <StatusItem
            label="Marketplace features"
            state="planned"
            detail="Listings, matching and orders arrive in later sprints."
          />
        </dl>
      </section>

      {/* Module placeholders */}
      <section>
        <div className="grid gap-4 sm:grid-cols-2">
          {MODULES.map((module) => (
            <Card key={module.title}>
              <span className="inline-flex size-11 items-center justify-center rounded-xl bg-primary-soft text-primary-soft-fg">
                <module.icon className="size-5" />
              </span>
              <div className="mt-4 flex items-center gap-2">
                <CardTitle>{module.title}</CardTitle>
                <Badge tone="outline">Planned</Badge>
              </div>
              <CardDescription>{module.body}</CardDescription>
            </Card>
          ))}
        </div>
      </section>

      <p className="text-sm leading-6 text-muted-foreground">
        Admin surfaces show only real system state. Platform statistics will be
        added together with the features that produce them.
      </p>
    </div>
  );
}

function StatusItem({
  label,
  state,
  detail,
}: {
  label: string;
  state: "connected" | "active" | "planned" | "unreachable" | "not configured";
  detail: string;
}) {
  const ok = state === "connected" || state === "active";
  const planned = state === "planned";

  return (
    <div className="rounded-xl border border-border bg-background p-4">
      <dt className="text-sm font-medium text-foreground">{label}</dt>
      <dd className="mt-1 flex items-center gap-2 text-sm">
        <span
          aria-hidden="true"
          className={
            "inline-block size-2.5 rounded-full " +
            (ok
              ? "bg-success-fg"
              : planned
                ? "bg-muted-foreground"
                : "bg-warning-fg")
          }
        />
        <Badge tone={ok ? "success" : planned ? "outline" : "warning"} className="px-2 py-0.5 capitalize">
          {state}
        </Badge>
      </dd>
      <dd className="mt-2 text-sm leading-6 text-muted-foreground">{detail}</dd>
    </div>
  );
}
