import type { Metadata } from "next";
import { RequirementForm } from "@/components/requirements/requirement-form";
import { requirePageUser } from "@/features/auth/lib/page-guards";

export const metadata: Metadata = {
  title: "Post a buying requirement",
};

export const dynamic = "force-dynamic";

export default async function NewRequirementPage() {
  await requirePageUser();
  return (
    <div className="py-2 sm:py-4">
      <RequirementForm mode="create" />
    </div>
  );
}
