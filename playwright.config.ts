import { defineConfig } from '@playwright/test';

export default defineConfig({
	testDir: './e2e',
	timeout: 30000,
	expect: { timeout: 10000 },
	fullyParallel: true,
	retries: 1,
	workers: process.env.CI ? 1 : undefined,
	reporter: 'html',
	use: {
		baseURL: 'http://localhost:4173',
		trace: 'on-first-retry',
		screenshot: 'on',
		video: 'retain-on-failure',
	},
	webServer: {
		// Build with adapter-node for E2E (adapter-vercel can't run locally)
		command: 'ADAPTER=node npm run build && npm run preview',
		port: 4173,
		reuseExistingServer: !process.env.CI,
		timeout: 120000,
	},
});