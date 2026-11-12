import { z } from "zod";
import { JOB_TYPES, WORK_MODES } from "./schemas";

export const SEARCH_PAGE_SIZE = 20;
export const SEARCH_MAX_PAGE_SIZE = 50;

/** Repeatable query param (?workMode=REMOTE&workMode=HYBRID) – unknown values are dropped. */
const multi = <T extends string>(values: readonly T[]) =>
  z
    .array(z.string())
    .default([])
    .transform((list) => [
      ...new Set(
        list.filter((v): v is T => (values as readonly string[]).includes(v)),
      ),
    ]);

/** Public job search filters (FR-CAN-006/007, API design §4.4). Lenient: bad input is ignored. */
export const SearchParams = z.object({
  q: z.string().trim().max(100).catch("").default(""),
  location: z.string().trim().max(80).catch("").default(""),
  workMode: multi(WORK_MODES),
  jobType: multi(JOB_TYPES),
  cursor: z.string().max(200).optional().catch(undefined),
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(SEARCH_MAX_PAGE_SIZE)
    .catch(SEARCH_PAGE_SIZE)
    .default(SEARCH_PAGE_SIZE),
});
export type SearchParams = z.infer<typeof SearchParams>;

/** Reads filters from a URL's search params (page or API). */
export function parseSearchParams(
  params: URLSearchParams | Record<string, string | string[] | undefined>,
) {
  const get = (k: string) =>
    params instanceof URLSearchParams
      ? (params.get(k) ?? undefined)
      : Array.isArray(params[k])
        ? params[k][0]
        : params[k];
  const all = (k: string) =>
    params instanceof URLSearchParams
      ? params.getAll(k)
      : ([] as string[]).concat(params[k] ?? []);
  return SearchParams.parse({
    q: get("q"),
    location: get("location"),
    workMode: all("workMode"),
    jobType: all("jobType"),
    cursor: get("cursor"),
    limit: get("limit"),
  });
}

// ── Cursor pagination (API design §3) ─────────────────────────────────────────

type Cursor = { publishedAt: Date; id: string };

/** Opaque cursor = the last row's sort key (published_at, id). */
export function encodeCursor(c: Cursor): string {
  return Buffer.from(`${c.publishedAt.toISOString()}|${c.id}`).toString(
    "base64url",
  );
}

export function decodeCursor(raw: string | undefined): Cursor | null {
  if (!raw) return null;
  const [iso, id] = Buffer.from(raw, "base64url").toString().split("|");
  const publishedAt = new Date(iso ?? "");
  if (Number.isNaN(publishedAt.getTime()) || !z.uuid().safeParse(id).success)
    return null;
  return { publishedAt, id: id! };
}

/** Escapes LIKE wildcards so a user typing "%" or "_" searches for those characters. */
export function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (c) => `\\${c}`);
}
