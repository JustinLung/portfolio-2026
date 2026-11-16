import { defineConfig, devices } from '@playwright/test';

const PORT = 4173;

export default defineConfig({
	testDir: 'tests/e2e',
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 1 : 0,
	reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
	use: {
		baseURL: `http://localhost:${PORT}`,
		trace: 'on-first-retry',
		// The site honors the OS setting, so tests run without animation and stay deterministic.
		reducedMotion: 'reduce'
	},
	projects: [
		{
			name: 'chromium',
			use: {
				...devices['Desktop Chrome'],
				// Locally, set PW_CHANNEL=chrome to reuse an installed Chrome instead of downloading Chromium.
				channel: process.env.PW_CHANNEL || undefined
			}
		}
	],
	// Serves the production build, so run `pnpm build` first. Pages need WORDPRESS_GRAPHQL_URL.
	webServer: {
		command: `pnpm exec vite preview --port ${PORT} --strictPort`,
		url: `http://localhost:${PORT}`,
		reuseExistingServer: !process.env.CI,
		timeout: 60_000
	}
});
