import type { Metadata } from "next";
import Link from "next/link";
import { StatusBadge } from "@/components/ui/status-badge";
import { requireUser } from "@/modules/auth/session";
import { getMyCompany } from "@/modules/company/service";
import { JOB_STATUS_LABEL, formatDeadline } from "@/modules/job/labels";
import { listMyJobs } from "@/modules/job/service";

export const metadata: Metadata = { title: "My jobs · JobConnect" };

export default async function EmployerJobs() {
  const user = await requireUser(["EMPLOYER"], "/employer/jobs");
  const company = await getMyCompany(user);
  const jobs = company ? await listMyJobs(user) : [];

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-semibold tracking-tight">My jobs</h1>
        {company && (
          <Link
            href="/employer/jobs/new"
            className="inline-flex min-h-11 items-center rounded-lg bg-zinc-900 px-4 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900"
          >
            Post a job
          </Link>
        )}
      </div>

      {!company ? (
        <p className="rounded-2xl border border-dashed border-zinc-300 p-10 text-center text-zinc-600 dark:border-zinc-700 dark:text-zinc-400">
          <Link href="/employer/company" className="font-medium underline">
            Create your company profile
          </Link>{" "}
          before posting jobs.
        </p>
      ) : jobs.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-zinc-300 p-10 text-center text-zinc-600 dark:border-zinc-700 dark:text-zinc-400">
          No jobs yet. Write your first one – you can save it as a draft
          {company.verificationStatus !== "VERIFIED" &&
            " while your company is being verified"}
          .
        </p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">Your jobs</caption>
            <thead className="border-b border-zinc-200 text-zinc-600 dark:border-zinc-800 dark:text-zinc-400">
              <tr>
                <th scope="col" className="px-4 py-3 font-medium">
                  Job
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  Status
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  Applications
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  Closes
                </th>
                <th scope="col" className="px-4 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((j) => (
                <tr
                  key={j.id}
                  className="border-b border-zinc-100 last:border-0 dark:border-zinc-900"
                >
                  <td className="px-4 py-3 font-medium">{j.title}</td>
                  <td className="px-4 py-3">
                    <StatusBadge tone={JOB_STATUS_LABEL[j.status].tone}>
                      {JOB_STATUS_LABEL[j.status].employer}
                    </StatusBadge>
                  </td>
                  <td className="px-4 py-3">{j._count.applications}</td>
                  <td className="px-4 py-3">{formatDeadline(j.deadline)}</td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/employer/jobs/${j.id}`}
                      className="font-medium underline"
                    >
                      Open<span className="sr-only"> {j.title}</span>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
