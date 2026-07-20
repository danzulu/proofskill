import { defineConfig } from "@playwright/test";

const externalBaseUrl = process.env.E2E_BASE_URL;
const localBaseUrl = "http://localhost:3000";

export default defineConfig({
  testDir: "./tests/e2e",
  webServer: externalBaseUrl
    ? undefined
    : {
        command: "npm run dev",
        url: localBaseUrl,
        timeout: 120 * 1000,
        reuseExistingServer: !process.env.CI,
      },
  use: {
    baseURL: externalBaseUrl || localBaseUrl,
    trace: "retain-on-failure",
  },
});

