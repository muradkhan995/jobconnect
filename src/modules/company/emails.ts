import type { Email } from "@/lib/email";
import { escapeHtml } from "@/modules/auth/emails";

type Outcome = "verified" | "rejected" | "suspended" | "reinstated";

const SUBJECT: Record<Outcome, string> = {
  verified: "Your company is verified on JobConnect",
  rejected: "Your company profile needs changes",
  suspended: "Your company has been suspended on JobConnect",
  reinstated: "Your company has been reinstated on JobConnect",
};

const BODY: Record<Outcome, string> = {
  verified: "is verified. You can now submit jobs for approval.",
  rejected:
    "was not verified. Please update your profile and it will be reviewed again.",
  suspended: "has been suspended. Its jobs are hidden from search.",
  reinstated: "has been reinstated. Its jobs are visible again.",
};

/** FR-ADM-008: the employer is told the outcome – and the reason, when there is one. */
export function companyDecisionEmail(args: {
  to: string;
  name: string;
  companyName: string;
  outcome: Outcome;
  reason: string | null;
  url: string;
}): Email {
  const sentence = `Your company "${args.companyName}" ${BODY[args.outcome]}`;
  const reasonText = args.reason ? `\n\nReason: ${args.reason}` : "";
  return {
    to: args.to,
    subject: SUBJECT[args.outcome],
    text: `Hi ${args.name},\n\n${sentence}${reasonText}\n\n${args.url}`,
    html: `<!doctype html><html><body style="font-family:system-ui,sans-serif;max-width:560px;margin:auto;padding:24px;color:#18181b">
<p>Hi ${escapeHtml(args.name)},</p>
<p>${escapeHtml(sentence)}</p>
${args.reason ? `<p style="border-left:3px solid #d4d4d8;padding-left:12px"><strong>Reason:</strong> ${escapeHtml(args.reason)}</p>` : ""}
<p><a href="${escapeHtml(args.url)}" style="display:inline-block;background:#18181b;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none">Open your company page</a></p>
</body></html>`,
  };
}
