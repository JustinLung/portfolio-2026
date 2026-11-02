<script lang="ts">
	import gsap from 'gsap';
	import { untrack } from 'svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { readReducedMotion } from '$lib/settings.svelte';
	import { lockScroll } from '$lib/scroll-lock';
	import { playSfx, sfxState, toggleSfx } from '$lib/sfx.svelte';
	import TerminalIcon from '$lib/assets/icons/terminal.svg?component';
	import { setTheme, themes, themeState } from '$lib/theme.svelte';
	import { links, policyLinks } from '../../../../utils/links';
	import type { Command, SearchEntry, SearchIndex } from '../../../../utils/types';

	interface Props {
		/** Whether the palette is showing. Bind to it so other controls can open it. */
		open?: boolean;
	}

	let { open = $bindable(false) }: Props = $props();

	const uid = $props.id();
	const listboxId = `${uid}-listbox`;
	const optionId = (id: string) => `${uid}-option-${id}`;

	const pageKeywords: Record<string, string> = {
		'/': 'start landing index',
		'/work': 'projects portfolio case studies',
		'/write': 'blog articles posts essays',
		'/about': 'bio experience cv resume',
		'/contact': 'email mail hire reach message',
		'/privacy-policy': 'legal data cookies',
		'/terms-of-service': 'legal terms conditions'
	};

	/** Group order in the list. */
	const groups = ['Pages', 'Projects', 'Writing', 'Themes', 'Sound'];

	/** Groups that can be long show only the latest few until the visitor searches. */
	const idleLimits: Record<string, number> = { Projects: 5, Writing: 5 };

	let dialog: HTMLDialogElement;
	let input: HTMLInputElement;
	let query = $state('');
	let activeIndex = $state(0);
	let closing = $state(false);
	let announcement = $state('');
	let searchIndex = $state<SearchIndex | null>(null);
	let loadingIndex = false;
	let ranCommand = false;
	let pressStartedOnBackdrop = false;

	const commands = $derived.by<Command[]>(() => {
		const pages = [...links, ...policyLinks].map<Command>(({ label, href }) => {
			const current = page.url.pathname === href;

			return {
				id: `page-${href}`,
				group: 'Pages',
				label: `Go to ${label}`,
				hint: current ? 'Current page' : undefined,
				keywords: pageKeywords[href] ?? '',
				current,
				run: () => {
					playSfx('forward');
					if (!current) void goto(resolve(href as '/'));
				}
			};
		});

		const themeCommands = themes.map<Command>(({ id, label }) => {
			const current = themeState.id === id;

			return {
				id: `theme-${id}`,
				group: 'Themes',
				label: `Switch to ${label} theme`,
				hint: current ? 'Current theme' : undefined,
				keywords: 'theme color colour palette appearance dark light accent',
				current,
				swatch: id,
				run: () => {
					if (!current) {
						setTheme(id);
						playSfx('select');
					}

					return current ? `${label} theme is already active` : `${label} theme applied`;
				}
			};
		});

		const sound: Command = {
			id: 'sound-toggle',
			group: 'Sound',
			label: sfxState.enabled ? 'Turn sound off' : 'Turn sound on',
			hint: sfxState.enabled ? 'Currently on' : 'Currently off',
			keywords: 'sound audio mute unmute volume sfx noise effects',
			run: () => `Sound ${toggleSfx() ? 'on' : 'off'}`
		};

		const content = (
			group: string,
			entries: SearchEntry[],
			label: string,
			route: '/work/[slug]' | '/write/[slug]'
		) =>
			entries.map<Command>(({ slug, title, category, year }) => ({
				id: `${group}-${slug}`,
				group,
				label: `${label}: ${title}`,
				hint: year ? `${category}, ${year}` : category,
				keywords: `${category} ${year ?? ''}`.toLowerCase(),
				run: () => {
					playSfx('forward');
					void goto(resolve(route, { slug }));
				}
			}));

		return [
			...pages,
			...content('Projects', searchIndex?.works ?? [], 'Project', '/work/[slug]'),
			...content('Writing', searchIndex?.posts ?? [], 'Post', '/write/[slug]'),
			...themeCommands,
			sound
		];
	});

	/** Lower is a better match; `null` means the command doesn't match every search word. */
	function score(command: Command, words: string[]): number | null {
		const label = command.label.toLowerCase();
		const haystack = `${label} ${command.keywords}`;
		let total = 0;

		for (const word of words) {
			if (label.split(' ').some((part) => part.startsWith(word))) continue;
			if (haystack.split(' ').some((part) => part.startsWith(word))) total += 1;
			else if (haystack.includes(word)) total += 2;
			else return null;
		}

		return total;
	}

	const sections = $derived.by(() => {
		const words = query.toLowerCase().split(/\s+/).filter(Boolean);
		let index = 0;

		const matches = groups.map((group) => ({
			group,
			items: commands
				.filter((command) => command.group === group)
				.map((command) => ({ command, rank: score(command, words) }))
				.filter((item): item is { command: Command; rank: number } => item.rank !== null)
				// Array#sort is stable, so ties keep their authored order.
				.sort((a, b) => a.rank - b.rank)
				.slice(0, words.length === 0 ? (idleLimits[group] ?? Infinity) : Infinity)
		}));

		// Indexes follow the rendered order so arrow keys walk the list top to bottom.
		return matches
			.filter(({ items }) => items.length > 0)
			.map(({ group, items }) => ({
				group,
				items: items.map(({ command }) => ({ command, index: index++ }))
			}));
	});

	const results = $derived(sections.flatMap(({ items }) => items));
	const active = $derived(results[Math.min(activeIndex, results.length - 1)]);
	const activeId = $derived(active ? optionId(active.command.id) : undefined);
	const status = $derived(
		results.length === 0
			? 'No results'
			: `${results.length} ${results.length === 1 ? 'result' : 'results'}`
	);

	/** Fetched on first open and kept; a failed request is retried the next time the palette opens. */
	async function loadSearchIndex() {
		if (searchIndex || loadingIndex) return;
		loadingIndex = true;

		try {
			const response = await fetch(resolve('/search-index.json'));
			if (response.ok) searchIndex = await response.json();
		} catch {
			// Pages, themes, and sound still work without the CMS content.
		} finally {
			loadingIndex = false;
		}
	}

	function move(step: number) {
		if (results.length === 0) return;
		activeIndex = (active.index + step + results.length) % results.length;
	}

	function handleInputKeydown(event: KeyboardEvent) {
		if (event.isComposing) return;

		if (event.key === 'ArrowDown') {
			event.preventDefault();
			move(1);
		} else if (event.key === 'ArrowUp') {
			event.preventDefault();
			move(-1);
		} else if (event.key === 'Enter' && active) {
			event.preventDefault();
			run(active.command);
		}
	}

	function announce(message: string) {
		// Clearing first makes a repeated message count as a change.
		announcement = '';
		setTimeout(() => (announcement = message), 50);
	}

	// Orient: the palette rises from where the eye already is and sinks back to it. `--backdrop-opacity`
	// is how the backdrop is animated, since GSAP can't target a pseudo-element.
	const hidden = { opacity: 0, y: 8, scale: 0.98, '--backdrop-opacity': 0 };
	const shown = { opacity: 1, y: 0, scale: 1, '--backdrop-opacity': 1 };

	function finishClose() {
		closing = false;
		if (dialog.open) dialog.close();
	}

	/** Closes with the exit animation, or at once when motion is reduced. Every visitor-initiated close goes through here. */
	function dismiss() {
		if (!dialog.open || closing) return;

		if (readReducedMotion()) {
			dialog.close();
			return;
		}

		closing = true;
		gsap.to(dialog, { ...hidden, duration: 0.35, ease: 'expo.out', onComplete: finishClose });
	}

	function run(command: Command) {
		if (closing) return;

		ranCommand = true;
		dismiss();

		const message = command.run();
		if (message) announce(message);
	}

	function handleClose() {
		open = false;
		if (!ranCommand) playSfx('close');
	}

	function handleWindowKeydown(event: KeyboardEvent) {
		if (event.key.toLowerCase() !== 'k' || event.altKey || event.shiftKey || event.repeat) return;
		if (!event.metaKey && !event.ctrlKey) return;

		// Browsers bind Ctrl+K to their own search bar.
		event.preventDefault();
		if (closing) return;

		if (open) dismiss();
		else open = true;
	}

	// A drag that starts in the panel (selecting text) and ends on the backdrop must not close it.
	function handlePointerDown(event: PointerEvent) {
		pressStartedOnBackdrop = event.target === dialog;
	}

	function handleClick(event: MouseEvent) {
		if (event.target === dialog && pressStartedOnBackdrop) dismiss();
	}

	$effect(() => {
		if (!open || dialog.open) return;

		query = '';
		activeIndex = 0;
		ranCommand = false;

		// The browser makes everything outside the dialog inert, traps Tab, and restores focus on close.
		dialog.showModal();

		gsap.killTweensOf(dialog);

		// Untracked so changing the Motion setting elsewhere can't re-run this effect and close the palette.
		if (readReducedMotion()) gsap.set(dialog, { clearProps: 'all' });
		else gsap.fromTo(dialog, hidden, { ...shown, duration: 0.6, ease: 'expo.out' });

		input.focus();
		playSfx('open');
		untrack(() => void loadSearchIndex());

		const unlock = lockScroll();

		return () => {
			unlock();
			gsap.killTweensOf(dialog);
			closing = false;
			if (dialog.open) dialog.close();
		};
	});

	// Keep the active option visible when arrowing through a list that scrolls.
	$effect(() => {
		if (activeId) document.getElementById(activeId)?.scrollIntoView({ block: 'nearest' });
	});
