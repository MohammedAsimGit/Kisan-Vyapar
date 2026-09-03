import type { Metadata } from "next";
import { Badge, Button, Card, CardDescription, CardTitle } from "@/components/ui";
import { greetingForHour } from "@/lib/utils/greeting";
import { getFarmerProfile } from "@/features/profiles/profile-service";
import { requirePageUser } from "@/features/auth/lib/page-guards";

export const metadata: Metadata = {
  title: "Farmer dashboard",
};

export const dynamic = "force-dynamic";

export default async function FarmerDashboardPage() {
  const user = await requirePageUser();
  const profile = await getFarmerProfile(user.id);

  const firstName = user.fullName.split(/\s+/)[0] ?? user.fullName;
  const locationText = [profile?.village, profile?.district, profile?.state]
    .filter(Boolean)
    .join(", ");
  const greeting = greetingForHour(new Date().getHours());

  const placeholders = [
    {
      title: "My Produce",
      body: "Add your produce to start discovering buyers.",
    },
    {
      title: "Market Opportunities",
      body: "Market context for your crop will appear here.",
    },
    {
      title: "Buyer Matches",
      body: "No buyer matches yet. They will appear once you add produce.",
    },
    {
      title: "Orders",
      body: "No orders yet. Your sales will appear here.",
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
            {locationText
              ? `Farming near ${locationText}.`
              : "Welcome to your farmer dashboard."}
          </p>
        </div>
        <Badge tone="success" className="self-start sm:self-auto">
          Farmer
        </Badge>
      </section>

      <section className="rounded-2xl border border-border bg-primary/5 p-6 sm:p-8">
        <h2 className="text-xl font-semibold tracking-tight">List your first produce</h2>
        <p className="mt-2 max-w-2xl leading-7 text-muted-foreground">
          Adding what you grow lets buyers find you and shows you real selling
          opportunities. Produce listing arrives in the next update.
        </p>
        <div className="mt-5">
          <Button size="lg" disabled>
            Add Your Produce
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
