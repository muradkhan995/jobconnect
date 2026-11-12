import { z } from "zod";

export const COMPANY_SIZES = [
  "SIZE_1_10",
  "SIZE_11_50",
  "SIZE_51_200",
  "SIZE_201_500",
  "SIZE_500_PLUS",
] as const;

export const COMPANY_SIZE_LABEL: Record<
  (typeof COMPANY_SIZES)[number],
  string
> = {
  SIZE_1_10: "1–10 employees",
  SIZE_11_50: "11–50 employees",
  SIZE_51_200: "51–200 employees",
  SIZE_201_500: "201–500 employees",
  SIZE_500_PLUS: "500+ employees",
};

const trimmed = (min: number, max: number, label: string) =>
  z
    .string()
    .trim()
    .min(min, `${label} must be at least ${min} characters.`)
    .max(max, `${label} must be at most ${max} characters.`);

/** Company profile input (FR-EMP-001/003). Used by the form and the API. */
export const CompanyInput = z.object({
  name: trimmed(2, 120, "Company name"),
  description: trimmed(30, 5000, "Description"),
  industryId: z.uuid("Choose an industry."),
  size: z.enum(COMPANY_SIZES, "Choose a company size."),
  location: trimmed(2, 120, "Location"),
  website: z
    .string()
    .trim()
    .max(300)
    .transform((v) => (v === "" ? null : v))
    .nullable()
    .refine((v) => v === null || /^https:\/\/[^\s/$.?#].[^\s]*$/i.test(v), {
      message: "Website must start with https://",
    })
    .optional()
    .transform((v) => v ?? null),
});
export type CompanyInput = z.infer<typeof CompanyInput>;

/** Reasons are shown to the employer (BR-CMP-002). */
export const ReasonInput = z.object({
  reason: trimmed(10, 1000, "Reason"),
});
