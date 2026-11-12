import {
  JOB_TYPES,
  JOB_TYPE_LABEL,
  WORK_MODES,
  WORK_MODE_LABEL,
} from "@/modules/job/schemas";
import type { SearchParams } from "@/modules/job/search-params";

/**
 * Plain GET form: works without JavaScript, and every search is a shareable URL with
 * working back/forward buttons (docs/11 §4.1).
 */
export function SearchForm({
  params,
  compact = false,
}: {
  params?: SearchParams;
  compact?: boolean;
}) {
  const input =
    "min-h-11 w-full rounded-lg border border-zinc-300 bg-white px-3 text-base focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-zinc-900 dark:border-zinc-700 dark:bg-zinc-900";
  return (
    <form
      action="/jobs"
      method="get"
      role="search"
      aria-label="Search jobs"
      className="flex flex-col gap-4"
    >
      <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
        <label className="flex flex-col gap-1.5 text-sm font-medium">
          What
          <input
            name="q"
            type="search"
            defaultValue={params?.q}
            placeholder="Job title or skill"
            className={input}
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-medium">
          Where
          <input
            name="location"
            defaultValue={params?.location}
            placeholder="Town or city"
            className={input}
          />
        </label>
        <button
          type="submit"
          className="min-h-11 self-end rounded-lg bg-zinc-900 px-6 text-sm font-medium text-white hover:bg-zinc-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 dark:bg-zinc-100 dark:text-zinc-900"
        >
          Search jobs
        </button>
      </div>
      {!compact && (
        <div className="flex flex-wrap gap-x-8 gap-y-3">
          <fieldset className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <legend className="mb-1 w-full text-sm font-medium">
              Work mode
            </legend>
            {WORK_MODES.map((m) => (
              <label key={m} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="workMode"
                  value={m}
                  defaultChecked={params?.workMode.includes(m)}
                  className="size-4 accent-zinc-900"
                />
                {WORK_MODE_LABEL[m]}
              </label>
            ))}
          </fieldset>
          <fieldset className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <legend className="mb-1 w-full text-sm font-medium">
              Job type
            </legend>
            {JOB_TYPES.map((t) => (
              <label key={t} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="jobType"
                  value={t}
                  defaultChecked={params?.jobType.includes(t)}
                  className="size-4 accent-zinc-900"
                />
                {JOB_TYPE_LABEL[t]}
              </label>
            ))}
          </fieldset>
        </div>
      )}
    </form>
  );
}
