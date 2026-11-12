import type { Email } from "@/lib/email";
import { escapeHtml } from "@/modules/auth/emails";

type Outcome = "approved" | "rejected" | "removed";

const SUBJECT: Record<Outcome, string> = {
  approved: "Your job is live on JobConnect",
  rejected: "Your job advert needs changes",
  removed: "Your job advert was removed from JobConnect",
};

const BODY: Record<Outcome, string> = {
  approved: "has been approved and is now live.",
  rejected: "was not approved. Please edit it and submit it again.",
  removed: "was removed because it breaks our platform policy.",
};

/** FR-ADM-010/011: the employer is told the outcome and, where given, the reason. */
export function jobDecisionEmail(args: {
  to: string;
  name: string;
  jobTitle: string;
  outcome: Outcome;
  reason: string | null;
  url: string;
}): Email {
  const sentence = `Your job "${args.jobTitle}" ${BODY[args.outcome]}`;
  return {
    to: args.to,
    subject: SUBJECT[args.outcome],
    text: `Hi ${args.name},\n\n${sentence}${args.reason ? `\n\nReason: ${args.reason}` : ""}\n\n${args.url}`,
    html: `<!doctype html><html><body style="font-family:system-ui,sans-serif;max-width:560px;margin:auto;padding:24px;color:#18181b">
<p>Hi ${escapeHtml(args.name)},</p>
<p>${escapeHtml(sentence)}</p>
${args.reason ? `<p style="border-left:3px solid #d4d4d8;padding-left:12px"><strong>Reason:</strong> ${escapeHtml(args.reason)}</p>` : ""}
<p><a href="${escapeHtml(args.url)}" style="display:inline-block;background:#18181b;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none">Open the job</a></p>
</body></html>`,
  };
}
