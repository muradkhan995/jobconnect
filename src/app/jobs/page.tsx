import type { Metadata } from "next";
import Link from "next/link";
import { JobCard } from "@/modules/job/components/job-card";
import { SearchForm } from "@/modules/job/components/search-form";
import { parseSearchParams } from "@/modules/job/search-params";
import { searchJobs } from "@/modules/job/search";

export const metadata: Metadata = {
  title: "Find jobs · JobConnect",
  description: "Jobs from verified employers, with real application status.",
};

/** Public job search (FR-CAN-006/007, docs/11 §4.1). */
export default async function JobsPage({ searchParams }: PageProps<"/jobs">) {
  const params = parseSearchParams(await searchParams);
  const { items, nextCursor, total } = await searchJobs(params);
  const filtered = Boolean(
    params.q ||
    params.location ||
    params.workMode.length ||
    params.jobType.length,
  );

  // "Load more" keeps every filter and adds the cursor – a plain link, no JavaScript needed.
  const next = new URLSearchParams();
  if (params.q) next.set("q", params.q);
  if (params.location) next.set("location", params.location);
  params.workMode.forEach((m) => next.append("workMode", m));
  params.jobType.forEach((t) => next.append("jobType", t));
  if (nextCursor) next.set("cursor", nextCursor);

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-10">
      <h1 className="text-3xl font-semibold tracking-tight">Find jobs</h1>
      <SearchForm params={params} />
      <p
        className="text-sm text-zinc-600 dark:text-zinc-400"
        aria-live="polite"
      >
        {total === 1 ? "1 job" : `${total.toLocaleString("en-GB")} jobs`}
        {params.cursor ? " · showing more results" : ""}
      </p>
      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-zinc-300 p-10 text-center dark:border-zinc-700">
          <p className="text-zinc-700 dark:text-zinc-300">
            {filtered
              ? "No jobs match. Try removing a filter."
              : "No jobs are open right now. Check back soon."}
          </p>
          {filtered && (
            <Link href="/jobs" className="font-medium underline">
              Clear filters
            </Link>
          )}
        </div>
      ) : (
        <ul className="flex flex-col gap-3" aria-label="Search results">
          {items.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </ul>
      )}
      {nextCursor && (
        <Link
          href={`/jobs?${next.toString()}`}
          className="self-center rounded-lg border border-zinc-300 px-5 py-2.5 text-sm font-medium hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
        >
          Load more
        </Link>
      )}
    </main>
  );
}
