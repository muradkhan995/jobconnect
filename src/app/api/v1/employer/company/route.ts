import { apiRoute, json, parseBody } from "@/lib/http/api";
import { notFound } from "@/lib/http/errors";
import { CompanyInput } from "@/modules/company/schemas";
import {
  createMyCompany,
  getMyCompany,
  updateMyCompany,
} from "@/modules/company/service";

const employer = { roles: ["EMPLOYER"] } as const;

/** GET /api/v1/employer/company – the caller's company (FR-EMP-001). */
export const GET = apiRoute(employer, async ({ user }) => {
  const company = await getMyCompany(user);
  if (!company) throw notFound("Your company profile");
  return json(company);
});

/** POST – create it in PENDING (FR-EMP-001, FR-EMP-004). */
export const POST = apiRoute(employer, async ({ request, user }) => {
  const input = await parseBody(request, CompanyInput);
  return json(await createMyCompany(user, input), 201);
});

/** PATCH – edit it; a rejected company goes back to review (FR-EMP-003, BR §2). */
export const PATCH = apiRoute(employer, async ({ request, user }) => {
  const input = await parseBody(request, CompanyInput);
  return json(await updateMyCompany(user, input));
});
