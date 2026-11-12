import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/modules/auth/session";
import { CompanyForm } from "@/modules/company/components/company-form";
import { getMyCompany, listActiveIndustries } from "@/modules/company/service";

export const metadata: Metadata = { title: "Company profile · JobConnect" };

export default async function CompanyProfilePage() {
  const user = await requireUser(["EMPLOYER"], "/employer/company");
  const [company, industries] = await Promise.all([
    getMyCompany(user),
    listActiveIndustries(),
  ]);
  if (company?.verificationStatus === "SUSPENDED") redirect("/employer");

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
      <Link href="/employer" className="text-sm underline">
        ← Back
      </Link>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight">
        {company ? "Edit company profile" : "Create your company profile"}
      </h1>
      <p className="mt-2 text-zinc-600 dark:text-zinc-400">
        Candidates see this on every job you post. Our team checks it before
        your jobs go live.
      </p>
      <div className="mt-8 rounded-2xl border border-zinc-200 bg-white p-6 sm:p-8 dark:border-zinc-800 dark:bg-zinc-950">
        <CompanyForm
          mode={company ? "edit" : "create"}
          industries={industries}
          resubmits={company?.verificationStatus === "REJECTED"}
          initial={
            company
              ? {
                  name: company.name,
                  description: company.description,
                  industryId: company.industryId,
                  size: company.size,
                  location: company.location,
                  website: company.website,
                }
              : {}
          }
        />
      </div>
    </main>
  );
}
