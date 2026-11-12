// Integration tests: run against a real PostgreSQL (npm run test:integration).
// They verify the conventions the init migration sets up (docs/05-design/01-data-model.md §1).
import { afterAll, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const { getDb } = await import("./db");
const db = getDb();

afterAll(async () => {
  await db.$disconnect();
});

describe("database conventions", () => {
  it("answers a ping", async () => {
    await expect(db.$queryRaw`SELECT 1`).resolves.toBeDefined();
  });

  it("runs sessions in UTC", async () => {
    const rows = await db.$queryRaw<{ TimeZone: string }[]>`SHOW timezone`;
    expect(rows[0]?.TimeZone).toBe("UTC");
  });

  it("has citext installed, so emails compare case-insensitively", async () => {
    const rows = await db.$queryRaw<{ same: boolean }[]>`
      SELECT 'Amira@Example.com'::citext = 'amira@example.com'::citext AS same`;
    expect(rows[0]?.same).toBe(true);
  });

  it("runs the Postgres major version production uses", async () => {
    const rows = await db.$queryRaw<
      { server_version_num: string }[]
    >`SHOW server_version_num`;
    expect(Math.floor(Number(rows[0]?.server_version_num) / 10000)).toBe(17);
  });
});
