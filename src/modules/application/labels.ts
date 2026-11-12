import type { ApplicationStatus } from "@/generated/prisma/enums";

type Tone = "neutral" | "success" | "warning" | "danger";

/** Plain-language application labels (docs/04-design/01-ui-flows.md §5.1). "Not selected" is softer for candidates. */
export const APPLICATION_STATUS_LABEL: Record<
  ApplicationStatus,
  { candidate: string; employer: string; tone: Tone }
> = {
  APPLIED: { candidate: "Application sent", employer: "New", tone: "neutral" },
  UNDER_REVIEW: {
    candidate: "Under review",
    employer: "Under review",
    tone: "warning",
  },
  SHORTLISTED: {
    candidate: "Shortlisted",
    employer: "Shortlisted",
    tone: "success",
  },
  INTERVIEW: {
    candidate: "Interview stage",
    employer: "Interview",
    tone: "success",
  },
  OFFERED: { candidate: "Offer made", employer: "Offered", tone: "success" },
  REJECTED: { candidate: "Not selected", employer: "Rejected", tone: "danger" },
  WITHDRAWN: {
    candidate: "Withdrawn",
    employer: "Withdrawn by candidate",
    tone: "neutral",
  },
};
