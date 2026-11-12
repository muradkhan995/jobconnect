import { expect, test } from "@playwright/test";
import { DEMO_PASSWORD } from "../prisma/demo-users";
import { resetRateLimits } from "./db";
import { MAILPIT, linkFromEmail, shot, waitForEmail } from "./helpers";

// One user journey, step by step: FR-AUTH-001..008 (docs/11 J1/J4 entry points).
test.describe.configure({ mode: "serial" });
test.beforeEach(resetRateLimits);

const run = Date.now();
const email = `qa-${run}@example.com`;
const password = "Velvet-Compass-Orchard-58";
const newPassword = "Copper-Meadow-Lantern-91";

test("01 home page for visitors", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "verified employers",
  );
  await expect(page.getByRole("link", { name: "Sign up" })).toBeVisible();
  await shot(page, "01-home-visitor");
});

test("02–04 sign up as a candidate", async ({ page }) => {
  await page.goto("/register");
  await expect(
    page.getByRole("heading", { name: "Create your account" }),
  ).toBeVisible();
  await shot(page, "02-register-empty");

  await page.getByLabel("I'm looking for a job").check();
  await page.getByLabel("Full name").fill("QA Candidate");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByLabel(/I agree to the/).check();
  await shot(page, "03-register-filled");

  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/check-email/);
  await expect(page.getByText(email)).toBeVisible();
  await shot(page, "04-check-email");
});

test("05 cannot log in before confirming the email (FR-AUTH-006)", async ({
  page,
}) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page.getByRole("main").getByRole("alert")).toContainText(
    "confirm your email",
  );
  await shot(page, "05-login-unverified");
});

test("06–07 confirm the email from the inbox (FR-AUTH-005)", async ({
  page,
}) => {
  const message = await waitForEmail(email, "Confirm your JobConnect email");
  await page.goto(`${MAILPIT}/view/${message.ID}.html`);
  await shot(page, "06-email-confirmation");

  await page.goto(await linkFromEmail(message.ID));
  await expect(page).toHaveURL(/\/login\?verified=1/);
  await expect(page.getByRole("main").getByRole("status")).toContainText(
    "Your email is confirmed",
  );
  await shot(page, "07-email-confirmed");
});

test("08 wrong password shows a generic error", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("not-the-right-password");
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page.getByRole("main").getByRole("alert")).toContainText(
    "don't match",
  );
  await shot(page, "08-login-wrong-password");
});

test("09–10 log in and log out (FR-AUTH-007)", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page.getByText("QA Candidate · Candidate")).toBeVisible();
  await expect(page.getByText("QA Candidate · Candidate")).toBeVisible();
  await shot(page, "09-logged-in-candidate");

  await page.getByRole("button", { name: "Log out" }).click();
  await expect(page.getByRole("link", { name: "Sign up" })).toBeVisible();
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "verified employers",
  );
  await shot(page, "10-logged-out");
});

test("11–14 reset a forgotten password (FR-AUTH-008)", async ({ page }) => {
  await page.goto("/forgot-password");
  await page.getByLabel("Email").fill(email);
  await page.getByRole("button", { name: "Send reset link" }).click();
  await expect(page.getByRole("main").getByRole("status")).toContainText(
    "If an account exists",
  );
  await shot(page, "11-forgot-password-sent");

  const message = await waitForEmail(email, "Reset your JobConnect password");
  await page.goto(`${MAILPIT}/view/${message.ID}.html`);
  await shot(page, "12-email-reset");

  await page.goto(await linkFromEmail(message.ID));
  await expect(page).toHaveURL(/\/reset-password\?token=/);
  await page.getByLabel("New password").fill(newPassword);
  await shot(page, "13-reset-password-form");
  await page.getByRole("button", { name: "Change password" }).click();
  await expect(page.getByRole("main").getByRole("status")).toContainText(
    "Your password has been changed",
  );
  await shot(page, "14-password-changed");

  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(newPassword);
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page.getByText("QA Candidate · Candidate")).toBeVisible();
});

for (const [n, who, label, firstName, home] of [
  ["15", "employer", "David Okafor · Employer", "David", "/employer"],
  ["16", "admin", "Sophie Clarke · Admin", "Sophie", "/admin"],
] as const) {
  test(`${n} demo ${who} can log in and lands on their own home`, async ({
    page,
  }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill(`${who}@demo.jobconnect.local`);
    await page.getByLabel("Password").fill(DEMO_PASSWORD);
    await page.getByRole("button", { name: "Log in" }).click();
    await expect(page).toHaveURL(new RegExp(`${home}$`));
    await expect(page.getByText(label)).toBeVisible();
    await expect(
      page.getByRole("heading", { name: `Welcome, ${firstName}` }),
    ).toBeVisible();
    await shot(page, `${n}-demo-${who}`);
  });
}

test("17 sign-up page on a phone (NFR-UX-001)", async ({ browser }) => {
  const page = await browser.newPage({ viewport: { width: 360, height: 780 } });
  await page.goto("/register");
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > innerWidth,
  );
  expect(overflow).toBe(false); // no sideways scrolling at 360 px
  await shot(page, "17-register-mobile-360px");
  await page.close();
});

test("18 no Content Security Policy violations in the browser (NFR-SEC-005)", async ({
  page,
}) => {
  const violations: string[] = [];
  page.on("console", (m) => {
    if (/Content Security Policy|Refused to/i.test(m.text()))
      violations.push(m.text());
  });
  for (const path of ["/", "/register", "/login", "/forgot-password"]) {
    await page.goto(path);
    await page.waitForLoadState("networkidle");
  }
  expect(violations).toEqual([]);
});
