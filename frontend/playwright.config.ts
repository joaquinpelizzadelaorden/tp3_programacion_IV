import { defineConfig, devices } from '@playwright/test'

const apiUrl = 'http://127.0.0.1:3000'
const frontendUrl = 'http://127.0.0.1:5173'

export default defineConfig({
  testDir: './e2e',
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: 'list',
  use: {
    baseURL: frontendUrl,
    trace: 'retain-on-failure',
    ...devices['Desktop Chrome'],
  },
  webServer: [
    {
      command: 'npm start',
      cwd: '..',
      url: `${apiUrl}/productos`,
      reuseExistingServer: false,
      timeout: 30_000,
      env: { NODE_ENV: 'test', PORT: '3000', CORS_ORIGIN: frontendUrl },
    },
    {
      command: 'npm run dev -- --host 127.0.0.1',
      url: frontendUrl,
      reuseExistingServer: !process.env.CI,
      timeout: 30_000,
      env: { VITE_API_URL: apiUrl },
    },
  ],
})
