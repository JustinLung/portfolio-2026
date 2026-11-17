import type { Action } from 'svelte/action';
import { showToast } from '$lib/toast.svelte';
import { SITE_URL } from '../../utils/site';

/**
 * Adds a "copy link to this section" button to every `h2`/`h3` that has an `id` inside the node.
 * Needed because the markup arrives via {@html}. Headings get their ids from `addHeadingAnchors`.
 * Copies the canonical URL, so a preview deployment's address is never shared.
 */
export const headingLinks: Action<HTMLElement, unknown> = (node) => {
	const setup = () => {
		for (const heading of node.querySelectorAll<HTMLElement>('h2[id], h3[id]')) {
			if (heading.querySelector('.heading-link')) continue;

			const text = heading.textContent?.trim() ?? '';
			const button = document.createElement('button');
			button.type = 'button';
			button.className = 'heading-link';
			button.textContent = '#';
			button.setAttribute('aria-label', `Copy link to section: ${text}`);

			button.addEventListener('click', async () => {
				const url = new URL(`${location.pathname}#${heading.id}`, SITE_URL).href;

				try {
					await navigator.clipboard.writeText(url);
					showToast('Link to section copied');
				} catch {
					showToast('Could not copy the link', 'error');
				}
			});

			heading.append(' ', button);
		}
	};

	setup();

	return { update: setup };
};
