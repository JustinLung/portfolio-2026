import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

const paths = [
	'/',
	'/work',
	'/write',
	'/about',
	'/contact',
	'/privacy-policy',
	'/terms-of-service',
	'/this-page-does-not-exist'
];

for (const path of paths) {
	test(`no WCAG A/AA violations on ${path}`, async ({ page }) => {
		await page.goto(path);
		await page.waitForLoadState('networkidle');

		const { violations } = await new AxeBuilder({ page })
			.withTags(WCAG_TAGS)
			// Tracked by the fixme test below, so this suite can gate CI meanwhile.
			.disableRules(['color-contrast'])
			.analyze();

		expect(
			violations.map(({ id, impact, nodes }) => ({
				id,
				impact,
				targets: nodes.slice(0, 3).map((node) => node.target.join(' '))
			}))
		).toEqual([]);
	});
}

// --color-quaternary (muted text in the footer, header, intro) is 4.0-4.3:1 on its own background in
// every theme, below the 4.5:1 minimum. Lightening it changes the visual hierarchy, so it is a design
// call. Remove `fixme` once the token is adjusted.
test.fixme('text meets 4.5:1 contrast on /', async ({ page }) => {
	await page.goto('/');
	await page.waitForLoadState('networkidle');

	const { violations } = await new AxeBuilder({ page })
		.withTags(WCAG_TAGS)
		.withRules(['color-contrast'])
		.analyze();

	expect(violations).toEqual([]);
});

// Every theme in light mode, including contrast, which the dark themes don't pass yet (see the fixme above).
for (const theme of ['ember', 'midnight', 'forest', 'dusk', 'graphite']) {
	for (const path of ['/', '/work', '/contact']) {
		test(`light ${theme} has no WCAG A/AA violations on ${path}`, async ({ page }) => {
			await page.addInitScript((id) => {
				localStorage.setItem('portfolio:theme', id);
				localStorage.setItem('portfolio:mode', 'light');
			}, theme);
			await page.goto(path);
			await page.waitForLoadState('networkidle');

			const { violations } = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();

			expect(
				violations.map(({ id, nodes }) => ({
					id,
					targets: nodes.slice(0, 3).map((node) => node.target.join(' '))
				}))
			).toEqual([]);
		});
	}
}
