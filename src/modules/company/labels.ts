import type { CompanyStatus } from "@/generated/prisma/enums";

/** Plain-language status labels (docs/04-design/01-ui-flows.md §5). */
export const COMPANY_STATUS_LABEL: Record<
  CompanyStatus,
  {
    employer: string;
    admin: string;
    tone: "neutral" | "success" | "warning" | "danger";
  }
> = {
  PENDING: { employer: "Being reviewed", admin: "Pending", tone: "warning" },
  VERIFIED: { employer: "Verified", admin: "Verified", tone: "success" },
  REJECTED: { employer: "Changes needed", admin: "Rejected", tone: "danger" },
  SUSPENDED: { employer: "Suspended", admin: "Suspended", tone: "danger" },
};
