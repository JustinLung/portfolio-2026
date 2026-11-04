import type { Action } from 'svelte/action';

const RESET_MS = 2000;

/**
 * Adds a "Copy" button to every <pre> block inside the node. Needed because the
 * markup arrives via {@html}, so the blocks can't be Svelte components.
 * The button is wrapped in a `.code-block` div so it stays put while the <pre> scrolls.
 */
export const copyCode: Action<HTMLElement, unknown> = (node) => {
	const timers = new Set<ReturnType<typeof setTimeout>>();

	const setup = () => {
		for (const pre of node.querySelectorAll('pre')) {
			if (pre.parentElement?.classList.contains('code-block')) continue;

			const wrapper = document.createElement('div');
			wrapper.className = 'code-block';
			pre.replaceWith(wrapper);
			wrapper.append(pre);

			const button = document.createElement('button');
			button.type = 'button';
			button.className = 'code-block__copy';
			button.textContent = 'Copy';
			button.setAttribute('aria-label', 'Copy code to clipboard');
			wrapper.append(button);

			button.addEventListener('click', async () => {
				const text = (pre.querySelector('code') ?? pre).textContent ?? '';
				try {
					await navigator.clipboard.writeText(text);
					button.textContent = 'Copied';
				} catch {
					button.textContent = 'Failed';
				}
				const timer = setTimeout(() => {
					button.textContent = 'Copy';
					timers.delete(timer);
				}, RESET_MS);
				timers.add(timer);
			});
		}
	};

	setup();

	return {
		update: setup,
		destroy() {
			timers.forEach(clearTimeout);
		}
	};
};
