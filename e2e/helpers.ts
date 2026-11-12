import { expect, type Page } from "@playwright/test";

export const MAILPIT = "http://localhost:8025";

/** Screenshots for the QA report, numbered in the order they are taken. */
export const SHOTS_DIR = "docs/08-testing/qa-reports/screenshots";

export async function shot(page: Page, name: string) {
  await page.screenshot({ path: `${SHOTS_DIR}/${name}.png`, fullPage: true });
}

type MailpitMessage = { ID: string; Subject: string };

/** Waits for the newest email to `to` whose subject contains `subject`. */
export async function waitForEmail(
  to: string,
  subject: string,
): Promise<MailpitMessage> {
  for (let i = 0; i < 50; i++) {
    const res = await fetch(
      `${MAILPIT}/api/v1/search?query=${encodeURIComponent(`to:"${to}"`)}`,
    );
    const { messages } = (await res.json()) as { messages: MailpitMessage[] };
    const match = messages.find((m) => m.Subject.includes(subject));
    if (match) return match;
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error(`No email "${subject}" for ${to}`);
}

/** The first link in the email's text body. */
export async function linkFromEmail(id: string): Promise<string> {
  const res = await fetch(`${MAILPIT}/api/v1/message/${id}`);
  const { Text } = (await res.json()) as { Text: string };
  const url = Text.match(/https?:\/\/\S+/)?.[0];
  if (!url) throw new Error("No link in email");
  return url;
}

/** Logs in through the real login form and waits until we have left it. */
export async function login(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page).not.toHaveURL(/\/login/);
}
