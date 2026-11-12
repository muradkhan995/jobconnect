import { defineConfig, devices } from "@playwright/test";

/**
 * End-to-end tests in a real browser (MVP acceptance criteria, docs/02-product-strategy/06-mvp-definition.md §5).
 * Needs Postgres and Mailpit: `npm run db:up && npm run db:seed`, then `npm run test:e2e`.
 *
 * Runs against a production build on its own port, not the dev server: the dev server
 * hot-reloads when test artefacts are written into the project and reloads pages mid-test.
 */
const PORT = 3100;
const BASE_URL = `http://localhost:${PORT}`;
export default defineConfig({
  testDir: "e2e",
  globalSetup: "./e2e/global-setup.ts",
  fullyParallel: false,
  workers: 1, // flows share one database and one inbox
  retries: 0,
  reporter: [
    ["list"],
    ["html", { open: "never", outputFolder: "playwright-report" }],
  ],
  use: {
    baseURL: BASE_URL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `npm run build && npx next start -p ${PORT}`,
    url: `${BASE_URL}/api/health`,
    env: {
      // Email links and the auth origin check must point at this server.
      BETTER_AUTH_URL: BASE_URL,
      // No calls to the external breach database: tests must not depend on a third party.
      HIBP_ENABLED: "false",
    },
    stdout: "pipe", // server errors appear in the test output
    reuseExistingServer: false,
    timeout: 300_000,
  },
});
