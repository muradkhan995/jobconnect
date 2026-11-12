import type { Metadata } from "next";
import Link from "next/link";
import { Alert } from "@/components/ui/alert";
import { StatusBadge } from "@/components/ui/status-badge";
import { orNotFound } from "@/lib/http/page";
import { requireUser } from "@/modules/auth/session";
import { AdminJobActions } from "@/modules/job/components/job-actions";
import { JobPreview } from "@/modules/job/components/job-preview";
import { JOB_STATUS_LABEL } from "@/modules/job/labels";
import { getJobForAdmin } from "@/modules/job/service";

export const metadata: Metadata = { title: "Review job · Admin · JobConnect" };

export default async function AdminJobReview({
  params,
}: PageProps<"/admin/jobs/[id]">) {
  const { id } = await params;
  const admin = await requireUser(["ADMIN"], `/admin/jobs/${id}`);
  const job = await orNotFound(id, () => getJobForAdmin(admin, id));
  const label = JOB_STATUS_LABEL[job.status];
  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
      <Link href="/admin/jobs" className="text-sm underline">
        ← Back to queue
      </Link>
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_22rem]">
        <section className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
          <p className="mb-4 text-xs font-medium uppercase tracking-wide text-zinc-500">
            As candidates will see it
          </p>
          <JobPreview job={job} />
        </section>
        <aside className="flex h-fit flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-semibold">Decision</h2>
            <StatusBadge tone={label.tone}>{label.admin}</StatusBadge>
          </div>
          {job.company.verificationStatus !== "VERIFIED" && (
            <Alert tone="error">
              {job.company.name} is not verified, so this job can&apos;t be
              approved.
            </Alert>
          )}
          {job.statusReason && (
            <p className="text-sm">
              <strong>Current reason:</strong> {job.statusReason}
            </p>
          )}
          <AdminJobActions id={job.id} status={job.status} />
          <p className="text-xs text-zinc-500">
            Look for fees to apply, requests for bank details, vague pay or
            unrealistic offers (R-07).
          </p>
        </aside>
      </div>
    </main>
  );
}
