/**
 * NFR-PERF-001 check: job search p95 < 500 ms with 10,000 published jobs.
 *
 *   npx tsx scripts/perf-search.ts
 *
 * Inserts 10,000 published jobs INSIDE A TRANSACTION, times the search queries, prints the
 * query plans, then ROLLS BACK – the database is left exactly as it was. Local database only.
 */
import { config } from "dotenv";
import { Client } from "pg";
import { uuidv7 } from "../src/lib/uuidv7";

config({ path: [".env.local", ".env"], quiet: true });

const JOBS = 10_000;
const RUNS = 50;
const TITLES = [
  "Software Engineer",
  "Nurse",
  "Accountant",
  "Warehouse Operative",
  "Teacher",
  "Chef",
  "Data Analyst",
  "Electrician",
  "Marketing Manager",
  "Solicitor",
  "Delivery Driver",
  "Designer",
];
const TOWNS = [
  "Manchester",
  "Leeds",
  "London",
  "Bristol",
  "Glasgow",
  "Cardiff",
  "Belfast",
  "Leicester",
];
const MODES = ["ON_SITE", "HYBRID", "REMOTE"];
const TYPES = ["FULL_TIME", "PART_TIME", "CONTRACT", "TEMPORARY", "INTERNSHIP"];
const IT = "01a1cd0d-dc07-78b7-898d-42f24fd57db7";

// The same WHERE clause as src/modules/job/search.ts (VISIBLE_JOB + filters).
const VISIBLE = `j.status = 'PUBLISHED' AND j.deadline > now() AND EXISTS (
  SELECT 1 FROM company c JOIN "user" u ON u.id = c.owner_user_id
  WHERE c.id = j.company_id AND c.verification_status = 'VERIFIED' AND u.status = 'ACTIVE')`;
const KEYWORD = `j.search_vector @@ websearch_to_tsquery('english', $1)`;

const QUERIES: { name: string; where: string; params: unknown[] }[] = [
  { name: "browse newest (no filters)", where: VISIBLE, params: [] },
  {
    name: "keyword 'engineer'",
    where: `${VISIBLE} AND ${KEYWORD}`,
    params: ["engineer"],
  },
  {
    name: "keyword + location + mode",
    where: `${VISIBLE} AND ${KEYWORD} AND j.location ILIKE $2 AND j.work_mode::text IN ('REMOTE','HYBRID')`,
    params: ["nurse", "%leeds%"],
  },
  {
    name: "location only",
    where: `${VISIBLE} AND j.location ILIKE $1`,
    params: ["%manchester%"],
  },
];

const pick = <T>(a: T[], i: number): T => a[i % a.length]!;

async function seed(db: Client): Promise<number> {
  const userId = uuidv7();
  const companyId = uuidv7();
  await db.query(
    `INSERT INTO "user" (id, name, email, email_verified, role, status, privacy_consent_at,
       privacy_policy_version, updated_at)
     VALUES ($1, 'Perf', $2, true, 'EMPLOYER', 'ACTIVE', now(), 'perf', now())`,
    [userId, `perf-${userId}@example.com`],
  );
  await db.query(
    `INSERT INTO company (id, owner_user_id, name, description, industry_id, size, location,
       verification_status, verified_at, updated_at)
     VALUES ($1, $2, 'Perf Ltd', 'Performance test company.', $3, 'SIZE_500_PLUS', 'Leeds',
       'VERIFIED', now(), now())`,
    [companyId, userId, IT],
  );
  // 10,000 published jobs plus 30 % unpublished noise that search must skip.
  const total = Math.round(JOBS * 1.3);
  for (let start = 0; start < total; start += 1000) {
    const values: string[] = [];
    const params: unknown[] = [];
    for (let i = start; i < Math.min(start + 1000, total); i++) {
      const status =
        i < JOBS ? "PUBLISHED" : pick(["DRAFT", "CLOSED", "PAUSED"], i);
      const title = `${pick(TITLES, i)} ${i}`;
      const n = params.length;
      const p = (k: number) => `$${n + k}`;
      values.push(
        `(${p(1)}::uuid, ${p(2)}::uuid, ${p(3)}, ${p(4)}, ${p(5)}, ${p(6)}, ${p(7)}::work_mode,
          ${p(8)}::job_type, 'MID', ${p(9)}::uuid, 30000, 45000, now() + interval '30 days',
          ${p(10)}::job_status,
          CASE WHEN ${p(10)} = 'PUBLISHED' THEN now() - (${p(11)} || ' minutes')::interval END, now())`,
      );
      params.push(
        uuidv7(),
        companyId,
        title,
        `We are hiring a ${title} to join a friendly team. Training provided, good benefits and pension.`,
        `Experience as a ${pick(TITLES, i + 3)}; good communication; right to work in the UK.`,
        pick(TOWNS, i),
        pick(MODES, i),
        pick(TYPES, i),
        IT,
        status,
        String(i),
      );
    }
    await db.query(
      `INSERT INTO job (id, company_id, title, description, requirements, location, work_mode,
         job_type, experience_level, industry_id, salary_min, salary_max, deadline, status,
         published_at, updated_at)
       VALUES ${values.join(",")}`,
      params,
    );
  }
  await db.query("ANALYZE job");
  return total;
}

async function measure(db: Client) {
  let ok = true;
  for (const q of QUERIES) {
    // Same shape as searchJobs(): one page (limit + 1) and one count, run in parallel.
    const page = `SELECT j.id FROM job j WHERE ${q.where} ORDER BY j.published_at DESC, j.id DESC LIMIT 21`;
    const count = `SELECT count(*) FROM job j WHERE ${q.where}`;
    const times: number[] = [];
    for (let r = 0; r < RUNS; r++) {
      const t = performance.now();
      await Promise.all([db.query(page, q.params), db.query(count, q.params)]);
      times.push(performance.now() - t);
    }
    times.sort((a, b) => a - b);
    const p95 = times[Math.ceil(RUNS * 0.95) - 1]!;
    const median = times[RUNS >> 1]!;
    ok &&= p95 < 500;
    const matches = (await db.query(count, q.params)).rows[0].count as string;
    console.log(
      `${p95 < 500 ? "PASS" : "FAIL"} ${q.name.padEnd(28)} p95 ${p95.toFixed(1).padStart(6)} ms` +
        `  median ${median.toFixed(1).padStart(6)} ms  (${matches} matches)`,
    );
    for (const sql of [page, count]) {
      const plan = await db.query(
        `EXPLAIN (ANALYZE, BUFFERS) ${sql}`,
        q.params,
      );
      const lines = plan.rows.map((r) => String(r["QUERY PLAN"]));
      for (const l of lines.filter((x) => /Scan|Execution Time/.test(x)))
        console.log(`       ${l.trim()}`);
    }
  }
  return ok;
}

async function main() {
  const url = process.env["DATABASE_URL"];
  if (!url || !["localhost", "127.0.0.1"].includes(new URL(url).hostname)) {
    throw new Error("Local database only.");
  }
  const db = new Client({ connectionString: url });
  await db.connect();
  await db.query("BEGIN");
  let ok = false;
  try {
    const total = await seed(db);
    console.log(
      `${JOBS} published jobs (+${total - JOBS} unpublished), ${RUNS} runs per query\n`,
    );
    ok = await measure(db);
  } finally {
    await db.query("ROLLBACK"); // leave the database exactly as it was
    await db.end();
  }
  console.log(ok ? "\nNFR-PERF-001 met." : "\nNFR-PERF-001 NOT met.");
  process.exit(ok ? 0 : 1);
}

main().catch((e: unknown) => {
  console.error(e);
  process.exit(1);
});
