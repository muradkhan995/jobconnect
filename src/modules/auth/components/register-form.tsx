"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/text-field";
import { authClient } from "@/lib/auth-client";
import { authErrorMessage } from "@/modules/auth/messages";
import {
  CURRENT_PRIVACY_POLICY_VERSION,
  PASSWORD_MIN_LENGTH,
  type SelfServiceRole,
} from "@/modules/auth/signup-rules";

const ROLE_OPTIONS: { value: SelfServiceRole; title: string; text: string }[] =
  [
    {
      value: "CANDIDATE",
      title: "I'm looking for a job",
      text: "Search jobs and track every application.",
    },
    {
      value: "EMPLOYER",
      title: "I'm hiring",
      text: "Post jobs and manage applicants in one place.",
    },
  ];

export function RegisterForm() {
  const router = useRouter();
  const [role, setRole] = useState<SelfServiceRole>("CANDIDATE");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    if (form.get("privacy") !== "on") {
      setError("Please accept the privacy policy to create an account.");
      return;
    }
    setPending(true);
    setError(null);
    const email = String(form.get("email"));
    const { error } = await authClient.signUp.email({
      name: String(form.get("name")),
      email,
      password: String(form.get("password")),
      role,
      privacyPolicyVersion: CURRENT_PRIVACY_POLICY_VERSION,
      callbackURL: "/login?verified=1",
    });
    setPending(false);
    if (error) {
      setError(authErrorMessage(error));
      return;
    }
    router.push(`/check-email?email=${encodeURIComponent(email)}`);
  }

  return (
    <form
      onSubmit={onSubmit}
      className="flex flex-col gap-5"
      noValidate={false}
    >
      {error && <Alert tone="error">{error}</Alert>}

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-sm font-medium">I want to…</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          {ROLE_OPTIONS.map((o) => (
            <label
              key={o.value}
              className="flex cursor-pointer gap-3 rounded-lg border border-zinc-300 p-3 has-checked:border-zinc-900 has-checked:bg-zinc-50 has-focus-visible:outline-2 has-focus-visible:outline-zinc-900 dark:border-zinc-700 dark:has-checked:border-zinc-100 dark:has-checked:bg-zinc-900"
            >
              <input
                type="radio"
                name="role"
                value={o.value}
                checked={role === o.value}
                onChange={() => setRole(o.value)}
                className="mt-1 size-4 accent-zinc-900"
              />
              <span>
                <span className="block text-sm font-medium">{o.title}</span>
                <span className="block text-xs text-zinc-600 dark:text-zinc-400">
                  {o.text}
                </span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <TextField
        label="Full name"
        name="name"
        autoComplete="name"
        required
        maxLength={100}
      />
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
        autoComplete="new-password"
        required
        minLength={PASSWORD_MIN_LENGTH}
        maxLength={128}
        hint="At least 12 characters. A few random words works well."
      />

      <label className="flex gap-3 text-sm">
        <input
          type="checkbox"
          name="privacy"
          required
          className="mt-0.5 size-4 accent-zinc-900"
        />
        <span>
          I agree to the{" "}
          <Link
            href="/privacy"
            className="font-medium underline"
            target="_blank"
          >
            Privacy Policy
          </Link>
          .
        </span>
      </label>

      <Button type="submit" loading={pending}>
        Create account
      </Button>
    </form>
  );
}
