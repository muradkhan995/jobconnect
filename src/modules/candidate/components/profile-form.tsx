"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/text-field";
import { callApi } from "@/lib/client/api";
import { ProfileInput } from "@/modules/candidate/schemas";

type Initial = {
  fullName: string;
  headline: string | null;
  location: string | null;
  phone: string | null;
};

export function ProfileForm({ initial }: { initial: Initial | null }) {
  const router = useRouter();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<{
    tone: "error" | "success";
    text: string;
  } | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = ProfileInput.safeParse(
      Object.fromEntries(new FormData(event.currentTarget)),
    );
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues)
        next[String(issue.path[0])] ??= issue.message;
      setErrors(next);
      setMessage({
        tone: "error",
        text: "Please check the highlighted fields.",
      });
      return;
    }
    setPending(true);
    const result = await callApi("/api/v1/candidate/profile", {
      method: "PUT",
      body: parsed.data,
    });
    setPending(false);
    if (!result.ok) {
      setErrors(result.fieldErrors);
      setMessage({ tone: "error", text: result.message });
      return;
    }
    setErrors({});
    setMessage({ tone: "success", text: "Profile saved." });
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5" noValidate>
      {message && <Alert tone={message.tone}>{message.text}</Alert>}
      <TextField
        label="Full name"
        name="fullName"
        autoComplete="name"
        defaultValue={initial?.fullName ?? ""}
        error={errors["fullName"]}
      />
      <TextField
        label="Headline (optional)"
        name="headline"
        placeholder="e.g. Junior software developer"
        defaultValue={initial?.headline ?? ""}
        error={errors["headline"]}
      />
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField
          label="Location (optional)"
          name="location"
          defaultValue={initial?.location ?? ""}
          error={errors["location"]}
        />
        <TextField
          label="Phone (optional)"
          name="phone"
          type="tel"
          autoComplete="tel"
          defaultValue={initial?.phone ?? ""}
          error={errors["phone"]}
          hint="Employers see it only once you're shortlisted."
        />
      </div>
      <Button type="submit" loading={pending} className="self-start">
        Save profile
      </Button>
    </form>
  );
}
