import { inferAdditionalFields } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import type { Auth } from "@/lib/auth";

/** Browser-side auth calls. Same origin, so the session cookie and CSRF check just work. */
export const authClient = createAuthClient({
  plugins: [inferAdditionalFields<Auth>()],
});
