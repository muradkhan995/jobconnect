import "server-only";
import { headers } from "next/headers";
import { getAuth } from "@/lib/auth";

export type CurrentUser = {
  id: string;
  name: string;
  email: string;
  role: "CANDIDATE" | "EMPLOYER" | "ADMIN";
};

/** The signed-in user for this request, or null. Read on the server only. */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  // Read the request first: it marks the render as request-time, so `next build` never
  // reaches getAuth() (which needs secrets) while prerendering.
  const requestHeaders = await headers();
  const session = await getAuth().api.getSession({ headers: requestHeaders });
  if (!session) return null;
  const { id, name, email, role } = session.user;
  return { id, name, email, role: role as CurrentUser["role"] };
}
