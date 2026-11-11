import { connection } from "next/server";
import { getHealth } from "@/lib/health";

// Cache Components is on: without connection() this handler would be
// prerendered at build time and always report the build-time result.
export async function GET() {
  await connection();
  return Response.json(getHealth(), {
    headers: { "Cache-Control": "no-store" },
  });
}
