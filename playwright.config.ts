import { defineConfig } from '@playwright/test';
export default defineConfig({
  forbidOnly: !!process.env.CI,
  workers: process.env.CI ? 1 : undefined,
  webServer: { command: 'pnpm dev', url: 'http://127.0.0.1:5173', reuseExistingServer: !process.env.CI },
  testDir: 'tests/e2e', timeout: 45000, use: {
    baseURL: 'http://127.0.0.1:5173', browserName: 'chromium',
    launchOptions: {
      executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined,
      args: ['--disable-dev-shm-usage', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
    },
  }, projects: [
    { name: 'desktop', use: { viewport: { width: 1440, height: 1000 } } },
    { name: 'mobile', use: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } },
  ],
});
