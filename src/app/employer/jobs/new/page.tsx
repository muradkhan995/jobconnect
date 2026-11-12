import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/modules/auth/session";
import { getMyCompany, listActiveIndustries } from "@/modules/company/service";
import { JobForm } from "@/modules/job/components/job-form";

export const metadata: Metadata = { title: "Post a job · JobConnect" };

export default async function NewJobPage() {
  const user = await requireUser(["EMPLOYER"], "/employer/jobs/new");
  const [company, industries] = await Promise.all([
    getMyCompany(user),
    listActiveIndustries(),
  ]);
  if (!company) redirect("/employer/company");
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
      <Link href="/employer/jobs" className="text-sm underline">
        ← My jobs
      </Link>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight">Post a job</h1>
      <p className="mt-2 text-zinc-600 dark:text-zinc-400">
        It&apos;s saved as a draft first. Submit it for approval when it&apos;s
        ready.
      </p>
      <div className="mt-8 rounded-2xl border border-zinc-200 bg-white p-6 sm:p-8 dark:border-zinc-800 dark:bg-zinc-950">
        <JobForm
          initial={{ industryId: company.industryId, salaryPeriod: "YEAR" }}
          industries={industries}
        />
      </div>
    </main>
  );
}