</script>

<svelte:window onkeydown={handleWindowKeydown} />

<!-- The dialog is inert while closed, so this region sits outside it to announce after it closes. -->
<p class="visually-hidden" role="status" aria-atomic="true">{announcement}</p>

<!-- Escape and focus handling are native to <dialog>; the click is only a pointer shortcut for it. -->
<!-- svelte-ignore a11y_click_events_have_key_events -->
<dialog
	bind:this={dialog}
	class="palette"
	class:palette--closing={closing}
	aria-label="Command palette"
	oncancel={(event) => {
		// Let the exit animation play instead of the browser closing the dialog instantly.
		event.preventDefault();
		dismiss();
	}}
	onclose={handleClose}
	onpointerdown={handlePointerDown}
	onclick={handleClick}
>
	<div class="palette__search">
		<TerminalIcon class="palette__icon" aria-hidden="true" />
		<input
			bind:this={input}
			bind:value={query}
			class="palette__input"
			type="text"
			role="combobox"
			aria-label="Search commands"
			aria-expanded={results.length > 0}
			aria-controls={results.length > 0 ? listboxId : undefined}
			aria-activedescendant={activeId}
			aria-autocomplete="list"
			aria-describedby="{uid}-instructions"
			placeholder="Search pages, themes, sound…"
			autocomplete="off"
			autocapitalize="off"
			spellcheck="false"
			enterkeyhint="go"
			oninput={() => (activeIndex = 0)}
			onkeydown={handleInputKeydown}
		/>
		<button type="button" class="palette__close" onclick={dismiss}>
			<span class="visually-hidden">Close command palette</span>
			<kbd aria-hidden="true">Esc</kbd>
		</button>
	</div>

	<p id="{uid}-instructions" class="visually-hidden">
		Use the up and down arrow keys to review results, Enter to run one, and Escape to close.
	</p>
	<p class="visually-hidden" role="status">{status}</p>

	{#if results.length > 0}
		<!-- Options never take focus, so a press must not pull it out of the input. -->
		<div
			id={listboxId}
			class="palette__list"
			role="listbox"
			aria-label="Commands"
			data-lenis-prevent
			tabindex="-1"
			onmousedown={(event) => event.preventDefault()}
		>
			{#each sections as { group, items } (group)}
				<div role="group" aria-labelledby="{uid}-group-{group}">
					<div id="{uid}-group-{group}" class="palette__group">{group}</div>
					{#each items as { command, index } (command.id)}
						<div
							id={optionId(command.id)}
							class="palette__option"
							role="option"
							tabindex="-1"
							aria-selected={active?.index === index}
							aria-current={command.current && command.group === 'Pages' ? 'page' : undefined}
							onpointermove={() => (activeIndex = index)}
							onclick={() => run(command)}
						>
							{#if command.swatch}
								<!-- `data-theme` scopes this theme's tokens to the swatch so it previews the real colors. -->
								<span class="palette__swatch" data-theme={command.swatch} aria-hidden="true"></span>
							{/if}
							<span class="palette__label">{command.label}</span>
							{#if command.hint}
								<span class="palette__hint">{command.hint}</span>
							{/if}
							<span class="palette__enter" aria-hidden="true">↵</span>
						</div>
					{/each}
				</div>
			{/each}
		</div>
	{:else}
		<p class="palette__empty">No commands match “{query}”.</p>
	{/if}

	<div class="palette__footer" aria-hidden="true">
		<span><kbd>↑</kbd><kbd>↓</kbd> Navigate</span>
		<span><kbd>↵</kbd> Select</span>
		<span><kbd>Esc</kbd> Close</span>
	</div>
</dialog>

<style>
	.palette {
		display: flex;
		flex-direction: column;
		width: min(36rem, calc(100vw - 32px));
		max-height: min(30rem, 80dvh);
		margin: 12dvh auto auto;
		padding: 0;
		overflow: hidden;
		color: var(--color-white);
		background-color: var(--color-secondary);
		border: 1px solid color-mix(in srgb, var(--color-quaternary) 40%, transparent);
		border-radius: 12px;
		box-shadow: 0 24px 64px rgb(0 0 0 / 40%);

		&:not([open]) {
			display: none;
		}

		&::backdrop {
			background-color: rgb(0 0 0 / calc(60% * var(--backdrop-opacity, 1)));
		}
	}

	.palette--closing {
		pointer-events: none;
	}

	.palette__search {
		display: flex;
		flex: none;
		gap: 12px;
		align-items: center;
		padding: 0 12px 0 16px;
		border-bottom: 1px solid color-mix(in srgb, var(--color-quaternary) 40%, transparent);
	}

	:global(.palette__icon) {
		flex: none;
	}

	.palette__input {
		flex: 1;
		min-width: 0;
		height: 56px;
		padding: 0;
		color: inherit;
		background: transparent;
		border: 0;
		font: inherit;
		font-size: 1rem;

		&::placeholder {
			color: color-mix(in srgb, var(--color-white) 65%, transparent);
			opacity: 1;
		}

		&:focus-visible {
			outline: none !important;
		}
	}

	.palette__close {
		display: inline-flex;
		flex: none;
		align-items: center;
		justify-content: center;
		min-width: 44px;
		min-height: 44px;
		padding: 0;
		color: inherit;
		background: none;
		border: 0;
		cursor: pointer;

		&:focus-visible {
			outline: 2px solid currentColor;
			outline-offset: -2px;
		}
	}

	.palette__list {
		flex: 1;
		min-height: 0;
		padding: 8px;
		overflow-y: auto;
		overscroll-behavior: contain;
		scrollbar-width: thin;
		scrollbar-color: var(--color-quaternary) transparent;
	}

	.palette__group {
		padding: 8px 8px 4px;
		color: color-mix(in srgb, var(--color-white) 65%, transparent);
		font-size: 0.75rem;
		letter-spacing: 0.04em;
		text-transform: uppercase;
	}

	.palette__option {
		display: flex;
		gap: 12px;
		align-items: center;
		min-height: 44px;
		padding: 0 8px;
		border-radius: 8px;
		font-size: 0.875rem;
		cursor: pointer;

		&[aria-selected='true'] {
			background-color: color-mix(in srgb, var(--color-white) 14%, transparent);
		}

		&[aria-selected='true'] .palette__enter {
			opacity: 1;
		}

		@media (forced-colors: active) {
			&[aria-selected='true'] {
				outline: 2px solid Highlight;
				outline-offset: -2px;
			}
		}
	}

	.palette__label {
		flex: 1;
		min-width: 0;
	}

	.palette__hint {
		flex: none;
		color: color-mix(in srgb, var(--color-white) 65%, transparent);
		font-size: 0.75rem;
	}

	.palette__enter {
		flex: none;
		width: 1em;
		opacity: 0;
	}

	.palette__swatch {
		position: relative;
		flex: none;
		width: 16px;
		height: 16px;
		border-radius: 50%;
		background-color: var(--color-neutral-900);
		box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--color-white) 30%, transparent);

		&::after {
			content: '';
			position: absolute;
			inset: 3px;
			border-radius: 50%;
			background-color: var(--accent);
		}
	}

	.palette__empty {
		margin: 0;
		padding: 24px 16px;
		color: color-mix(in srgb, var(--color-white) 65%, transparent);
		font-size: 0.875rem;
		text-align: center;
	}

	.palette__footer {
		display: none;
		flex: none;
		gap: 16px;
		padding: 8px 16px;
		color: color-mix(in srgb, var(--color-white) 65%, transparent);
		border-top: 1px solid color-mix(in srgb, var(--color-quaternary) 40%, transparent);
		font-size: 0.75rem;

		@media (hover: hover) and (pointer: fine) {
			display: flex;
		}
	}

	kbd {
		display: inline-block;
		min-width: 1.5em;
		margin-inline-end: 4px;
		padding: 1px 4px;
		border: 1px solid color-mix(in srgb, var(--color-white) 30%, transparent);
		border-radius: 4px;
		font: inherit;
		font-size: 0.75rem;
		text-align: center;
	}
</style>
