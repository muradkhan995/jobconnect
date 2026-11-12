import { connection } from "next/server";
import { json } from "@/lib/http/api";
import { listActiveIndustries } from "@/modules/company/service";

/** GET /api/v1/industries – public list for forms and filters (API design §4.4). */
export async function GET() {
  await connection();
  return json({ items: await listActiveIndustries() });
}
