"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { TextareaField } from "@/components/ui/textarea-field";
import { callApi } from "@/lib/client/api";

export type PanelAction = {
  key: string;
  label: string;
  /** Names the consequence before anything happens (docs/04-design/01-ui-flows.md P5). */
  confirm: string;
  needsReason?: boolean;
  primary?: boolean;
};

/**
 * Lifecycle actions for one record: choose → confirm (with a reason where required) → POST
 * `${endpoint}/${action}` → go to `doneHref(action)`. Only pass actions the current status allows.
 */
export function ActionPanel({
  endpoint,
  actions,
  doneHref,
  reasonLabel = "Reason (shown to the employer)",
}: {
  endpoint: string;
  actions: PanelAction[];
  doneHref: (action: string) => string;
  reasonLabel?: string;
}) {
  const router = useRouter();
  const [chosen, setChosen] = useState<PanelAction | null>(null);
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

  async function run(action: PanelAction) {
    setPending(true);
    setError(null);
    const result = await callApi(`${endpoint}/${action.key}`, {
      method: "POST",
      body: action.needsReason ? { reason } : {},
    });
    setPending(false);
    if (!result.ok) {
      setError(result.message);
      setFieldError(result.fieldErrors["reason"]);
      return;
    }
    router.push(doneHref(action.key));
    router.refresh();
  }

  if (!chosen) {
    return (
      <div className="flex flex-wrap gap-3">
        {actions.map((a) => (
          <Button
            key={a.key}
            variant={a.primary ? "primary" : "secondary"}
            onClick={() => setChosen(a)}
          >
            {a.label}
          </Button>
        ))}
      </div>
    );
  }

  return (
    <div
      className="flex flex-col gap-4"
      role="group"
      aria-label={`Confirm: ${chosen.label}`}
    >
      {error && <Alert tone="error">{error}</Alert>}
      <p className="text-sm">{chosen.confirm}</p>
      {chosen.needsReason && (
        <TextareaField
          label={reasonLabel}
          value={reason}
          onChange={(e) => {
            setReason(e.target.value);
            setFieldError(undefined); // stale errors disappear as soon as they are being fixed
            setError(null);
          }}
          error={fieldError}
          hint="At least 10 characters. Be specific so they can fix it."
          maxLength={1000}
        />
      )}
      <div className="flex flex-wrap gap-3">
        <Button loading={pending} onClick={() => run(chosen)}>
          Confirm: {chosen.label}
        </Button>
        <Button
          variant="secondary"
          disabled={pending}
          onClick={() => {
            setChosen(null);
            setError(null);
          }}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}
