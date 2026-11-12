import { hash } from "@node-rs/argon2";
import { config } from "dotenv";
import { Client } from "pg";
import { uuidv7 } from "../src/lib/uuidv7";

config({ path: [".env.local", ".env"], quiet: true });

/** Direct access to the LOCAL test database for test setup only. */
async function withDb<T>(fn: (c: Client) => Promise<T>): Promise<T> {
  const url = process.env["DATABASE_URL"];
  if (!url) throw new Error("DATABASE_URL is not set");
  if (!["localhost", "127.0.0.1", "::1"].includes(new URL(url).hostname)) {
    throw new Error("e2e helpers only run against a local database");
  }
  const client = new Client({ connectionString: url });
  await client.connect();
  try {
    return await fn(client);
  } finally {
    await client.end();
  }
}

export const TEST_PASSWORD = "Granite-Willow-Beacon-63";

/** A confirmed, active user created directly (fast, independent of the sign-up UI). */
export async function createUser(
  role: "CANDIDATE" | "EMPLOYER" | "ADMIN",
  name: string,
) {
  const id = uuidv7();
  const email = `e2e-${role.toLowerCase()}-${id}@example.com`;
  const passwordHash = await hash(TEST_PASSWORD, {
    memoryCost: 19456,
    timeCost: 2,
    parallelism: 1,
  });
  await withDb(async (c) => {
    await c.query(
      `INSERT INTO "user" (id, name, email, email_verified, role, status, privacy_consent_at,
         privacy_policy_version, updated_at)
       VALUES ($1, $2, $3, true, $4, 'ACTIVE', now(), 'e2e', now())`,
      [id, name, email, role],
    );
    await c.query(
      `INSERT INTO account (id, account_id, provider_id, user_id, password, updated_at)
       VALUES ($1, $2, 'credential', $3, $4, now())`,
      [uuidv7(), id, id, passwordHash],
    );
  });
  return { id, email, name };
}

/**
 * Clears login rate-limit counters. The suite logs in more than 10 times a minute from one
 * machine; the limit itself is correct and stays on for real users.
 */
export async function resetRateLimits() {
  await withDb((c) => c.query('DELETE FROM "rate_limit"'));
}

/** An employer whose company is already VERIFIED – the starting point for job tests. */
export async function createVerifiedEmployer(
  name: string,
  companyName: string,
) {
  const user = await createUser("EMPLOYER", name);
  const companyId = uuidv7();
  await withDb((c) =>
    c.query(
      `INSERT INTO company (id, owner_user_id, name, description, industry_id, size, location,
         verification_status, verified_at, updated_at)
       VALUES ($1, $2, $3, 'A verified company created for end-to-end tests in Leeds.',
         '01a1cd0d-dc07-78b7-898d-42f24fd57db7', 'SIZE_51_200', 'Leeds', 'VERIFIED', now(), now())`,
      [companyId, user.id, companyName],
    ),
  );
  return { ...user, companyId };
}

/** Jobs for a verified company; each later one is published a second later (newest last). */
export async function createPublishedJobs(
  companyId: string,
  jobs: {
    title: string;
    location?: string | null;
    workMode?: string;
    jobType?: string;
    status?: string;
  }[],
) {
  const ids: string[] = [];
  await withDb(async (c) => {
    for (const [i, j] of jobs.entries()) {
      const id = uuidv7();
      const status = j.status ?? "PUBLISHED";
      await c.query(
        `INSERT INTO job (id, company_id, title, description, requirements, location, work_mode,
           job_type, experience_level, industry_id, salary_min, salary_max, deadline, status,
           published_at, updated_at)
         VALUES ($1, $2, $3,
           'Join a friendly team. You will plan routes, talk to customers and keep our depot running.',
           'Good communication and a can-do attitude.', $4, $5::work_mode, $6::job_type, 'MID',
           '01a1cd0d-dc07-78b7-898d-42f24fd57db7', 28000, 34000, now() + interval '30 days',
           $7::job_status,
           CASE WHEN $7 = 'PUBLISHED' THEN now() - interval '1 hour' + ($8 || ' seconds')::interval END,
           now())`,
        [
          id,
          companyId,
          j.title,
          j.location === undefined ? "Leeds" : j.location,
          j.workMode ?? "ON_SITE",
          j.jobType ?? "FULL_TIME",
          status,
          String(i),
        ],
      );
      ids.push(id);
    }
  });
  return ids;
}
