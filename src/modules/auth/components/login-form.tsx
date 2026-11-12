"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/text-field";
import { authClient } from "@/lib/auth-client";
import { authErrorMessage } from "@/modules/auth/messages";
import { safeNext } from "@/modules/auth/safe-next";

export function LoginForm({ next }: { next: string | null }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setPending(true);
    setError(null);
    const { error } = await authClient.signIn.email({
      email: String(form.get("email")),
      password: String(form.get("password")),
      callbackURL: "/login?verified=1",
    });
    setPending(false);
    if (error) {
      setError(authErrorMessage(error));
      return;
    }
    // Full page load, not router.push + refresh: those two race, and the refresh could win and
    // drop `next`. A fresh load also renders the header with the new session.
    window.location.assign(safeNext(next));
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
      <TextField
        label="Password"
        name="password"
        type="password"
        autoComplete="current-password"
        required
      />
      <div className="-mt-2 text-right text-sm">
        <Link href="/forgot-password" className="underline">
          Forgot your password?
        </Link>
      </div>
      <Button type="submit" loading={pending}>
        Log in
      </Button>
    </form>
  );
}
