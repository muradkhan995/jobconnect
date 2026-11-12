import { connection } from "next/server";
import { json, publicRoute } from "@/lib/http/api";
import { parseSearchParams } from "@/modules/job/search-params";
import { searchJobs } from "@/modules/job/search";

/**
 * GET /api/v1/jobs?q=&location=&workMode=&jobType=&cursor=&limit= – public search
 * (FR-CAN-006/007, API design §4.4). Visible jobs only; newest first; cursor-paginated.
 */
export const GET = publicRoute(async ({ request }) => {
  await connection();
  return json(
    await searchJobs(parseSearchParams(new URL(request.url).searchParams)),
  );
});
