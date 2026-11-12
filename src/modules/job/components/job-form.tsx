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
  EXPERIENCE_LABEL,
  EXPERIENCE_LEVELS,
  JOB_TYPES,
  JOB_TYPE_LABEL,
  JobInput,
  SALARY_PERIODS,
  SALARY_PERIOD_LABEL,
  WORK_MODES,
  WORK_MODE_LABEL,
} from "@/modules/job/schemas";

type Initial = Partial<Record<keyof JobInput, string | number | null>>;
type JobFormProps = {
  jobId?: string;
  initial: Initial;
  industries: { id: string; name: string }[];
  /** Shown above the button, e.g. "saving title changes sends the job back for approval". */
  notice?: string;
};

const options = <K extends string>(
  keys: readonly K[],
  labels: Record<K, string>,
) => keys.map((k) => ({ value: k, label: labels[k] }));

export function JobForm({ jobId, initial, industries, notice }: JobFormProps) {
  const router = useRouter();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [workMode, setWorkMode] = useState(String(initial.workMode ?? ""));

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = JobInput.safeParse(
      Object.fromEntries(new FormData(event.currentTarget)),
    );
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
    const result = await callApi<{ id: string }>(
      jobId ? `/api/v1/employer/jobs/${jobId}` : "/api/v1/employer/jobs",
      { method: jobId ? "PATCH" : "POST", body: parsed.data },
    );
    setPending(false);
    if (!result.ok) {
      setErrors(result.fieldErrors);
      setMessage(result.message);
      return;
    }
    router.push(
      `/employer/jobs/${result.data.id}?done=${jobId ? "saved" : "created"}`,
    );
    router.refresh();
  }

  const value = (k: keyof JobInput) =>
    initial[k] === null || initial[k] === undefined ? "" : String(initial[k]);

  return (
    <form
      onSubmit={onSubmit}
      onChange={(e) => {
        const t = e.target;
        if (
          (t instanceof HTMLInputElement ||
            t instanceof HTMLSelectElement ||
            t instanceof HTMLTextAreaElement) &&
          errors[t.name]
        ) {
          setErrors((prev) => {
            const next = { ...prev };
            delete next[t.name];
            return next;
          });
        }
      }}
      className="flex flex-col gap-5"
      noValidate
    >
      {message && <Alert tone="error">{message}</Alert>}
      <TextField
        label="Job title"
        name="title"
        defaultValue={value("title")}
        error={errors["title"]}
        maxLength={120}
      />
      <TextareaField
        label="About the role"
        name="description"
        defaultValue={value("description")}
        error={errors["description"]}
        hint="What the job involves and why it's great. At least 50 characters."
        maxLength={10000}
        rows={8}
      />
      <TextareaField
        label="Requirements"
        name="requirements"
        defaultValue={value("requirements")}
        error={errors["requirements"]}
        hint="Skills and experience needed."
        maxLength={5000}
      />
      <div className="grid gap-5 sm:grid-cols-2">
        <SelectField
          label="Work mode"
          name="workMode"
          value={workMode}
          onChange={(e) => setWorkMode(e.target.value)}
          placeholder="Choose…"
          options={options(WORK_MODES, WORK_MODE_LABEL)}
          error={errors["workMode"]}
        />
        <TextField
          label={workMode === "REMOTE" ? "Location (optional)" : "Location"}
          name="location"
          defaultValue={value("location")}
          error={errors["location"]}
          hint={
            workMode === "REMOTE"
              ? "Leave empty for fully remote."
              : "City or area."
          }
        />
      </div>
      <div className="grid gap-5 sm:grid-cols-3">
        <SelectField
          label="Job type"
          name="jobType"
          defaultValue={value("jobType")}
          placeholder="Choose…"
          options={options(JOB_TYPES, JOB_TYPE_LABEL)}
          error={errors["jobType"]}
        />
        <SelectField
          label="Experience level"
          name="experienceLevel"
          defaultValue={value("experienceLevel")}
          placeholder="Choose…"
          options={options(EXPERIENCE_LEVELS, EXPERIENCE_LABEL)}
          error={errors["experienceLevel"]}
        />
        <SelectField
          label="Industry"
          name="industryId"
          defaultValue={value("industryId")}
          placeholder="Choose…"
          options={industries.map((i) => ({ value: i.id, label: i.name }))}
          error={errors["industryId"]}
        />
      </div>
      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-medium">Salary (GBP, required)</legend>
        <div className="grid gap-5 sm:grid-cols-3">
          <TextField
            label="Minimum (£)"
            name="salaryMin"
            inputMode="numeric"
            defaultValue={value("salaryMin")}
            error={errors["salaryMin"]}
          />
          <TextField
            label="Maximum (£)"
            name="salaryMax"
            inputMode="numeric"
            defaultValue={value("salaryMax")}
            error={errors["salaryMax"]}
          />
          <SelectField
            label="Paid"
            name="salaryPeriod"
            defaultValue={value("salaryPeriod") || "YEAR"}
            options={options(SALARY_PERIODS, SALARY_PERIOD_LABEL)}
            error={errors["salaryPeriod"]}
          />
        </div>
      </fieldset>
      <TextField
        label="Closing date"
        name="deadline"
        type="date"
        defaultValue={value("deadline")}
        error={errors["deadline"]}
        hint="Applications close at the end of this day. When you submit, it must be 1–90 days away."
        className="sm:max-w-xs"
      />
      {notice && <Alert tone="info">{notice}</Alert>}
      <Button type="submit" loading={pending} className="self-start">
        {jobId ? "Save changes" : "Save as draft"}
      </Button>
    </form>
  );
}
