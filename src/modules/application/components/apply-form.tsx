"use client";

import { useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { TextareaField } from "@/components/ui/textarea-field";
import { callApi } from "@/lib/client/api";

type Cv = { id: string; originalFilename: string };

/** Apply sheet (docs/04-design/01-ui-flows.md §4.2): Apply → choose CV → Send = 2 clicks (NFR-UX-003). */
export function ApplyForm({
  jobId,
  jobTitle,
  cvs,
}: {
  jobId: string;
  jobTitle: string;
  cvs: Cv[];
}) {
  const [open, setOpen] = useState(false);
  const [cvId, setCvId] = useState(cvs[0]?.id ?? "");
  const [coverLetter, setCoverLetter] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  if (!open) {
    return (
      <Button className="w-full sm:w-auto" onClick={() => setOpen(true)}>
        Apply now
      </Button>
    );
  }

  async function send() {
    setPending(true);
    setError(null);
    const result = await callApi<{ id: string }>(
      "/api/v1/candidate/applications",
      {
        method: "POST",
        body: { jobId, cvId, coverLetter },
      },
    );
    if (!result.ok) {
      setPending(false);
      setError(result.message);
      return;
    }
    // Full load so the job page and the header reflect the new application everywhere.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- see comment above
    window.location.assign(
      `/candidate/applications/${result.data.id}?applied=1`,
    );
  }

  return (
    <section
      aria-label={`Apply to ${jobTitle}`}
      className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950"
    >
      <h2 className="text-lg font-semibold">Apply to {jobTitle}</h2>
      {error && <Alert tone="error">{error}</Alert>}
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-sm font-medium">CV</legend>
        {cvs.map((cv) => (
          <label key={cv.id} className="flex items-center gap-3 text-sm">
            <input
              type="radio"
              name="cv"
              value={cv.id}
              checked={cvId === cv.id}
              onChange={() => setCvId(cv.id)}
              className="size-4 accent-zinc-900"
            />
            {cv.originalFilename}
          </label>
        ))}
      </fieldset>
      <TextareaField
        label="Cover letter (optional)"
        value={coverLetter}
        onChange={(e) => setCoverLetter(e.target.value)}
        maxLength={5000}
        hint="A few lines on why you're a good fit."
      />
      <div className="flex flex-wrap gap-3">
        <Button loading={pending} onClick={send}>
          Send application
        </Button>
        <Button
          variant="secondary"
          disabled={pending}
          onClick={() => setOpen(false)}
        >
          Cancel
        </Button>
      </div>
    </section>
  );
}
