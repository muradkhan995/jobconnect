import type { Metadata } from "next";
import Link from "next/link";
import { Alert } from "@/components/ui/alert";
import type { JobStatus } from "@/generated/prisma/enums";
import { requireUser } from "@/modules/auth/session";
import { JOB_STATUS_LABEL } from "@/modules/job/labels";
import { countJobsByStatus, listJobsForAdmin } from "@/modules/job/service";

export const metadata: Metadata = { title: "Jobs · Admin · JobConnect" };

const TABS: JobStatus[] = [
  "PENDING_APPROVAL",
  "PUBLISHED",
  "PAUSED",
  "REJECTED",
  "REMOVED",
  "CLOSED",
];
const DONE: Record<string, string> = {
  approve: "Job approved and published. The employer has been emailed.",
  reject: "Job rejected. The employer has been emailed with your reason.",
  remove: "Job removed. The employer has been emailed with your reason.",
};

function waiting(since: Date | null): string {
  if (!since) return "—";
  const days = Math.floor((Date.now() - since.getTime()) / 86_400_000);
  return days === 0 ? "Today" : days === 1 ? "1 day" : `${days} days`;
}

export default async function AdminJobs({
  searchParams,
}: PageProps<"/admin/jobs">) {
  const admin = await requireUser(["ADMIN"], "/admin/jobs");
  const params = await searchParams;
  const status = TABS.find((t) => t === params["status"]) ?? "PENDING_APPROVAL";
  const done =
    typeof params["done"] === "string" ? DONE[params["done"]] : undefined;
  const [jobs, counts] = await Promise.all([
    listJobsForAdmin(admin, status),
    countJobsByStatus(admin),
  ]);

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-10">
      <h1 className="text-3xl font-semibold tracking-tight">Jobs</h1>
      {done && <Alert tone="success">{done}</Alert>}
      <nav aria-label="Filter by status" className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <Link
            key={t}
            href={`/admin/jobs?status=${t}`}
            aria-current={t === status ? "page" : undefined}
            className="rounded-full border border-zinc-300 px-3 py-1.5 text-sm aria-[current=page]:border-zinc-900 aria-[current=page]:bg-zinc-900 aria-[current=page]:text-white dark:border-zinc-700 dark:aria-[current=page]:bg-zinc-100 dark:aria-[current=page]:text-zinc-900"
          >
            {JOB_STATUS_LABEL[t].admin} ({counts[t]})
          </Link>
        ))}
      </nav>
      {jobs.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-zinc-300 p-10 text-center text-zinc-600 dark:border-zinc-700 dark:text-zinc-400">
          {status === "PENDING_APPROVAL"
            ? "Nothing to review. 🎉"
            : "No jobs with this status."}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">
              {JOB_STATUS_LABEL[status].admin} jobs
            </caption>
            <thead className="border-b border-zinc-200 text-zinc-600 dark:border-zinc-800 dark:text-zinc-400">
              <tr>
                <th scope="col" className="px-4 py-3 font-medium">
                  Job
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  Company
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  {status === "PENDING_APPROVAL" ? "Waiting" : "Updated"}
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
                  <td className="px-4 py-3">{j.company.name}</td>
                  <td className="px-4 py-3">
                    {status === "PENDING_APPROVAL"
                      ? waiting(j.submittedAt)
                      : j.updatedAt.toLocaleDateString("en-GB", {
                          timeZone: "Europe/London",
                        })}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/jobs/${j.id}`}
                      className="font-medium underline"
                    >
                      Review<span className="sr-only"> {j.title}</span>
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
