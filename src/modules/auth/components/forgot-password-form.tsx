"use client";

import { useState, type FormEvent } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/text-field";
import { authClient } from "@/lib/auth-client";
import { RATE_LIMITED_MESSAGE } from "@/modules/auth/messages";

export function ForgotPasswordForm() {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setPending(true);
    setError(null);
    const { error } = await authClient.requestPasswordReset({
      email: String(form.get("email")),
      redirectTo: "/reset-password",
    });
    setPending(false);
    // Same message whether or not the email exists (API design §4.1).
    if (error?.status === 429) setError(RATE_LIMITED_MESSAGE);
    else setSent(true);
  }

  if (sent) {
    return (
      <Alert tone="success">
        If an account exists for that email, we&apos;ve sent a link to reset
        your password. It expires in 1 hour.
      </Alert>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      {error && <Alert tone="error">{error}</Alert>}
      <TextField
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        required
      />
      <Button type="submit" loading={pending}>
        Send reset link
      </Button>
    </form>
  );
}
