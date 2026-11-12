"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

export function SignOutButton() {
  const [pending, setPending] = useState(false);
  return (
    <Button
      variant="secondary"
      loading={pending}
      onClick={async () => {
        setPending(true);
        await authClient.signOut();
        // Full page load: discards the client's in-memory copies of private pages (security)
        // and avoids the push/refresh race that could leave the user on the old page.
        // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- a full reload is the point here (see comment above)
        window.location.assign("/");
      }}
    >
      Log out
    </Button>
  );
}
