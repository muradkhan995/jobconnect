"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { SelectField } from "@/components/ui/select-field";
import { TextField } from "@/components/ui/text-field";
import { TextareaField } from "@/components/ui/textarea-field";
import { callApi } from "@/lib/client/api";
import {
  COMPANY_SIZES,
  COMPANY_SIZE_LABEL,
  CompanyInput,
} from "@/modules/company/schemas";

type Initial = Partial<Record<keyof CompanyInput, string | null>>;

export function CompanyForm({
  mode,
  initial,
  industries,
  resubmits,
}: {
  mode: "create" | "edit";
  initial: Initial;
  industries: { id: string; name: string }[];
  /** True when saving sends a rejected company back for review. */
  resubmits: boolean;
}) {
  const router = useRouter();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const raw = Object.fromEntries(new FormData(event.currentTarget));
    // Same rules as the server, for instant feedback. The server checks again.
    const parsed = CompanyInput.safeParse(raw);
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues)
        next[String(issue.path[0])] ??= issue.message;
      setErrors(next);
      setMessage("Please check the highlighted fields.");
      return;
    }
    setPending(true);
    setMessage(null);
    const result = await callApi("/api/v1/employer/company", {
      method: mode === "create" ? "POST" : "PATCH",
      body: parsed.data,
    });
    setPending(false);
    if (!result.ok) {
      setErrors(result.fieldErrors);
      setMessage(result.message);
      return;
    }
    router.push("/employer?saved=1");
    router.refresh();
  }

  return (
    <form
      onSubmit={onSubmit}
      // Clear a field's error as soon as it is edited, so stale messages don't linger.
      onChange={(e) => {
        const target = e.target;
        if (
          (target instanceof HTMLInputElement ||
            target instanceof HTMLSelectElement ||
            target instanceof HTMLTextAreaElement) &&
          errors[target.name]
        ) {
          setErrors((prev) => {
            const next = { ...prev };
            delete next[target.name];
            return next;
          });
        }
      }}
      className="flex flex-col gap-5"
      noValidate
    >
      {message && <Alert tone="error">{message}</Alert>}
      <TextField
        label="Company name"
        name="name"
        defaultValue={initial.name ?? ""}
        error={errors["name"]}
        maxLength={120}
        required
      />
      <TextareaField
        label="About the company"
        name="description"
        defaultValue={initial.description ?? ""}
        error={errors["description"]}
        hint="What you do and who you are. At least 30 characters."
        maxLength={5000}
        required
      />
      <div className="grid gap-5 sm:grid-cols-2">
        <SelectField
          label="Industry"
          name="industryId"
          defaultValue={initial.industryId ?? ""}
          placeholder="Choose…"
          options={industries.map((i) => ({ value: i.id, label: i.name }))}
          error={errors["industryId"]}
          required
        />
        <SelectField
          label="Company size"
          name="size"
          defaultValue={initial.size ?? ""}
          placeholder="Choose…"
          options={COMPANY_SIZES.map((s) => ({
            value: s,
            label: COMPANY_SIZE_LABEL[s],
          }))}
          error={errors["size"]}
          required
        />
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField
          label="Location"
          name="location"
          defaultValue={initial.location ?? ""}
          error={errors["location"]}
          hint="City or area of your main office."
          required
        />
        <TextField
          label="Website (optional)"
          name="website"
          type="url"
          inputMode="url"
          placeholder="https://"
          defaultValue={initial.website ?? ""}
          error={errors["website"]}
        />
      </div>
      {resubmits && (
        <Alert tone="info">
          Saving sends your company back to our team for review.
        </Alert>
      )}
      <Button type="submit" loading={pending} className="self-start">
        {mode === "create"
          ? "Submit for verification"
          : resubmits
            ? "Save and resubmit"
            : "Save changes"}
      </Button>
    </form>
  );
}
