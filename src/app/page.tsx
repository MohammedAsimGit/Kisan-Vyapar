import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  CalendarClock,
  ChartNoAxesColumn,
  Check,
  Handshake,
  Leaf,
  MapPin,
  Scale,
  ShieldCheck,
  Smartphone,
  Store,
  TrendingUp,
  Truck,
  Users,
  Wheat,
} from "lucide-react";
import { Badge, linkButtonClass } from "@/components/ui";
import { Brand } from "@/components/shared/brand";
import { LandingHeader } from "@/components/marketing/landing-header";

const HOW_IT_WORKS = [
  {
    icon: Wheat,
    step: "01",
    title: "List what you grow",
    body: "Describe your crop, quantity, quality and location.",
  },
  {
    icon: TrendingUp,
    step: "02",
    title: "See real options",
    body: "Understand where your produce could earn more — after costs, not just headline price.",
  },
  {
    icon: Handshake,
    step: "03",
    title: "Match and negotiate",
    body: "Connect with buyers and agree on fair, transparent terms.",
  },
  {
    icon: Truck,
    step: "04",
    title: "Sell and get paid",
    body: "Move your produce with confidence and clear settlement.",
  },
];

const PLANNED_FEATURES = [
  {
    icon: ChartNoAxesColumn,
    title: "Price intelligence",
    body: "Normalized market context designed around net farmer earnings.",
  },
  {
    icon: Users,
    title: "Smart matching",
    body: "Supply and demand matched by crop, quantity, quality and distance.",
  },
  {
    icon: Handshake,
    title: "Offers & negotiation",
    body: "Structured offers and counter-offers between farmers and buyers.",
  },
  {
    icon: ShieldCheck,
    title: "Trust & payments",
    body: "Orders, ratings and reliable settlement that build confidence.",
  },
];

const SIMPLE_POINTS = [
  { icon: Smartphone, text: "Built for any phone — no training needed" },
  { icon: Leaf, text: "Clear, simple language for every farmer" },
  { icon: CalendarClock, text: "One obvious action on every screen" },
];

