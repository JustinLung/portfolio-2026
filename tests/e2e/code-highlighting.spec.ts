import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { declaredLanguage, guessLanguage, resolveLanguage } from '../../src/utils/code-language';

test.describe('language detection', () => {
	test('uses a declared language class and never second-guesses it', () => {
		expect(declaredLanguage('wp-block-code language-css')).toBe('css');
		expect(declaredLanguage('lang-js')).toBe('javascript');
		expect(declaredLanguage('language-sh')).toBe('bash');
		expect(declaredLanguage('language-brainfuck')).toBe('text');
		expect(declaredLanguage('wp-block-code')).toBeUndefined();
		expect(resolveLanguage('language-css', 'const a = 1;')).toBe('css');
	});

	test('guesses the languages the blog actually uses', () => {
		expect(guessLanguage('.card {\n  padding: 1rem;\n}')).toBe('css');
		expect(guessLanguage('.button {\n  &.is-disabled {\n    opacity: 0.5;\n  }\n}')).toBe('css');
		expect(guessLanguage('@view-transition {\n  navigation: auto;\n}')).toBe('css');
		expect(guessLanguage('.a {\n  color: var(--x);\n}')).toBe('css');
		expect(guessLanguage('<div id="menu" popover>\n  <a href="/">Home</a>\n</div>')).toBe('html');
		expect(guessLanguage('<button class="btn btn--{{ block.settings.style }}">Go</button>')).toBe(
			'liquid'
		);
		expect(guessLanguage("document.getElementById('a').textContent = 'x';")).toBe('javascript');
		expect(guessLanguage('function open(modal) {\n  modal.showModal();\n}')).toBe('javascript');
		expect(guessLanguage('{"a": [1, 2]}')).toBe('json');
		expect(guessLanguage('pnpm add shiki')).toBe('bash');
	});

	test('leaves file trees, prose, and empty blocks as plain text', () => {
		expect(guessLanguage('sections/\n  hero.liquid\nblocks/\n  _icon.liquid')).toBe('text');
		expect(guessLanguage('Just some words, nothing else.')).toBe('text');
		expect(guessLanguage('  \n ')).toBe('text');
	});
});

/** The first post whose body contains a highlighted code block, or null when none do. */
async function openPostWithCode(page: Page): Promise<boolean> {
	await page.goto('/write');
	const hrefs = await page
		.locator('a[href^="/write/"]')
		.evaluateAll((links) => [...new Set(links.map((link) => link.getAttribute('href')))]);

	for (const href of hrefs) {
		if (!href) continue;
		await page.goto(href);
		if ((await page.locator('.post__content .shiki').count()) > 0) return true;
	}

	return false;
}

const themes = ['ember', 'midnight', 'forest', 'dusk', 'graphite'];
const modes = ['light', 'dark'];

for (const theme of themes) {
	for (const mode of modes) {
		test(`highlighted code in ${theme} ${mode} is colored, copyable, and passes contrast`, async ({
			page
		}) => {
			await page.addInitScript(
				([id, chosenMode]) => {
					localStorage.setItem('portfolio:theme', id);
					localStorage.setItem('portfolio:mode', chosenMode);
				},
				[theme, mode]
			);

			expect(await openPostWithCode(page), 'a post with a highlighted code block').toBe(true);
			await page.waitForLoadState('networkidle');

			const block = page.locator('.post__content .shiki').first();

			// Tokens resolve to more than one color, so the palette variables are actually applied.
			const colors = await block
				.locator('span span')
				.evaluateAll((tokens) => new Set(tokens.map((t) => getComputedStyle(t).color)).size);
			expect(colors).toBeGreaterThan(1);

			// The copy button must still wrap the highlighted block and copy plain code.
			await expect(page.locator('.code-block .shiki').first()).toBeVisible();

			const { violations } = await new AxeBuilder({ page })
				.include('.post__content')
				.withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
				.analyze();

			expect(
				violations.map(({ id, nodes }) => ({
					id,
					targets: nodes.slice(0, 3).map((node) => node.target.join(' '))
				}))
			).toEqual([]);
		});
	}
}
