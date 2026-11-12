import Link from "next/link";
import { formatDeadline, formatSalary } from "@/modules/job/labels";
import { JOB_TYPE_LABEL, WORK_MODE_LABEL } from "@/modules/job/schemas";
import type { JobCard as JobCardData } from "@/modules/job/search";

/** One search result (docs/11 §4.1). The whole card is one link, with a clear name. */
export function JobCard({ job }: { job: JobCardData }) {
  const where = [job.location, WORK_MODE_LABEL[job.workMode]]
    .filter(Boolean)
    .join(" · ");
  return (
    <li>
      <Link
        href={`/jobs/${job.id}`}
        className="flex flex-col gap-1 rounded-2xl border border-zinc-200 bg-white p-5 hover:border-zinc-400 focus-visible:outline-2 focus-visible:outline-zinc-900 dark:border-zinc-800 dark:bg-zinc-950"
      >
        <span className="text-lg font-semibold">{job.title}</span>
        <span className="text-zinc-700 dark:text-zinc-300">
          {job.companyName}{" "}
          <span className="text-sm text-green-700 dark:text-green-400">
            ✓ Verified
          </span>
        </span>
        <span className="text-sm text-zinc-600 dark:text-zinc-400">
          {where} · {JOB_TYPE_LABEL[job.jobType]}
        </span>
        <span className="text-sm font-medium">
          {formatSalary(job.salaryMin, job.salaryMax, job.salaryPeriod)}
        </span>
        <span className="text-xs text-zinc-500">
          Closes {formatDeadline(job.deadline)}
        </span>
      </Link>
    </li>
  );
}
