"use client";

import { ActionPanel, type PanelAction } from "@/components/action-panel";
import type { CompanyStatus } from "@/generated/prisma/enums";
import {
  ADMIN_TRANSITIONS,
  type AdminCompanyAction,
} from "@/modules/company/rules";

const ACTIONS: Record<
  AdminCompanyAction,
  Omit<PanelAction, "key" | "needsReason">
> = {
  verify: {
    label: "Verify company",
    confirm: "The employer will be able to submit jobs.",
    primary: true,
  },
  reject: {
    label: "Reject",
    confirm: "The employer sees your reason and can edit and resubmit.",
  },
  suspend: {
    label: "Suspend company",
    confirm:
      "All of the company's jobs will be hidden from search. The employer sees your reason.",
  },
  reinstate: {
    label: "Reinstate company",
    confirm: "The company's jobs become visible again.",
    primary: true,
  },
};

/** Admin actions for one company – only those its current status allows (BR §2). */
export function CompanyDecision({
  id,
  status,
}: {
  id: string;
  status: CompanyStatus;
}) {
  const actions = (Object.keys(ADMIN_TRANSITIONS) as AdminCompanyAction[])
    .filter((a) => ADMIN_TRANSITIONS[a].from === status)
    .map((a) => ({
      key: a,
      needsReason: ADMIN_TRANSITIONS[a].needsReason,
      ...ACTIONS[a],
    }));
  return (
    <ActionPanel
      endpoint={`/api/v1/admin/companies/${id}`}
      actions={actions}
      doneHref={(a) => `/admin/companies?done=${a}`}
    />
  );
}
