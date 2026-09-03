export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-border">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-5">
          <span className="text-lg font-semibold tracking-tight">Kisan Vyapar</span>
          <span className="rounded-full border border-border bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
            Foundation
          </span>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-6">
        <section className="py-16 sm:py-24">
          <h1 className="max-w-2xl text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
            Connecting farmers and vendors where it matters most.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
            Kisan Vyapar is an agricultural marketplace for better price discovery and
            market linkage. We do not tell farmers where the price is highest — we help
            them find where they can{" "}
            <span className="font-medium text-foreground">potentially earn the most</span>,
            after the real costs of selling are accounted for.
          </p>
        </section>

        <section className="grid gap-8 py-8 sm:grid-cols-2">
          <div className="rounded-2xl border border-border bg-background p-6">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-primary">
              Problem
            </h2>
            <p className="mt-3 leading-7 text-muted-foreground">
              Farmers often sell at the nearest mandi with limited knowledge of buyers,
              demand, and the true cost of reaching a better market. A headline mandi price
              does not equal earnings once transport and other costs are deducted.
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-background p-6">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-primary">
              Solution
            </h2>
            <p className="mt-3 leading-7 text-muted-foreground">
              A two-sided marketplace where farmers list produce, vendors post buying
              requirements, and both sides discover, match, negotiate, and transact — with
              an eventual net-realization view of every selling opportunity.
            </p>
          </div>
        </section>

        <section className="py-12">
          <h2 className="text-2xl font-semibold tracking-tight">The journey we are building</h2>
          <ol className="mt-8 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["Discover", "Market prices and selling opportunities beyond the local mandi."],
              ["Match", "Produce listings aligned to vendor demand and location."],
              ["Negotiate", "Transparent offers and counter-offers between farmers and vendors."],
              ["Sell", "Orders with agreed quantity, quality, and price."],
              ["Transport", "Arranging and tracking movement from farm to buyer."],
              ["Track", "Visibility over order and delivery status for both sides."],
              ["Payment", "Clear settlement for produce delivered."],
              ["Trust", "Ratings and reviews that reward reliability."],
            ].map(([title, body]) => (
              <li
                key={title}
                className="rounded-2xl border border-border bg-background p-5"
              >
                <h3 className="font-semibold">{title}</h3>
                <p className="mt-2 leading-6 text-muted-foreground">{body}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="py-12">
          <h2 className="text-2xl font-semibold tracking-tight">Built for everyone in the chain</h2>
          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {[
              [
                "Farmer",
                "List produce, understand real selling value, find buyers, and close better deals.",
              ],
              [
                "Vendor",
                "Post buying requirements, discover farmers, and procure reliably at a fair price.",
              ],
              [
                "Admin",
                "Govern the marketplace, monitor integrity, and keep the platform trustworthy.",
              ],
            ].map(([role, body]) => (
              <div
                key={role}
                className="rounded-2xl border border-border bg-muted p-6"
              >
                <h3 className="text-lg font-semibold">{role}</h3>
                <p className="mt-2 leading-7 text-muted-foreground">{body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="py-12">
          <div className="rounded-2xl border border-border bg-muted p-6 sm:p-8">
            <h2 className="text-xl font-semibold tracking-tight">Foundation status</h2>
            <p className="mt-3 max-w-3xl leading-7 text-muted-foreground">
              This repository currently contains the Sprint 0 foundation: a typed Next.js
              application architecture, centralized configuration, MongoDB data layer,
              domain constants, external-service boundaries, and platform documentation.
              Farmer, vendor, and admin dashboards and their transactional flows are
              planned for upcoming sprints.
            </p>
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-2 px-6 py-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span>Kisan Vyapar</span>
          <span>An agricultural marketplace for better earnings.</span>
        </div>
      </footer>
    </div>
  );
}
