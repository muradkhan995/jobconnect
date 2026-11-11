import { connection } from "next/server";
import { getDb } from "@/lib/db";
import { checkHealth } from "@/lib/health";

// Cache Components is on: without connection() this handler would be
// prerendered at build time and always report the build-time result.
export async function GET() {
  await connection();
  const { httpStatus, body } = await checkHealth(
    () => getDb().$queryRaw`SELECT 1`,
  );
  return Response.json(body, {
    status: httpStatus,
    headers: { "Cache-Control": "no-store" },
  });
}
