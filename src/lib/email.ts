import "server-only";
import nodemailer, { type Transporter } from "nodemailer";
import { env } from "@/lib/env";

export type Email = { to: string; subject: string; text: string; html: string };

let transport: Transporter | undefined;

function getTransport(): Transporter {
  // Locally SMTP_URL points at Mailpit; in production at the provider's SMTP endpoint.
  transport ??= nodemailer.createTransport(env().SMTP_URL);
  return transport;
}

/**
 * Sends a transactional email. Sent inline for now; moves to the background
 * worker (pg-boss) when that lands, so a slow mail server can't slow requests.
 */
export async function sendEmail(email: Email): Promise<void> {
  await getTransport().sendMail({ from: env().EMAIL_FROM, ...email });
}

type Log = {
  info: (obj: object, msg: string) => void;
  error: (obj: object, msg: string) => void;
};

/**
 * Sends after the response, without making the caller wait (D-17): the action it reports on is
 * already committed, so slow or failing mail must never delay or fail the request. Outcome and
 * duration are logged. Retries arrive with the background worker (docs/06-architecture/01-system-architecture.md §5.3).
 */
export function sendEmailInBackground(
  email: Email,
  log: Log,
  label: string,
): void {
  const started = Date.now();
  void sendEmail(email)
    .then(() => log.info({ ms: Date.now() - started }, `${label} email sent`))
    .catch((err: unknown) => log.error({ err }, `${label} email failed`));
}
