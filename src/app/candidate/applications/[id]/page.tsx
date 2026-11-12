import type { Metadata } from "next";
import Link from "next/link";
import { Alert } from "@/components/ui/alert";
import { StatusBadge } from "@/components/ui/status-badge";
import { orNotFound } from "@/lib/http/page";
import { APPLICATION_STATUS_LABEL } from "@/modules/application/labels";
import { getMyApplication } from "@/modules/application/service";
import { requireUser } from "@/modules/auth/session";

export const metadata: Metadata = { title: "Application · JobConnect" };

const when = (d: Date) =>
  d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Europe/London",
  });

/** One application with its status timeline (FR-CAN-013, BR-APP-007). Only the owner can open it. */
export default async function ApplicationDetail({
  params,
  searchParams,
}: PageProps<"/candidate/applications/[id]">) {
  const { id } = await params;
  const user = await requireUser(
    ["CANDIDATE"],
    `/candidate/applications/${id}`,
  );
  const app = await orNotFound(id, () => getMyApplication(user, id));
  const applied = (await searchParams)["applied"] === "1";
  const label = APPLICATION_STATUS_LABEL[app.status];

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-10">
      <Link href="/candidate/applications" className="text-sm underline">
        ← My applications
      </Link>
      {applied && (
        <Alert tone="success">
          Application sent. You&apos;ll see every status change here.
        </Alert>
      )}
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {app.job.title}
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            {app.job.company.name}
          </p>
        </div>
        <StatusBadge tone={label.tone}>{label.candidate}</StatusBadge>
      </header>

      <section
        aria-labelledby="timeline"
        className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950"
      >
        <h2 id="timeline" className="mb-4 font-semibold">
          Timeline
        </h2>
        <ol className="flex flex-col gap-4 border-l-2 border-zinc-200 pl-5 dark:border-zinc-800">
          {app.history.map((h, i) => (
            <li key={i} className="relative">
              <span
                aria-hidden="true"
                className="absolute top-1.5 -left-[27px] size-3 rounded-full bg-zinc-900 dark:bg-zinc-100"
              />
              <p className="font-medium">
                {APPLICATION_STATUS_LABEL[h.toStatus].candidate}
              </p>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                {when(h.changedAt)}
              </p>
              {h.message && <p className="mt-1 text-sm">“{h.message}”</p>}
            </li>
          ))}
        </ol>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-6 text-sm dark:border-zinc-800 dark:bg-zinc-950">
        <h2 className="mb-3 font-semibold">What you sent</h2>
        <p>
          <span className="text-zinc-500">CV:</span> {app.cvOriginalFilename}
        </p>
        {app.coverLetter && (
          <p className="mt-3 whitespace-pre-line">{app.coverLetter}</p>
        )}
      </section>
    </main>
  );
}
