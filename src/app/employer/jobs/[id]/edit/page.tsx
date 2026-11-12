import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { orNotFound } from "@/lib/http/page";
import { requireUser } from "@/modules/auth/session";
import { listActiveIndustries } from "@/modules/company/service";
import { JobForm } from "@/modules/job/components/job-form";
import { canEdit, dateFromDeadline } from "@/modules/job/rules";
import { getMyJob } from "@/modules/job/service";

export const metadata: Metadata = { title: "Edit job · JobConnect" };

const NOTICE: Partial<Record<string, string>> = {
  PUBLISHED:
    "This job is live. Changing the title, description, requirements or salary hides it until our team approves it again. Other changes (like extending the closing date) apply straight away.",
  PAUSED:
    "Changing the title, description, requirements or salary will need approval again.",
  REJECTED:
    "Saving turns this job back into a draft. Submit it again when it's ready.",
  PENDING_APPROVAL:
    "This job is waiting for approval; our team will review your changes.",
};

export default async function EditJobPage({
  params,
}: PageProps<"/employer/jobs/[id]/edit">) {
  const { id } = await params;
  const user = await requireUser(["EMPLOYER"], `/employer/jobs/${id}/edit`);
  const [job, industries] = await Promise.all([
    orNotFound(id, () => getMyJob(user, id)),
    listActiveIndustries(),
  ]);
  if (!canEdit(job.status)) redirect(`/employer/jobs/${id}`);
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
      <Link href={`/employer/jobs/${id}`} className="text-sm underline">
        ← Back to job
      </Link>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight">Edit job</h1>
      <div className="mt-8 rounded-2xl border border-zinc-200 bg-white p-6 sm:p-8 dark:border-zinc-800 dark:bg-zinc-950">
        <JobForm
          jobId={job.id}
          industries={industries}
          notice={NOTICE[job.status]}
          initial={{
            title: job.title,
            description: job.description,
            requirements: job.requirements,
            workMode: job.workMode,
            location: job.location,
            jobType: job.jobType,
            experienceLevel: job.experienceLevel,
            industryId: job.industryId,
            salaryMin: job.salaryMin,
            salaryMax: job.salaryMax,
            salaryPeriod: job.salaryPeriod,
            deadline: dateFromDeadline(job.deadline),
          }}
        />
      </div>
    </main>
  );
}
