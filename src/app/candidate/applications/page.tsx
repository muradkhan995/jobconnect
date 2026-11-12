import type { Metadata } from "next";
import Link from "next/link";
import { StatusBadge } from "@/components/ui/status-badge";
import { APPLICATION_STATUS_LABEL } from "@/modules/application/labels";
import { listMyApplications } from "@/modules/application/service";
import { requireUser } from "@/modules/auth/session";

export const metadata: Metadata = { title: "My applications · JobConnect" };

const day = (d: Date) =>
  d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

/** FR-CAN-013: every application with its real status (docs/04-design/01-ui-flows.md §4.3). */
export default async function MyApplications() {
  const user = await requireUser(["CANDIDATE"], "/candidate/applications");
  const applications = await listMyApplications(user);
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-10">
      <h1 className="text-3xl font-semibold tracking-tight">My applications</h1>
      {applications.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 p-10 text-center text-zinc-600 dark:border-zinc-700 dark:text-zinc-400">
          You haven&apos;t applied to any jobs yet.{" "}
          <Link href="/jobs" className="font-medium underline">
            Find jobs
          </Link>
        </div>
      ) : (
        <ul className="flex flex-col gap-3" aria-label="Your applications">
          {applications.map((a) => {
            const label = APPLICATION_STATUS_LABEL[a.status];
            return (
              <li key={a.id}>
                <Link
                  href={`/candidate/applications/${a.id}`}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-zinc-200 bg-white p-5 hover:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950"
                >
                  <span>
                    <span className="block font-semibold">{a.job.title}</span>
                    <span className="text-sm text-zinc-600 dark:text-zinc-400">
                      {a.job.company.name} · applied {day(a.appliedAt)}
                    </span>
                  </span>
                  <StatusBadge tone={label.tone}>{label.candidate}</StatusBadge>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
