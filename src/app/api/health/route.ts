import { connection } from "next/server";
import { getDb } from "@/lib/db";
import { checkHealth } from "@/lib/health";
import { getRequestId } from "@/lib/http/request-id";
import { requestLogger } from "@/lib/logger";

// Cache Components is on: without connection() this handler would be
// prerendered at build time and always report the build-time result.
export async function GET(request: Request) {
  await connection();
  const log = requestLogger(getRequestId(request.headers));
  const { httpStatus, body } = await checkHealth(async () => {
    try {
      return await getDb().$queryRaw`SELECT 1`;
    } catch (err) {
      // Details go to the server log only – never to the response.
      log.error({ err }, "health check: database ping failed");
      throw err;
    }
  });
  return Response.json(body, {
    status: httpStatus,
    headers: { "Cache-Control": "no-store" },
  });
}
