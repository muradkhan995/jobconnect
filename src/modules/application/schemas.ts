import { z } from "zod";

/** Apply for a job (FR-CAN-010). */
export const ApplyInput = z.object({
  jobId: z.uuid("Choose a job."),
  cvId: z.uuid("Choose a CV."),
  coverLetter: z
    .string()
    .trim()
    .max(5000, "Cover letter must be at most 5,000 characters.")
    .nullish()
    .transform((v) => (v ? v : null)),
});
export type ApplyInput = z.infer<typeof ApplyInput>;
