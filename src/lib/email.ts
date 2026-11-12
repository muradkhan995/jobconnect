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
