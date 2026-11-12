"use client";

import { ActionPanel, type PanelAction } from "@/components/action-panel";
import type { JobStatus } from "@/generated/prisma/enums";
import {
  ADMIN_TRANSITIONS,
  EMPLOYER_TRANSITIONS,
  type AdminJobAction,
  type EmployerJobAction,
} from "@/modules/job/rules";

const EMPLOYER: Record<EmployerJobAction, Omit<PanelAction, "key">> = {
  submit: {
    label: "Submit for approval",
    confirm:
      "Our team reviews the job before it goes live. You can still edit it while you wait.",
    primary: true,
  },
  pause: {
    label: "Pause",
    confirm:
      "The job is hidden from search and nobody can apply until you resume it.",
  },
  resume: {
    label: "Resume",
    confirm: "The job becomes visible in search again.",
    primary: true,
  },
  close: {
    label: "Close job",
    confirm:
      "This is final: the job can't be reopened. You can still manage its applications.",
  },
};

const ADMIN: Record<
  AdminJobAction,
  Omit<PanelAction, "key" | "needsReason">
> = {
  approve: {
    label: "Approve and publish",
    confirm: "The job goes live in search straight away.",
    primary: true,
  },
  reject: {
    label: "Reject",
    confirm:
      "The employer sees your reason, edits the job and submits it again.",
  },
  remove: {
    label: "Remove",
    confirm:
      "This is final: the job is taken down for breaking platform policy. The employer sees your reason.",
  },
};

export function EmployerJobActions({
  id,
  status,
}: {
  id: string;
  status: JobStatus;
}) {
  const actions = (Object.keys(EMPLOYER_TRANSITIONS) as EmployerJobAction[])
    .filter((a) => EMPLOYER_TRANSITIONS[a].from.includes(status))
    .map((a) => ({ key: a, ...EMPLOYER[a] }));
  // Draft-only or rejected jobs have no lifecycle action – "Edit job" is the next step,
  // so show nothing rather than a confusing "No actions available".
  if (actions.length === 0) return null;
  return (
    <ActionPanel
      endpoint={`/api/v1/employer/jobs/${id}`}
      actions={actions}
      doneHref={(a) => `/employer/jobs/${id}?done=${a}`}
    />
  );
}

export function AdminJobActions({
  id,
  status,
}: {
  id: string;
  status: JobStatus;
}) {
  const actions = (Object.keys(ADMIN_TRANSITIONS) as AdminJobAction[])
    .filter((a) => ADMIN_TRANSITIONS[a].from.includes(status))
    .map((a) => ({
      key: a,
      needsReason: ADMIN_TRANSITIONS[a].needsReason,
      ...ADMIN[a],
    }));
  return (
    <ActionPanel
      endpoint={`/api/v1/admin/jobs/${id}`}
      actions={actions}
      doneHref={(a) => `/admin/jobs?done=${a}`}
    />
  );
}
