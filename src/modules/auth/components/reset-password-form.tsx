"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/text-field";
import { authClient } from "@/lib/auth-client";
import { authErrorMessage } from "@/modules/auth/messages";
import { PASSWORD_MIN_LENGTH } from "@/modules/auth/signup-rules";

export function ResetPasswordForm({ token }: { token: string | null }) {
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  if (!token) {
    return (
      <Alert tone="error">
        This link has expired or was already used.{" "}
        <Link href="/forgot-password" className="font-medium underline">
          Request a new one
        </Link>
        .
      </Alert>
    );
  }

  if (done) {
    return (
      <Alert tone="success">
        Your password has been changed and you&apos;ve been signed out
        everywhere.{" "}
        <Link href="/login" className="font-medium underline">
          Log in
        </Link>
        .
      </Alert>
    );
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setPending(true);
    setError(null);
    const { error } = await authClient.resetPassword({
      newPassword: String(form.get("password")),
      token: token!,
    });
    setPending(false);
    if (error) setError(authErrorMessage(error));
    else setDone(true);
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      {error && <Alert tone="error">{error}</Alert>}
      <TextField
        label="New password"
        name="password"
        type="password"
        autoComplete="new-password"
        required
        minLength={PASSWORD_MIN_LENGTH}
        maxLength={128}
        hint="At least 12 characters."
      />
      <Button type="submit" loading={pending}>
        Change password
      </Button>
    </form>
  );
}
