import type { Email } from "@/lib/email";

/** Escapes text for safe use inside HTML (names and URLs come from outside). */
export function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function layout(
  heading: string,
  body: string,
  action: { url: string; label: string },
): string {
  const url = escapeHtml(action.url);
  return `<!doctype html><html><body style="font-family:system-ui,sans-serif;max-width:560px;margin:auto;padding:24px;color:#18181b">
<h1 style="font-size:20px">${escapeHtml(heading)}</h1>
<p>${body}</p>
<p><a href="${url}" style="display:inline-block;background:#18181b;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none">${escapeHtml(action.label)}</a></p>
<p style="font-size:13px;color:#52525b;overflow-wrap:anywhere;word-break:break-all">Or paste this link into your browser:<br>${url}</p>
<p style="font-size:13px;color:#52525b">If you didn't ask for this, you can ignore this email.</p>
</body></html>`;
}

export function verificationEmail(
  to: string,
  name: string,
  url: string,
): Email {
  return {
    to,
    subject: "Confirm your JobConnect email address",
    text: `Hi ${name},\n\nConfirm your email address to finish creating your JobConnect account:\n${url}\n\nThis link expires in 24 hours.\n\nIf you didn't create an account, you can ignore this email.`,
    html: layout(
      "Confirm your email address",
      `Hi ${escapeHtml(name)}, confirm your email to finish creating your JobConnect account. This link expires in 24 hours.`,
      { url, label: "Confirm email address" },
    ),
  };
}

export function resetPasswordEmail(
  to: string,
  name: string,
  url: string,
): Email {
  return {
    to,
    subject: "Reset your JobConnect password",
    text: `Hi ${name},\n\nUse this link to choose a new password:\n${url}\n\nThis link expires in 1 hour. If you didn't ask to reset your password, you can ignore this email – your password stays the same.`,
    html: layout(
      "Reset your password",
      `Hi ${escapeHtml(name)}, use the button below to choose a new password. This link expires in 1 hour.`,
      { url, label: "Choose a new password" },
    ),
  };
}

/**
 * Sent when someone signs up with an email that already has an account. The sign-up
 * screen looks the same either way, so it can't be used to discover who is registered.
 */
export function existingAccountEmail(
  to: string,
  name: string,
  loginUrl: string,
): Email {
  return {
    to,
    subject: "Someone tried to create a JobConnect account with your email",
    text: `Hi ${name},\n\nSomeone (maybe you) tried to create a new JobConnect account with this email address. You already have an account – log in here:\n${loginUrl}\n\nIf that wasn't you, no action is needed.`,
    html: layout(
      "You already have an account",
      `Hi ${escapeHtml(name)}, someone (maybe you) tried to create a new JobConnect account with this email. You already have one.`,
      { url: loginUrl, label: "Log in" },
    ),
  };
}