export default function Home() {
  return (
    <div className="relative flex min-h-full flex-col overflow-x-clip">
      {/* Ambient background */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[720px] overflow-hidden">
        <div className="absolute -top-40 left-1/2 h-[560px] w-[900px] -translate-x-1/2 rounded-full bg-primary/12 blur-3xl" />
        <div className="absolute right-[-120px] top-24 h-72 w-72 rounded-full bg-accent/10 blur-3xl" />
        <div className="absolute left-[-120px] top-48 h-72 w-72 rounded-full bg-primary/8 blur-3xl" />
      </div>

      <LandingHeader />

      <main>
        {/* Hero */}
        <section className="mx-auto grid w-full max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-2 lg:gap-16 lg:px-8">
          <div>
            <Badge tone="primary">
              <Leaf className="size-3.5" />
              For farmers and produce buyers
            </Badge>
            <h1 className="mt-6 text-4xl font-semibold leading-[1.08] tracking-tight text-foreground sm:text-6xl">
              Your crop.
              <br />
              Your market.
              <br />
              <span className="text-primary">Your opportunity.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-muted-foreground">
              Kisan Vyapar connects farmers with buyers and helps you make smarter
              selling decisions. We do not just show where the price is highest — we
              are building tools to show where you can{" "}
              <span className="font-medium text-foreground">earn the most</span>.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/auth/register" className={linkButtonClass("primary", "lg")}>
                Start Selling
                <ArrowRight className="size-4" />
              </Link>
              <Link href="/auth/register" className={linkButtonClass("outline", "lg")}>
                I&apos;m a Buyer
              </Link>
            </div>
            <ul className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
              {["Free for farmers", "Register in under 2 minutes", "Works on any phone"].map(
                (item) => (
                  <li key={item} className="inline-flex items-center gap-1.5">
                    <Check className="size-4 text-primary" />
                    {item}
                  </li>
                ),
              )}
            </ul>
          </div>

          {/* Product preview (honest — shows only what exists or is planned) */}
          <div aria-label="Product preview" className="relative mx-auto w-full max-w-md lg:max-w-none">
            <div className="space-y-4">
              <div className="rounded-3xl border border-border bg-surface p-6 shadow-raised">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex size-10 items-center justify-center rounded-xl bg-primary-soft text-primary-soft-fg">
                      <Wheat className="size-5" />
                    </span>
                    <div>
                      <p className="font-semibold text-foreground">List your produce</p>
                      <p className="text-sm text-muted-foreground">Your crop, your terms</p>
                    </div>
                  </div>
                  <Badge tone="outline">Next update</Badge>
                </div>
                <div className="mt-5 space-y-2.5" aria-hidden="true">
                  <div className="h-2.5 w-2/3 rounded-full bg-muted" />
                  <div className="h-2.5 w-1/2 rounded-full bg-muted" />
                  <div className="h-2.5 w-3/4 rounded-full bg-muted" />
                </div>
                <p className="mt-4 inline-flex items-center gap-2 rounded-xl bg-muted px-3 py-2 text-xs font-medium text-muted-foreground">
                  <MapPin className="size-3.5 text-primary" />
                  Your farm location
                </p>
              </div>

              <div className="flex items-center justify-center gap-3 text-muted-foreground" aria-hidden="true">
                <span className="h-px flex-1 bg-border" />
                <ArrowRight className="size-5 text-primary" />
                <span className="h-px flex-1 bg-border" />
              </div>

              <div className="rounded-3xl border border-border bg-surface p-6 shadow-raised">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex size-10 items-center justify-center rounded-xl bg-accent-soft text-accent-foreground">
                      <TrendingUp className="size-5" />
                    </span>
                    <div>
                      <p className="font-semibold text-foreground">Market opportunity</p>
                      <p className="text-sm text-muted-foreground">Net-earning view</p>
                    </div>
                  </div>
                  <Badge tone="primary">Planned</Badge>
                </div>
                <div className="mt-5 flex items-end justify-between gap-6" aria-hidden="true">
                  <div className="flex h-20 items-end gap-1.5">
                    <span className="w-3 rounded-t-md bg-muted" style={{ height: "30%" }} />
                    <span className="w-3 rounded-t-md bg-primary/40" style={{ height: "55%" }} />
                    <span className="w-3 rounded-t-md bg-primary/60" style={{ height: "70%" }} />
                    <span className="w-3 rounded-t-md bg-primary/80" style={{ height: "85%" }} />
                    <span className="w-3 rounded-t-md bg-primary" style={{ height: "100%" }} />
                  </div>
                  <p className="max-w-[10rem] text-right text-xs leading-5 text-muted-foreground">
                    Illustrative preview — real market data arrives in a later sprint.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="border-y border-border bg-surface/50">
          <div className="mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                How it works
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                A simpler path from field to market
              </h2>
              <p className="mt-4 text-lg leading-8 text-muted-foreground">
                Accounts and profiles are live today. Listing produce, matching and
                orders arrive in the next updates — built so the journey stays simple.
              </p>
            </div>
            <ol className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {HOW_IT_WORKS.map((item) => (
                <li
                  key={item.step}
                  className="group relative rounded-2xl border border-border bg-surface p-6 shadow-card transition-transform duration-200 hover:-translate-y-0.5"
                >
                  <span className="inline-flex size-11 items-center justify-center rounded-xl bg-primary-soft text-primary-soft-fg transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    <item.icon className="size-5" />
                  </span>
                  <span className="mt-5 block text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    {item.step}
                  </span>
                  <h3 className="mt-2 text-lg font-semibold tracking-tight text-foreground">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Two sides of the marketplace */}
        <section className="mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="overflow-hidden rounded-3xl border border-border bg-surface shadow-card">
              <div className="bg-gradient-to-br from-primary-soft to-surface p-8 sm:p-10">
                <span className="inline-flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
                  <Wheat className="size-6" />
                </span>
                <h3 className="mt-6 text-2xl font-semibold tracking-tight text-foreground">
                  For farmers
                </h3>
                <p className="mt-3 max-w-md text-base leading-7 text-muted-foreground">
                  Show buyers what you grow and understand where your produce can earn
                  the most — without chasing headlines.
                </p>
              </div>
              <ul className="space-y-3 p-8 sm:p-10 sm:pt-6">
                {[
                  "Add produce and reach buyers beyond your local mandi",
                  "Compare options by what you actually take home",
                  "One clear place to manage sales and payments",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm leading-6 text-foreground">
                    <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                    {item}
                  </li>
                ))}
              </ul>
              <div className="px-8 pb-8 sm:px-10 sm:pb-10">
                <Link href="/auth/register" className={linkButtonClass("primary", "md", "w-full sm:w-auto")}>
                  Create a farmer account
                </Link>
              </div>
            </div>

            <div className="overflow-hidden rounded-3xl border border-border bg-surface shadow-card">
              <div className="bg-gradient-to-br from-accent-soft to-surface p-8 sm:p-10">
                <span className="inline-flex size-12 items-center justify-center rounded-2xl bg-accent text-white shadow-sm">
                  <Store className="size-6" />
                </span>
                <h3 className="mt-6 text-2xl font-semibold tracking-tight text-foreground">
                  For buyers
                </h3>
                <p className="mt-3 max-w-md text-base leading-7 text-muted-foreground">
                  Find farmers and source the produce you need, with the quality and
                  timing your business depends on.
                </p>
              </div>
              <ul className="space-y-3 p-8 sm:p-10 sm:pt-6">
                {[
                  "Post what you need and let supply come to you",
                  "Reach trusted farmers close to your business",
                  "Keep procurement clear, tracked and dependable",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm leading-6 text-foreground">
                    <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                    {item}
                  </li>
                ))}
              </ul>
              <div className="px-8 pb-8 sm:px-10 sm:pb-10">
                <Link href="/auth/register" className={linkButtonClass("secondary", "md", "w-full sm:w-auto")}>
                  Create a buyer account
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Built on trust + simplicity */}
        <section className="border-y border-border bg-surface/50">
          <div className="mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                Built around real earnings
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                Coming next — the tools that put farmers first
              </h2>
            </div>
            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {PLANNED_FEATURES.map((feature) => (
                <div
                  key={feature.title}
                  className="rounded-2xl border border-border bg-surface p-6 shadow-card"
                >
                  <span className="inline-flex size-10 items-center justify-center rounded-xl bg-muted text-foreground">
                    <feature.icon className="size-5" />
                  </span>
                  <div className="mt-4 flex items-center gap-2">
                    <h3 className="text-base font-semibold tracking-tight text-foreground">
                      {feature.title}
                    </h3>
                    <Badge tone="outline">Planned</Badge>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{feature.body}</p>
                </div>
              ))}
            </div>

            <div className="mt-10 grid gap-3 sm:grid-cols-3">
              {SIMPLE_POINTS.map((point) => (
                <div key={point.text} className="flex items-center gap-3 rounded-2xl bg-surface px-5 py-4 text-sm font-medium text-foreground shadow-card">
                  <point.icon className="size-5 shrink-0 text-primary" />
                  {point.text}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
          <div className="relative overflow-hidden rounded-[2rem] bg-primary px-6 py-16 text-center shadow-raised sm:px-12 sm:py-20">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 opacity-20 [background-image:radial-gradient(circle_at_20%_20%,white_0,transparent_35%),radial-gradient(circle_at_80%_60%,white_0,transparent_40%)]"
            />
            <div className="relative mx-auto max-w-2xl">
              <Badge tone="outline" className="border-white/30 bg-white/10 text-white">
                <Scale className="size-3.5" />
                Honest market linkage
              </Badge>
              <h2 className="mt-6 text-3xl font-semibold leading-tight tracking-tight text-primary-foreground sm:text-5xl">
                Ready to make your crop work harder?
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-lg leading-8 text-primary-foreground/85">
                Create your free account, choose your role, and reach your own
                dashboard in two minutes.
              </p>
              <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                <Link
                  href="/auth/register"
                  className="inline-flex h-13 items-center justify-center gap-2 rounded-lg bg-primary-foreground px-7 text-base font-medium text-primary shadow-sm transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-primary active:translate-y-px"
                >
                  Start Selling
                  <ArrowRight className="size-4" />
                </Link>
                <Link
                  href="/auth/login"
                  className="inline-flex h-13 items-center justify-center gap-2 rounded-lg border border-white/30 px-7 text-base font-medium text-primary-foreground transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-primary"
                >
                  I have an account
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-12 sm:px-6 lg:flex-row lg:items-start lg:justify-between lg:px-8">
          <div className="max-w-sm">
            <Brand />
            <p className="mt-4 text-sm leading-6 text-muted-foreground">
              An agricultural marketplace for better price discovery and stronger
              farmer earnings.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            <div>
              <p className="text-sm font-semibold text-foreground">Account</p>
              <ul className="mt-3 space-y-2 text-sm">
                <li>
                  <Link className="text-muted-foreground transition-colors hover:text-foreground" href="/auth/register">
                    Create account
                  </Link>
                </li>
                <li>
                  <Link className="text-muted-foreground transition-colors hover:text-foreground" href="/auth/login">
                    Sign in
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Platform</p>
              <ul className="mt-3 space-y-2 text-sm">
                <li className="inline-flex items-center gap-1.5 text-muted-foreground">
                  <BadgeCheck className="size-3.5" />
                  Farmers
                </li>
                <li className="inline-flex items-center gap-1.5 text-muted-foreground">
                  <BadgeCheck className="size-3.5" />
                  Buyers
                </li>
              </ul>
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Coming</p>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                <li>Produce listings</li>
                <li>Market prices</li>
                <li>Matching & orders</li>
              </ul>
            </div>
          </div>
        </div>
        <div className="border-t border-border">
          <div className="mx-auto flex w-full max-w-7xl flex-col gap-2 px-4 py-5 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
            <span>© {new Date().getFullYear()} Kisan Vyapar</span>
            <span>Premium on the outside. Extremely simple on the inside.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
