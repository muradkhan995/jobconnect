import type { Metadata } from "next";
import Link from "next/link";
import { orNotFound } from "@/lib/http/page";
import { getCurrentUser } from "@/modules/auth/session";
import { JobPreview } from "@/modules/job/components/job-preview";
import { getPublicJob } from "@/modules/job/search";

export async function generateMetadata({
  params,
}: PageProps<"/jobs/[id]">): Promise<Metadata> {
  const { id } = await params;
  const job = await orNotFound(id, () => getPublicJob(id));
  return {
    title: `${job.title} at ${job.company.name} · JobConnect`,
    description: job.description.slice(0, 160),
  };
}

/**
 * Public job details (FR-CAN-008, docs/11 §4.2). A job that isn't visible never gets here:
 * the proxy answers 404 first (D-20); orNotFound is the second line of defence.
 */
export default async function JobPage({ params }: PageProps<"/jobs/[id]">) {
  const { id } = await params;
  const [job, user] = await Promise.all([
    orNotFound(id, () => getPublicJob(id)),
    getCurrentUser(),
  ]);

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 pb-28 sm:pb-10">
      <Link href="/jobs" className="text-sm underline">
        ← Back to search
      </Link>
      <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-6 sm:p-8 dark:border-zinc-800 dark:bg-zinc-950">
        <JobPreview job={job} />
      </div>
      {/* Apply panel – sticky at the bottom on phones (docs/11 §4.2). Applying arrives in sprint S3. */}
      <div className="fixed inset-x-0 bottom-0 border-t border-zinc-200 bg-white p-4 sm:static sm:mt-6 sm:border-0 sm:bg-transparent sm:p-0 dark:border-zinc-800 dark:bg-zinc-950 sm:dark:bg-transparent">
        <div className="mx-auto max-w-3xl">
          {!user ? (
            <Link
              href={`/login?next=${encodeURIComponent(`/jobs/${job.id}`)}`}
              className="flex min-h-11 w-full items-center justify-center rounded-lg bg-zinc-900 px-5 font-medium text-white hover:bg-zinc-700 sm:w-auto sm:inline-flex dark:bg-zinc-100 dark:text-zinc-900"
            >
              Log in to apply
            </Link>
          ) : user.role === "CANDIDATE" ? (
            <p className="rounded-lg border border-zinc-300 px-4 py-3 text-center text-sm sm:text-left dark:border-zinc-700">
              Applying opens soon – you&apos;ll be able to apply with your saved
              CV.
            </p>
          ) : (
            <p className="text-center text-sm text-zinc-600 sm:text-left dark:text-zinc-400">
              You&apos;re viewing this job as{" "}
              {user.role === "EMPLOYER" ? "an employer" : "an admin"}.
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
