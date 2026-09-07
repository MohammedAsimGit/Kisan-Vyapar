export default function FarmerLoading() {
  return (
    <div className="mx-auto max-w-5xl space-y-8" aria-busy="true" aria-label="Loading">
      {/* Page header */}
      <div className="space-y-3">
        <div className="h-3 w-24 animate-pulse rounded-full bg-muted" />
        <div className="h-7 w-64 animate-pulse rounded-lg bg-muted" />
        <div className="h-4 w-full max-w-md animate-pulse rounded-full bg-muted/70" />
      </div>

      {/* Main card */}
      <section className="rounded-3xl border border-border bg-surface p-6 shadow-card sm:p-8">
        <div className="flex items-center gap-3">
          <div className="size-11 animate-pulse rounded-2xl bg-muted" />
          <div className="space-y-2">
            <div className="h-4 w-44 animate-pulse rounded-full bg-muted" />
            <div className="h-3 w-32 animate-pulse rounded-full bg-muted/70" />
          </div>
        </div>
        <div className="mt-6 space-y-3">
          {[0, 1, 2].map((row) => (
            <div
              key={row}
              className="flex animate-pulse items-center gap-4 rounded-2xl border border-border bg-background p-4"
            >
              <div className="size-11 rounded-xl bg-muted" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-40 rounded-full bg-muted" />
                <div className="h-3 w-56 rounded-full bg-muted/70" />
              </div>
              <div className="h-6 w-16 rounded-full bg-muted" />
            </div>
          ))}
        </div>
      </section>

      {/* Secondary grid */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((cell) => (
          <div
            key={cell}
            className="animate-pulse rounded-2xl border border-border bg-surface p-6 shadow-card"
          >
            <div className="size-11 rounded-xl bg-muted" />
            <div className="mt-4 h-4 w-28 rounded-full bg-muted" />
            <div className="mt-2 h-3 w-36 rounded-full bg-muted/70" />
          </div>
        ))}
      </section>
    </div>
  );
}
