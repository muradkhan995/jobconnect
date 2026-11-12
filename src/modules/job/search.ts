import "server-only";
import { Prisma } from "@/generated/prisma/client";
import { getDb } from "@/lib/db";
import { notFound } from "@/lib/http/errors";
import {
  decodeCursor,
  encodeCursor,
  escapeLike,
  type SearchParams,
} from "./search-params";
import { jobSelect, type JobView } from "./service";

/**
 * THE public visibility rule – defined once, used by search, job details and the proxy
 * (docs/09 §5): published (BR-JOB-001), not past its deadline, company verified
 * (BR-CMP-003) and the company owner active (BR-USR-002).
 */
export const VISIBLE_JOB = Prisma.sql`
  j.status = 'PUBLISHED'
  AND j.deadline > now()
  AND EXISTS (
    SELECT 1 FROM company c JOIN "user" u ON u.id = c.owner_user_id
    WHERE c.id = j.company_id AND c.verification_status = 'VERIFIED' AND u.status = 'ACTIVE'
  )`;

export type JobCard = {
  id: string;
  title: string;
  companyName: string;
  location: string | null;
  workMode: "ON_SITE" | "HYBRID" | "REMOTE";
  jobType: "FULL_TIME" | "PART_TIME" | "CONTRACT" | "TEMPORARY" | "INTERNSHIP";
  experienceLevel: "ENTRY" | "JUNIOR" | "MID" | "SENIOR" | "LEAD";
  salaryMin: number;
  salaryMax: number;
  salaryPeriod: "YEAR" | "DAY" | "HOUR";
  deadline: Date;
  publishedAt: Date;
};

function filters(p: SearchParams): Prisma.Sql[] {
  const where: Prisma.Sql[] = [VISIBLE_JOB];
  if (p.q) {
    // Stored, GIN-indexed document (job_search_idx, migration …_job_search_vector).
    where.push(
      Prisma.sql`j.search_vector @@ websearch_to_tsquery('english', ${p.q})`,
    );
  }
  if (p.location) {
    where.push(Prisma.sql`j.location ILIKE ${`%${escapeLike(p.location)}%`}`);
  }
  if (p.workMode.length) {
    where.push(Prisma.sql`j.work_mode::text IN (${Prisma.join(p.workMode)})`);
  }
  if (p.jobType.length) {
    where.push(Prisma.sql`j.job_type::text IN (${Prisma.join(p.jobType)})`);
  }
  return where;
}

/**
 * Public job search (FR-CAN-006/007): newest first, cursor-paginated (API design §3).
 * All values are bound parameters – no user input is ever concatenated into SQL (NFR-SEC-004).
 */
export async function searchJobs(
  p: SearchParams,
): Promise<{ items: JobCard[]; nextCursor: string | null; total: number }> {
  const where = filters(p);
  const cursor = decodeCursor(p.cursor);
  const page = cursor
    ? [
        ...where,
        Prisma.sql`(j.published_at, j.id) < (${cursor.publishedAt}, ${cursor.id}::uuid)`,
      ]
    : where;
  const db = getDb();

  const [rows, totals] = await Promise.all([
    db.$queryRaw<JobCard[]>`
      SELECT j.id, j.title, c.name AS "companyName", j.location, j.work_mode AS "workMode",
             j.job_type AS "jobType", j.experience_level AS "experienceLevel",
             j.salary_min AS "salaryMin", j.salary_max AS "salaryMax", j.salary_period AS "salaryPeriod",
             j.deadline, j.published_at AS "publishedAt"
      FROM job j JOIN company c ON c.id = j.company_id
      WHERE ${Prisma.join(page, " AND ")}
      ORDER BY j.published_at DESC, j.id DESC
      LIMIT ${p.limit + 1}`,
    db.$queryRaw<{ total: bigint }[]>`
      SELECT count(*) AS total FROM job j WHERE ${Prisma.join(where, " AND ")}`,
  ]);

  const items = rows.slice(0, p.limit);
  const last = items.at(-1);
  return {
    items,
    nextCursor:
      rows.length > p.limit && last
        ? encodeCursor({ publishedAt: last.publishedAt, id: last.id })
        : null,
    total: Number(totals[0]?.total ?? 0),
  };
}

/** True if the job is publicly visible – used by the proxy to return a real 404 (D-20). */
export async function isJobVisible(id: string): Promise<boolean> {
  const rows = await getDb().$queryRaw<{ ok: number }[]>`
    SELECT 1 AS ok FROM job j WHERE j.id = ${id}::uuid AND ${VISIBLE_JOB}`;
  return rows.length > 0;
}

/** Public job details (FR-CAN-008). Anything not visible is "not found". */
export async function getPublicJob(id: string): Promise<JobView> {
  if (!(await isJobVisible(id))) throw notFound("This job");
  return getDb().job.findUniqueOrThrow({ where: { id }, select: jobSelect });
}

/**
 * The public shape of a job: an explicit allow-list, so a new internal column (status reasons,
 * moderation timestamps…) can never leak into the public API by accident.
 */
export function toPublicJob(job: JobView) {
  return {
    id: job.id,
    title: job.title,
    description: job.description,
    requirements: job.requirements,
    location: job.location,
    workMode: job.workMode,
    jobType: job.jobType,
    experienceLevel: job.experienceLevel,
    industry: job.industry.name,
    salaryMin: job.salaryMin,
    salaryMax: job.salaryMax,
    salaryPeriod: job.salaryPeriod,
    currency: job.currency,
    deadline: job.deadline,
    publishedAt: job.publishedAt,
    company: { id: job.company.id, name: job.company.name, verified: true },
  };
}
