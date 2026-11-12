import { z } from "zod";
import { apiRoute, json } from "@/lib/http/api";
import { notFound } from "@/lib/http/errors";
import { getCompanyForAdmin } from "@/modules/company/service";

/** GET /api/v1/admin/companies/{id} (FR-ADM-008). */
export const GET = apiRoute<{ id: string }>(
  { roles: ["ADMIN"] },
  async ({ params, user }) => {
    if (!z.uuid().safeParse(params.id).success) throw notFound("This company");
    return json(await getCompanyForAdmin(user, params.id));
  },
);
