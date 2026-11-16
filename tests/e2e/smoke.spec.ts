import { expect, test } from '@playwright/test';

const pages = [
	{ path: '/', name: 'home' },
	{ path: '/work', name: 'work' },
	{ path: '/write', name: 'write' },
	{ path: '/about', name: 'about' },
	{ path: '/contact', name: 'contact' },
	{ path: '/privacy-policy', name: 'privacy policy' },
	{ path: '/terms-of-service', name: 'terms of service' }
];

for (const { path, name } of pages) {
	test(`${name} renders`, async ({ page }) => {
		const response = await page.goto(path);

		expect(response?.status()).toBe(200);
		await expect(page.locator('main#main')).toBeVisible();
		await expect(page.getByRole('heading', { level: 1 }).first()).toBeAttached();
	});
}

test('unknown route shows the 404 page', async ({ page }) => {
	const response = await page.goto('/this-page-does-not-exist');

	expect(response?.status()).toBe(404);
	await expect(page.getByRole('heading', { level: 1, name: '404' })).toBeVisible();
});

test('a work case study opens from the work index', async ({ page }) => {
	await page.goto('/work');
	const link = page.locator('main a[href^="/work/"]').first();
	await expect(link).toBeAttached();
	const href = await link.getAttribute('href');

	const response = await page.goto(href!);

	expect(response?.status()).toBe(200);
	await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
});

test('a post opens from the writing index', async ({ page }) => {
	await page.goto('/write');
	const link = page.locator('main a[href^="/write/"]').first();
	await expect(link).toBeAttached();
	const href = await link.getAttribute('href');

	const response = await page.goto(href!);

	expect(response?.status()).toBe(200);
	await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
});

test('command palette opens with the keyboard shortcut', async ({ page }) => {
	await page.goto('/');
	await page.waitForLoadState('networkidle');
	await page.keyboard.press('ControlOrMeta+k');

	await expect(page.getByRole('dialog', { name: 'Command palette' })).toBeVisible();
	await page.keyboard.press('Escape');
	await expect(page.getByRole('dialog', { name: 'Command palette' })).toBeHidden();
});

test('skip link moves focus to the main content', async ({ page }) => {
	await page.goto('/about');
	await page.keyboard.press('Tab');
	await page.getByRole('link', { name: /skip/i }).press('Enter');

	await expect(page.locator('main#main')).toBeFocused();
});

test('web manifest is served and linked', async ({ page, request }) => {
	await page.goto('/');
	await expect(page.locator('link[rel="manifest"]')).toHaveAttribute(
		'href',
		'/manifest.webmanifest'
	);

	const response = await request.get('/manifest.webmanifest');
	expect(response.status()).toBe(200);
	const manifest = await response.json();

	expect(manifest.name).toBeTruthy();
	expect(manifest.start_url).toBe('/');
	for (const icon of manifest.icons) {
		expect((await request.get(icon.src)).status()).toBe(200);
	}
});

test('theme-color follows the selected theme', async ({ page }) => {
	await page.addInitScript(() => localStorage.setItem('portfolio:theme', 'midnight'));
	await page.goto('/');

	const meta = page.locator('meta[name="theme-color"]');
	await expect(meta).toHaveAttribute('content', '#111318');
});
