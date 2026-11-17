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

for (const path of ['/', '/work', '/write', '/about']) {
	test(`CMS images on ${path} are responsive`, async ({ page }) => {
		await page.goto(path);
		await page.waitForLoadState('networkidle');

		const images = await page
			.locator('main img[src*="/wp-content/uploads/"]')
			.evaluateAll((nodes) =>
				nodes.map((node) => {
					const img = node as HTMLImageElement;
					return {
						src: img.currentSrc,
						srcset: img.getAttribute('srcset'),
						sizes: img.getAttribute('sizes'),
						width: img.getAttribute('width'),
						height: img.getAttribute('height')
					};
				})
			);

		for (const image of images) {
			expect(image.srcset, image.src).toBeTruthy();
			expect(image.sizes, image.src).toBeTruthy();
			expect(image.width, image.src).toBeTruthy();
			expect(image.height, image.src).toBeTruthy();
		}
	});
}

test.describe('command palette actions', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/');
		await page.waitForLoadState('networkidle');
		await page.keyboard.press('ControlOrMeta+k');
		await expect(page.getByRole('dialog', { name: 'Command palette' })).toBeVisible();
	});

	test('Download CV starts a PDF download', async ({ page }) => {
		const download = page.waitForEvent('download');
		await page.getByRole('combobox', { name: 'Search commands' }).fill('download cv');
		await page.keyboard.press('Enter');

		expect((await download).suggestedFilename()).toMatch(/\.pdf$/);
	});

	test('Copy email address copies and announces it', async ({ page, context }) => {
		await context.grantPermissions(['clipboard-read', 'clipboard-write']);
		await page.getByRole('combobox', { name: 'Search commands' }).fill('copy email');
		await page.keyboard.press('Enter');

		await expect(
			page.getByRole('status').filter({ hasText: 'Email address copied' })
		).toBeVisible();
		expect(await page.evaluate(() => navigator.clipboard.readText())).toMatch(/^[^@\s]+@[^@\s]+$/);
	});

	test('Open RSS feed opens the feed in a new tab', async ({ page, context }) => {
		const popup = context.waitForEvent('page');
		await page.getByRole('combobox', { name: 'Search commands' }).fill('rss');
		await page.keyboard.press('Enter');

		expect((await popup).url()).toContain('/rss.xml');
	});
});

test.describe('toasts', () => {
	const run = async (page: import('@playwright/test').Page, query: string) => {
		await page.keyboard.press('ControlOrMeta+k');
		await page.getByRole('combobox', { name: 'Search commands' }).fill(query);
		await page.keyboard.press('Enter');
		await expect(page.getByRole('dialog', { name: 'Command palette' })).toBeHidden();
		// The palette's own `open` state updates a tick after the dialog closes; reopening in that tick is ignored.
		await page.waitForTimeout(150);
	};

	test('a command shows a toast that dismisses itself', async ({ page }) => {
		await page.goto('/');
		await page.waitForLoadState('networkidle');
		await run(page, 'download cv');

		const toast = page.locator('.toast', { hasText: 'CV download started' });
		await expect(toast).toBeVisible();
		await expect(toast).toBeHidden({ timeout: 8000 });
	});

	test('the same message replaces itself instead of stacking', async ({ page }) => {
		await page.goto('/');
		await page.waitForLoadState('networkidle');
		await run(page, 'sound');
		await run(page, 'sound');
		await run(page, 'sound');

		// Sound on/off alternate, so at most two distinct messages can be showing.
		expect(await page.locator('.toast').count()).toBeLessThanOrEqual(2);
	});

	test('a blocked clipboard shows an error toast with the address', async ({ page }) => {
		await page.addInitScript(() => {
			Object.defineProperty(navigator, 'clipboard', {
				value: { writeText: () => Promise.reject(new Error('blocked')) }
			});
		});
		await page.goto('/');
		await page.waitForLoadState('networkidle');
		await run(page, 'copy email');

		await expect(page.locator('.toast--error', { hasText: /@/ })).toBeVisible();
	});

	test('the Toaster is the only status region added outside the palette', async ({ page }) => {
		await page.goto('/about');
		await expect(page.locator('main [role="status"]')).toHaveCount(0);
		await expect(page.locator('.toaster[role="status"]')).toHaveCount(1);
	});
});

test.describe('error page', () => {
	test('404 suggests content and clears the header on a phone', async ({ page }) => {
		await page.setViewportSize({ width: 390, height: 700 });
		await page.goto('/nothing-here');

		await expect(
			page.getByRole('navigation', { name: 'Maybe you were looking for' })
		).toBeVisible();
		const heading = await page.getByRole('heading', { level: 1, name: '404' }).boundingBox();
		const header = await page.locator('header').first().boundingBox();
		expect(heading!.y).toBeGreaterThanOrEqual(header!.y + header!.height);
	});
});

test.describe('writing', () => {
	test('a post shows reading time and older/newer links when neighbours exist', async ({
		page
	}) => {
		await page.goto('/write');
		const hrefs = await page
			.locator('main a[href^="/write/"]')
			.evaluateAll((nodes) => [...new Set(nodes.map((n) => n.getAttribute('href')!))]);
		test.skip(hrefs.length === 0, 'No posts in the CMS');

		await page.goto(hrefs[0]);
		await expect(page.getByText(/\d+ min read/)).toBeVisible();

		if (hrefs.length > 1) {
			await expect(page.getByRole('navigation', { name: 'More posts' })).toBeVisible();
		}
	});

	test('a section link copies a URL with the heading anchor', async ({ page, context }) => {
		await context.grantPermissions(['clipboard-read', 'clipboard-write']);
		await page.goto('/write');
		const hrefs = await page
			.locator('main a[href^="/write/"]')
			.evaluateAll((nodes) => [...new Set(nodes.map((n) => n.getAttribute('href')!))]);

		let found = false;
		for (const href of hrefs) {
			await page.goto(href);
			if ((await page.locator('.post__content .heading-link').count()) > 0) {
				found = true;
				break;
			}
		}
		test.skip(!found, 'No post with headings in the CMS');

		await page.locator('.post__content .heading-link').first().click();
		await expect(page.locator('.toast', { hasText: 'Link to section copied' })).toBeVisible();
		expect(await page.evaluate(() => navigator.clipboard.readText())).toMatch(/^https:\/\/.+#.+/);
	});
});
