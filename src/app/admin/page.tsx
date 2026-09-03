import type { Metadata } from "next";
import { Card, CardDescription, CardTitle } from "@/components/ui";
import { requirePageUser } from "@/features/auth/lib/page-guards";

export const metadata: Metadata = {
  title: "Admin dashboard",
};

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const user = await requirePageUser();
  const firstName = user.fullName.split(/\s+/)[0] ?? user.fullName;

  const modules = [
    {
      title: "Farmers",
      body: "Farmer accounts and support tools will appear here.",
    },
    {
      title: "Vendors",
      body: "Vendor accounts and support tools will appear here.",
    },
    {
      title: "Marketplace health",
      body: "Orders, listings, and platform activity will be monitored here.",
    },
    {
      title: "Reports",
      body: "Platform reports will appear here.",
    },
  ];

  return (
    <div className="space-y-8">
      <section className="flex flex-col gap-3">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Admin dashboard
        </h1>
        <p className="text-muted-foreground">
          Welcome back, {firstName}. This protected space will host platform
          administration in later sprints.
        </p>
      </section>

      <section>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {modules.map((item) => (
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
