"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { TextareaField } from "@/components/ui/textarea-field";
import type { CompanyStatus } from "@/generated/prisma/enums";
import { callApi } from "@/lib/client/api";
import {
  ADMIN_TRANSITIONS,
  type AdminCompanyAction,
} from "@/modules/company/rules";

const LABEL: Record<AdminCompanyAction, string> = {
  verify: "Verify company",
  reject: "Reject",
  suspend: "Suspend company",
  reinstate: "Reinstate company",
};

const CONFIRM: Record<AdminCompanyAction, string> = {
  verify: "The employer will be able to submit jobs.",
  reject: "The employer sees your reason and can edit and resubmit.",
  suspend:
    "All of the company's jobs will be hidden from search. The employer sees your reason.",
  reinstate: "The company's jobs become visible again.",
};

/** Admin actions for one company – only those its current status allows (BR §2). */
export function CompanyDecision({
  id,
  status,
}: {
  id: string;
  status: CompanyStatus;
}) {
  const router = useRouter();
  const actions = (
    Object.keys(ADMIN_TRANSITIONS) as AdminCompanyAction[]
  ).filter((a) => ADMIN_TRANSITIONS[a].from === status);
  const [chosen, setChosen] = useState<AdminCompanyAction | null>(null);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | undefined>();
  const [pending, setPending] = useState(false);

  if (actions.length === 0) {
    return (
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        No actions available.
      </p>
    );
  }

  async function confirm(action: AdminCompanyAction) {
    setPending(true);
    setError(null);
    const result = await callApi(`/api/v1/admin/companies/${id}/${action}`, {
      method: "POST",
      body: ADMIN_TRANSITIONS[action].needsReason ? { reason } : {},
    });
    setPending(false);
    if (!result.ok) {
      setError(result.message);
      setFieldError(result.fieldErrors["reason"]);
      return;
    }
    router.push(`/admin/companies?done=${action}`);
    router.refresh();
  }

  if (!chosen) {
    return (
      <div className="flex flex-wrap gap-3">
        {actions.map((a) => (
          <Button
            key={a}
            variant={
              a === "verify" || a === "reinstate" ? "primary" : "secondary"
            }
            onClick={() => setChosen(a)}
          >
            {LABEL[a]}
          </Button>
        ))}
      </div>
    );
  }

  // Confirmation step: final/visible decisions name their consequence (docs/11 P5).
  const needsReason = ADMIN_TRANSITIONS[chosen].needsReason;
  return (
    <div
      className="flex flex-col gap-4"
      role="group"
      aria-label={`Confirm: ${LABEL[chosen]}`}
    >
      {error && <Alert tone="error">{error}</Alert>}
      <p className="text-sm">{CONFIRM[chosen]}</p>
      {needsReason && (
        <TextareaField
          label="Reason (shown to the employer)"
          value={reason}
          onChange={(e) => {
            setReason(e.target.value);
            // Clear stale errors as soon as the admin starts fixing them.
            setFieldError(undefined);
            setError(null);
          }}
          error={fieldError}
          hint="At least 10 characters. Be specific so they can fix it."
          maxLength={1000}
        />
      )}
      <div className="flex flex-wrap gap-3">
        <Button loading={pending} onClick={() => confirm(chosen)}>
          Confirm: {LABEL[chosen]}
        </Button>
        <Button
          variant="secondary"
          disabled={pending}
          onClick={() => setChosen(null)}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}
