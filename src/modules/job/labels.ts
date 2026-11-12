import type { JobStatus } from "@/generated/prisma/enums";
import { SALARY_PERIOD_LABEL } from "./schemas";

type Tone = "neutral" | "success" | "warning" | "danger";

/** Plain-language job status labels (docs/04-design/01-ui-flows.md §5.2). */
export const JOB_STATUS_LABEL: Record<
  JobStatus,
  { employer: string; admin: string; tone: Tone }
> = {
  DRAFT: { employer: "Draft", admin: "Draft", tone: "neutral" },
  PENDING_APPROVAL: {
    employer: "Waiting for approval",
    admin: "Pending",
    tone: "warning",
  },
  PUBLISHED: { employer: "Live", admin: "Published", tone: "success" },
  PAUSED: { employer: "Paused", admin: "Paused", tone: "neutral" },
  REJECTED: { employer: "Changes needed", admin: "Rejected", tone: "danger" },
  CLOSED: { employer: "Closed", admin: "Closed", tone: "neutral" },
  REMOVED: {
    employer: "Removed by JobConnect",
    admin: "Removed",
    tone: "danger",
  },
};

const gbp = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
  maximumFractionDigits: 0,
});

/** "£40,000 – £50,000 per year" */
export function formatSalary(
  min: number,
  max: number,
  period: keyof typeof SALARY_PERIOD_LABEL,
): string {
  const range =
    min === max ? gbp.format(min) : `${gbp.format(min)} – ${gbp.format(max)}`;
  return `${range} ${SALARY_PERIOD_LABEL[period]}`;
}

/** "Closes 30 Nov 2026" – the deadline is the end of that day (UTC). */
export function formatDeadline(deadline: Date): string {
  return deadline.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}
