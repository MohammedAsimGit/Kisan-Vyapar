import type { Metadata } from "next";
import { Badge, Button, Card, CardDescription, CardTitle } from "@/components/ui";
import { greetingForHour } from "@/lib/utils/greeting";
import { getVendorProfile } from "@/features/profiles/profile-service";
import { requirePageUser } from "@/features/auth/lib/page-guards";

export const metadata: Metadata = {
  title: "Vendor dashboard",
};

export const dynamic = "force-dynamic";

export default async function VendorDashboardPage() {
  const user = await requirePageUser();
  const profile = await getVendorProfile(user.id);

  const firstName = user.fullName.split(/\s+/)[0] ?? user.fullName;
  const business = profile?.businessName;
  const locationText = [profile?.city, profile?.state].filter(Boolean).join(", ");
  const greeting = greetingForHour(new Date().getHours());

  const placeholders = [
    {
      title: "Active Requirements",
      body: "You have not posted any buying requirements yet.",
    },
    {
      title: "Farmer Matches",
      body: "No farmer matches yet. They will appear once you post a requirement.",
    },
    {
      title: "Orders",
      body: "No orders yet. Your purchases will appear here.",
    },
    {
      title: "Procurement",
      body: "A summary of your procurement will appear here.",
    },
  ];

  return (
    <div className="space-y-8">
      <section className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            {greeting}, {firstName}
          </h1>
          <p className="mt-1 text-muted-foreground">
            {business
              ? `${business}${locationText ? ` · ${locationText}` : ""}`
              : "Welcome to your vendor dashboard."}
          </p>
        </div>
        <Badge tone="success" className="self-start sm:self-auto">
          Vendor
        </Badge>
      </section>

      <section className="rounded-2xl border border-border bg-primary/5 p-6 sm:p-8">
        <h2 className="text-xl font-semibold tracking-tight">Post your first requirement</h2>
        <p className="mt-2 max-w-2xl leading-7 text-muted-foreground">
          Tell farmers what you want to buy. A requirement will help you find
          farmers who match your needs. This arrives in a later update.
        </p>
        <div className="mt-5">
          <Button size="lg" disabled>
            Post a Requirement
            <Badge tone="outline" className="bg-background/60">
              Coming soon
            </Badge>
          </Button>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold tracking-tight">Quick overview</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {placeholders.map((item) => (
            <Card key={item.title}>
              <CardTitle>{item.title}</CardTitle>
              <CardDescription>{item.body}</CardDescription>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
