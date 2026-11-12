import { expect, test } from "@playwright/test";
import { DEMO_PASSWORD } from "../prisma/demo-users";
import { createUser, resetRateLimits, TEST_PASSWORD } from "./db";
import { MAILPIT, login, shot, waitForEmail } from "./helpers";

// Core loop step 1 (docs/02-product-strategy/06-mvp-definition.md §2, docs/04-design/01-ui-flows.md J1 + J2): an employer creates a company, an admin
// rejects it with a reason, the employer fixes it, the admin verifies it.
test.describe.configure({ mode: "serial" });
test.beforeEach(resetRateLimits);

const companyName = `Northwind ${Date.now()}`;
let employer: { email: string; name: string };

test.beforeAll(async () => {
  employer = await createUser("EMPLOYER", "Grace Hopper");
});

test("20–22 employer creates a company profile (FR-EMP-001)", async ({
  page,
}) => {
  await login(page, employer.email, TEST_PASSWORD);
  await expect(page).toHaveURL(/\/employer$/);
  await expect(
    page.getByRole("heading", { name: "Create your company profile" }),
  ).toBeVisible();
  await shot(page, "20-employer-no-company");

  await page.getByRole("link", { name: "Create company profile" }).click();
  await page.getByRole("button", { name: "Submit for verification" }).click();
  await expect(page.getByRole("main").getByRole("alert")).toContainText(
    "check the highlighted",
  );
  await expect(
    page.getByText("Company name must be at least 2 characters."),
  ).toBeVisible();
  await shot(page, "21-company-form-validation");

  await page.getByLabel("Company name").fill(companyName);
  await page
    .getByLabel("About the company")
    .fill(
      "Northwind ships specialist food to independent shops across the North of England.",
    );
  await page
    .getByLabel("Industry")
    .selectOption({ label: "Logistics & Transport" });
  await page
    .getByLabel("Company size")
    .selectOption({ label: "51–200 employees" });
  await page.getByLabel("Location").fill("Leeds");
  await page.getByLabel("Website (optional)").fill("https://northwind.example");
  await page.getByRole("button", { name: "Submit for verification" }).click();

  await expect(page).toHaveURL(/\/employer\?saved=1/);
  await expect(page.getByText("Being reviewed")).toBeVisible();
  await shot(page, "22-company-being-reviewed");
});

test("23–26 admin rejects it with a reason (FR-ADM-007/008)", async ({
  page,
}) => {
  await login(page, "admin@demo.jobconnect.local", DEMO_PASSWORD);
  await expect(page).toHaveURL(/\/admin$/);
  await shot(page, "23-admin-dashboard");

  await page.getByRole("link", { name: "Open the queue" }).click();
  await expect(
    page.getByRole("cell", { name: companyName, exact: true }),
  ).toBeVisible();
  await shot(page, "24-admin-verification-queue");

  await page.getByRole("link", { name: `Review ${companyName}` }).click();
  await expect(page.getByRole("heading", { name: companyName })).toBeVisible();
  await shot(page, "25-admin-review-company");

  await page.getByRole("button", { name: "Reject" }).click();
  await page.getByRole("button", { name: "Confirm: Reject" }).click();
  await expect(
    page.getByText("Reason must be at least 10 characters."),
  ).toBeVisible();
  await page
    .getByLabel("Reason (shown to the employer)")
    .fill(
      "Please add your Companies House registration number to the description.",
    );
  // The old error disappears as soon as the admin edits the reason.
  await expect(
    page.getByText("Reason must be at least 10 characters."),
  ).toBeHidden();
  await shot(page, "26-admin-reject-with-reason");
  await page.getByRole("button", { name: "Confirm: Reject" }).click();
  await expect(page.getByRole("main").getByRole("status")).toContainText(
    "Company rejected",
  );
});

test("27–29 employer sees the reason, is emailed, edits and resubmits", async ({
  page,
}) => {
  const email = await waitForEmail(employer.email, "needs changes");
  await page.goto(`${MAILPIT}/view/${email.ID}.html`);
  await expect(page.getByText("Companies House")).toBeVisible();
  await shot(page, "27-email-company-rejected");

  await login(page, employer.email, TEST_PASSWORD);
  await expect(page.getByText("Changes needed")).toBeVisible();
  await expect(
    page.getByText("Companies House registration number"),
  ).toBeVisible();
  await shot(page, "28-employer-changes-needed");

  await page.getByRole("link", { name: "Edit and resubmit" }).click();
  await expect(page.getByText("Saving sends your company back")).toBeVisible();
  await page
    .getByLabel("About the company")
    .fill(
      "Northwind ships specialist food to independent shops across the North of England. Company number 01234567.",
    );
  await shot(page, "29-employer-edit-and-resubmit");
  await page.getByRole("button", { name: "Save and resubmit" }).click();
  await expect(page.getByText("Being reviewed")).toBeVisible();
});

test("30–31 admin verifies; employer sees Verified", async ({ browser }) => {
  const admin = await browser.newPage();
  await login(admin, "admin@demo.jobconnect.local", DEMO_PASSWORD);
  await admin.goto("/admin/companies");
  await admin.getByRole("link", { name: `Review ${companyName}` }).click();
  await admin.getByRole("button", { name: "Verify company" }).click();
  await admin.getByRole("button", { name: "Confirm: Verify company" }).click();
  await expect(admin.getByRole("main").getByRole("status")).toContainText(
    "Company verified",
  );
  await shot(admin, "30-admin-company-verified");
  await admin.close();

  const page = await browser.newPage();
  await login(page, employer.email, TEST_PASSWORD);
  await expect(page.getByText("Verified", { exact: true })).toBeVisible();
  await shot(page, "31-employer-verified");
  await page.close();
});

test("32 employers can't open admin pages (404)", async ({ page }) => {
  await login(page, employer.email, TEST_PASSWORD);
  const res = await page.goto("/admin/companies");
  expect(res?.status()).toBe(404);
});
