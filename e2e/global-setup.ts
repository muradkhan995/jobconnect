import { config } from "dotenv";
import { Client } from "pg";

/**
 * Runs once before the e2e suite. Clears login rate-limit counters so back-to-back runs
 * from the same machine don't hit the 10-per-minute limit (which is working as intended).
 * Local databases only.
 */
export default async function globalSetup() {
  config({ path: [".env.local", ".env"], quiet: true });
  const url = process.env["DATABASE_URL"];
  if (!url) throw new Error("DATABASE_URL is not set");
  const host = new URL(url).hostname;
  if (!["localhost", "127.0.0.1", "::1"].includes(host)) {
    throw new Error(
      `Refusing to reset rate limits on a non-local database (${host}).`,
    );
  }
  const client = new Client({ connectionString: url });
  await client.connect();
  try {
    await client.query('DELETE FROM "rate_limit"');
  } finally {
    await client.end();
  }
}
