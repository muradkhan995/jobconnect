import { z } from "zod";

const optionalText = (max: number, label: string) =>
  z
    .string()
    .trim()
    .max(max, `${label} must be at most ${max} characters.`)
    .nullish()
    .transform((v) => (v ? v : null));

/** Candidate profile (FR-CAN-001). Shared by the form and the API. */
export const ProfileInput = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Full name must be at least 2 characters.")
    .max(100, "Full name must be at most 100 characters."),
  headline: optionalText(120, "Headline"),
  location: optionalText(80, "Location"),
  phone: z
    .string()
    .trim()
    .nullish()
    .transform((v) => (v ? v : null))
    .refine((v) => v === null || /^[0-9 +()-]{7,20}$/.test(v), {
      message: "Enter a phone number using digits, spaces, + ( ) or -.",
    }),
});
export type ProfileInput = z.infer<typeof ProfileInput>;
