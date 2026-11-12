import type { Metadata } from "next";
import Link from "next/link";
import { Alert } from "@/components/ui/alert";
import { StatusBadge } from "@/components/ui/status-badge";
import { orNotFound } from "@/lib/http/page";
import { requireUser } from "@/modules/auth/session";
import { EmployerJobActions } from "@/modules/job/components/job-actions";
import { JobPreview } from "@/modules/job/components/job-preview";
import { JOB_STATUS_LABEL } from "@/modules/job/labels";
import { canEdit } from "@/modules/job/rules";
import { getMyJob } from "@/modules/job/service";

export const metadata: Metadata = { title: "Job · JobConnect" };

const DONE: Record<string, string> = {
  created: "Draft saved. Submit it for approval when it's ready.",
  saved: "Changes saved.",
  submit: "Submitted. We'll email you when it's been reviewed.",
  pause: "Paused. The job is hidden and nobody can apply.",
  resume: "Resumed. The job is live again.",
  close: "Closed. The job is no longer visible.",
};

const NEXT: Record<string, string> = {
  DRAFT: "Only you can see this draft.",
  PENDING_APPROVAL:
    "Our team is reviewing this job. It goes live once approved.",
  PUBLISHED: "This job is live in search.",
  PAUSED: "Hidden from search; nobody can apply until you resume it.",
  REJECTED: "This job needs changes. Edit it, then submit it again.",
  CLOSED: "Closed jobs can't be reopened.",
  REMOVED: "This job was removed for breaking platform policy.",
};

export default async function EmployerJobPage({
  params,
  searchParams,
}: PageProps<"/employer/jobs/[id]">) {
  const { id } = await params;
  const user = await requireUser(["EMPLOYER"], `/employer/jobs/${id}`);
  const job = await orNotFound(id, () => getMyJob(user, id));
  const done = (await searchParams)["done"];
  const label = JOB_STATUS_LABEL[job.status];
  const material = job.status === "PUBLISHED" || job.status === "PAUSED";

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
      <Link href="/employer/jobs" className="text-sm underline">
        ← My jobs
      </Link>
      {typeof done === "string" && DONE[done] && (
        <div className="mt-4">
          <Alert tone="success">{DONE[done]}</Alert>
        </div>
      )}
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_22rem]">
        <section className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
          <JobPreview job={job} />
        </section>
        <aside className="flex h-fit flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-semibold">Status</h2>
            <StatusBadge tone={label.tone}>{label.employer}</StatusBadge>
          </div>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            {NEXT[job.status]}
          </p>
          {job.statusReason && (
            <Alert tone="error">
              <strong>Reason from our team:</strong> {job.statusReason}
            </Alert>
          )}
          {job.status === "DRAFT" &&
          job.company.verificationStatus !== "VERIFIED" ? (
            <p className="text-sm">
              Submitting is available once your company is verified.
            </p>
          ) : (
            <EmployerJobActions id={job.id} status={job.status} />
          )}
          {canEdit(job.status) && (
            <Link
              href={`/employer/jobs/${job.id}/edit`}
              className="text-sm font-medium underline"
            >
              Edit job
            </Link>
          )}
          {material && (
            <p className="text-xs text-zinc-500">
              Changing the title, description, requirements or salary sends the
              job back for approval.
            </p>
          )}
        </aside>
      </div>
    </main>
  );
}
