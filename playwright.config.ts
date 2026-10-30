import { defineConfig, devices } from '@playwright/test';

// `npm run e2e` builds first, so these tests run against the production
// build. It is served under a sub-path, as GitHub Pages does, so any URL that
// ignores the './' base fails here before it fails on the live site.
const PORT = 4174;
const BASE_PATH = '/trace-khmer-alphabets/';

export default defineConfig({
  testDir: 'tests',
  testMatch: '**/*.spec.ts',
  forbidOnly: !!process.env.CI,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: `http://localhost:${PORT}${BASE_PATH}`,
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'android-chrome', use: { ...devices['Pixel 7'] } },
    { name: 'iphone-safari', use: { ...devices['iPhone 15'] } },
  ],
  webServer: {
    command: `npm run preview -- --base ${BASE_PATH} --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}${BASE_PATH}`,
    reuseExistingServer: false,
  },
});
