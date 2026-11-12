import { z } from "zod";

export const WORK_MODES = ["ON_SITE", "HYBRID", "REMOTE"] as const;
export const JOB_TYPES = [
  "FULL_TIME",
  "PART_TIME",
  "CONTRACT",
  "TEMPORARY",
  "INTERNSHIP",
] as const;
export const EXPERIENCE_LEVELS = [
  "ENTRY",
  "JUNIOR",
  "MID",
  "SENIOR",
  "LEAD",
] as const;
export const SALARY_PERIODS = ["YEAR", "DAY", "HOUR"] as const;

export const WORK_MODE_LABEL = {
  ON_SITE: "On-site",
  HYBRID: "Hybrid",
  REMOTE: "Remote",
} as const;
export const JOB_TYPE_LABEL = {
  FULL_TIME: "Full-time",
  PART_TIME: "Part-time",
  CONTRACT: "Contract",
  TEMPORARY: "Temporary",
  INTERNSHIP: "Internship",
} as const;
export const EXPERIENCE_LABEL = {
  ENTRY: "Entry level",
  JUNIOR: "Junior",
  MID: "Mid-level",
  SENIOR: "Senior",
  LEAD: "Lead",
} as const;
export const SALARY_PERIOD_LABEL = {
  YEAR: "per year",
  DAY: "per day",
  HOUR: "per hour",
} as const;

const text = (min: number, max: number, label: string) =>
  z
    .string()
    .trim()
    .min(min, `${label} must be at least ${min} characters.`)
    .max(max, `${label} must be at most ${max} characters.`);

const money = (label: string) =>
  z.coerce
    .number(`${label} must be a number.`)
    .int(`${label} must be a whole number of pounds.`)
    .min(0, `${label} can't be negative.`)
    .max(10_000_000, `${label} looks too high.`);

/** YYYY-MM-DD from a date input. */
const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a closing date.");

/** True when none of `fields` has an issue yet, so a cross-field check can safely read them. */
function fieldsValid(
  payload: { issues: readonly { path?: readonly PropertyKey[] }[] },
  fields: string[],
) {
  return !payload.issues.some((i) => fields.includes(String(i.path?.[0])));
}

/** Job advert input (FR-EMP-006/009). Used by the form and the API. */
export const JobInput = z
  .object({
    title: text(3, 120, "Job title"),
    description: text(50, 10_000, "Description"),
    requirements: text(20, 5_000, "Requirements"),
    workMode: z.enum(WORK_MODES, "Choose a work mode."),
    location: z
      .string()
      .trim()
      .max(120, "Location must be at most 120 characters.")
      .nullish()
      .transform((v) => (v ? v : null)),
    jobType: z.enum(JOB_TYPES, "Choose a job type."),
    experienceLevel: z.enum(EXPERIENCE_LEVELS, "Choose an experience level."),
    industryId: z.uuid("Choose an industry."),
    salaryMin: money("Minimum salary"),
    salaryMax: money("Maximum salary"),
    salaryPeriod: z.enum(SALARY_PERIODS, "Choose a salary period."),
    deadline: isoDate,
  })
  // Cross-field rules run as soon as the fields they read are valid – even while other fields
  // still have errors – so the form shows every problem at once instead of revealing new ones
  // after the user fixes the first batch.
  .refine(
    (v) =>
      v.workMode === "REMOTE" ||
      (v.location !== null && v.location.length >= 2),
    {
      path: ["location"],
      message: "Add a location (or choose Remote).", // BR-JOB-010
      when: (payload) => fieldsValid(payload, ["workMode", "location"]),
    },
  )
  .refine((v) => v.salaryMax >= v.salaryMin, {
    path: ["salaryMax"],
    message: "Maximum salary must be at least the minimum.", // BR-JOB-003
    when: (payload) => fieldsValid(payload, ["salaryMin", "salaryMax"]),
  });
export type JobInput = z.infer<typeof JobInput>;
