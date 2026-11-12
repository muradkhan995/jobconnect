import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/modules/auth/session";
import { countCompaniesByStatus } from "@/modules/company/service";
import { countJobsByStatus } from "@/modules/job/service";

export const metadata: Metadata = { title: "Admin · JobConnect" };

function QueueCard({
  href,
  label,
  count,
  cta,
}: {
  href: string;
  label: string;
  count: number;
  cta: string;
}) {
  return (
    <Link
      href={href}
      className="flex flex-col gap-1 rounded-2xl border border-zinc-200 bg-white p-6 hover:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950"
    >
      <span className="text-sm text-zinc-600 dark:text-zinc-400">{label}</span>
      <span className="text-4xl font-semibold">{count}</span>
      <span className="text-sm font-medium underline">{cta}</span>
    </Link>
  );
}

export default async function AdminHome() {
  const admin = await requireUser(["ADMIN"], "/admin");
  const [companies, jobs] = await Promise.all([
    countCompaniesByStatus(admin),
    countJobsByStatus(admin),
  ]);
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-10">
      <h1 className="text-3xl font-semibold tracking-tight">
        Welcome, {admin.name.split(" ")[0]}
      </h1>
      <p className="text-zinc-600 dark:text-zinc-400">
        Verify companies and approve job adverts before they go live.
      </p>
      <div className="grid max-w-2xl gap-4 sm:grid-cols-2">
        <QueueCard
          href="/admin/companies"
          label="Companies awaiting verification"
          count={companies.PENDING}
          cta="Open the queue"
        />
        <QueueCard
          href="/admin/jobs"
          label="Jobs awaiting approval"
          count={jobs.PENDING_APPROVAL}
          cta="Open the job queue"
        />
      </div>
    </main>
  );
}
