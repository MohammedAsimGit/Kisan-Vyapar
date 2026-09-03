import { Leaf, Sprout, Store, TrendingUp } from "lucide-react";
import { Brand } from "@/components/shared/brand";

const HIGHLIGHTS = [
  {
    icon: Sprout,
    title: "Made for farmers",
    body: "Simple language and one clear action on every screen.",
  },
  {
    icon: TrendingUp,
    title: "Built around earnings",
    body: "We show where you can earn more — not just the highest price.",
  },
  {
    icon: Store,
    title: "Both sides, one platform",
    body: "Farmers and buyers meet, negotiate and trade in one place.",
  },
];

export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
      {/* Visual panel (desktop) */}
      <aside className="relative hidden overflow-hidden bg-[#0b1710] text-white lg:flex lg:flex-col lg:justify-between lg:p-12 xl:p-16">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(circle at 12% 8%, rgba(80,190,120,0.25) 0, transparent 34%), radial-gradient(circle at 88% 30%, rgba(217,166,72,0.16) 0, transparent 40%), radial-gradient(circle at 60% 100%, rgba(80,190,120,0.12) 0, transparent 45%)",
          }}
        />
        <div className="relative">
          <Brand tone="light" />
        </div>

        <div className="relative max-w-md">
          <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-white/85">
            <Leaf className="size-3.5 text-emerald-300" />
            SIH 2024 · Strengthening market linkages &amp; price discovery
          </p>
          <h2 className="mt-6 text-3xl font-semibold leading-tight tracking-tight xl:text-4xl">
            Know where your crop can earn more — not just where it is dearer.
          </h2>
          <ul className="mt-8 space-y-5">
            {HIGHLIGHTS.map((item) => (
              <li key={item.title} className="flex items-start gap-4">
                <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-emerald-200">
                  <item.icon className="size-5" />
                </span>
                <div>
                  <p className="font-medium text-white">{item.title}</p>
                  <p className="mt-0.5 text-sm leading-6 text-white/70">{item.body}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <blockquote className="relative border-l-2 border-emerald-300/60 pl-4 text-sm leading-6 text-white/75">
          “We don&apos;t tell farmers where the price is highest. We tell them where
          they can potentially earn the most.”
        </blockquote>
      </aside>

      {/* Form panel */}
      <main className="relative flex flex-col bg-background">
        <div className="flex items-center justify-center pt-6 lg:hidden">
          <Brand />
        </div>
        <div className="flex flex-1 items-center justify-center px-4 py-8 sm:px-8 lg:px-12">
          <div className="w-full max-w-md">{children}</div>
        </div>
      </main>
    </div>
  );
}
