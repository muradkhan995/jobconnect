import {
  EXPERIENCE_LABEL,
  JOB_TYPE_LABEL,
  WORK_MODE_LABEL,
} from "@/modules/job/schemas";
import { formatDeadline, formatSalary } from "@/modules/job/labels";
import type { JobView } from "@/modules/job/service";

/** A job exactly as candidates will see it (docs/11 §4.2). Used by admin review and job details. */
export function JobPreview({ job }: { job: JobView }) {
  const where = [job.location, WORK_MODE_LABEL[job.workMode]]
    .filter(Boolean)
    .join(" · ");
  return (
    <article className="flex flex-col gap-4">
      <header className="flex flex-col gap-1">
        <h2 className="text-2xl font-semibold tracking-tight">{job.title}</h2>
        <p className="text-zinc-700 dark:text-zinc-300">
          {job.company.name}
          {job.company.verificationStatus === "VERIFIED" && (
            <span className="ml-2 text-sm text-green-700 dark:text-green-400">
              ✓ Verified employer
            </span>
          )}
        </p>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {where} · {JOB_TYPE_LABEL[job.jobType]} ·{" "}
          {EXPERIENCE_LABEL[job.experienceLevel]} · {job.industry.name}
        </p>
        <p className="font-medium">
          {formatSalary(job.salaryMin, job.salaryMax, job.salaryPeriod)}
        </p>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Closes {formatDeadline(job.deadline)}
        </p>
      </header>
      <section>
        <h3 className="font-semibold">About the role</h3>
        <p className="mt-2 whitespace-pre-line text-zinc-700 dark:text-zinc-300">
          {job.description}
        </p>
      </section>
      <section>
        <h3 className="font-semibold">Requirements</h3>
        <p className="mt-2 whitespace-pre-line text-zinc-700 dark:text-zinc-300">
          {job.requirements}
        </p>
      </section>
    </article>
  );
}
