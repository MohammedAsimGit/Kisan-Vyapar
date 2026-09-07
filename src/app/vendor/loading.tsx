export default function VendorLoading() {
  return (
    <div className="mx-auto max-w-5xl space-y-8" aria-busy="true" aria-label="Loading">
      {/* Page header */}
      <div className="space-y-3">
        <div className="h-3 w-24 animate-pulse rounded-full bg-muted" />
        <div className="h-7 w-64 animate-pulse rounded-lg bg-muted" />
        <div className="h-4 w-full max-w-md animate-pulse rounded-full bg-muted/70" />
      </div>

      {/* Hero panel with stats */}
      <section className="animate-pulse rounded-3xl border border-border bg-surface p-7 shadow-raised sm:p-9">
        <div className="size-11 rounded-xl bg-muted" />
        <div className="mt-5 h-4 w-40 rounded-full bg-muted" />
        <div className="mt-3 h-8 w-96 max-w-full rounded-lg bg-muted" />
        <div className="mt-8 grid max-w-2xl grid-cols-2 gap-3 sm:grid-cols-4">
          {[0, 1, 2, 3].map((stat) => (
            <div key={stat} className="rounded-2xl border border-border bg-background/60 p-4">
              <div className="h-3 w-14 rounded-full bg-muted" />
              <div className="mt-2 h-7 w-10 rounded-full bg-muted" />
            </div>
          ))}
        </div>
      </section>

      {/* Card grid */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((card) => (
          <div
            key={card}
            className="animate-pulse rounded-2xl border border-border bg-surface p-5 shadow-card"
          >
            <div className="flex items-center gap-3">
              <div className="size-11 rounded-xl bg-muted" />
              <div className="space-y-2">
                <div className="h-4 w-32 rounded-full bg-muted" />
                <div className="h-3 w-24 rounded-full bg-muted/70" />
              </div>
            </div>
            <div className="mt-5 h-3 w-full rounded-full bg-muted/70" />
            <div className="mt-2 h-3 w-2/3 rounded-full bg-muted/70" />
          </div>
        ))}
      </section>
    </div>
  );
}
