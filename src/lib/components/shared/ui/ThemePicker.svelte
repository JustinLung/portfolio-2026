<script lang="ts">
	import { playSfx } from '$lib/sfx.svelte';
	import { setTheme, themes, themeState, type ThemeId } from '$lib/theme.svelte';

	function handleKeydown(event: KeyboardEvent, index: number) {
		const step = { ArrowLeft: -1, ArrowUp: -1, ArrowRight: 1, ArrowDown: 1 }[event.key];
		if (!step) return;

		event.preventDefault();
		const nextIndex = (index + step + themes.length) % themes.length;
		select(themes[nextIndex].id);

		const options = (event.currentTarget as HTMLElement).parentElement?.children;
		(options?.[nextIndex] as HTMLElement | undefined)?.focus();
	}

	function select(id: ThemeId) {
		if (id === themeState.id) return;

		setTheme(id);
		playSfx('select');
	}
</script>

<div class="theme-picker" role="radiogroup" aria-label="Theme">
	{#each themes as { id, label }, index (id)}
		<button
			type="button"
			role="radio"
			class="theme-picker__option"
			aria-checked={themeState.id === id}
			aria-label={label}
			title={label}
			tabindex={themeState.id === id ? 0 : -1}
			data-uisfx-hover="hover"
			onclick={() => select(id)}
			onkeydown={(event) => handleKeydown(event, index)}
		>
			<!-- `data-theme` scopes this theme's tokens to the swatch so it previews the real colors. -->
			<span class="theme-picker__swatch" data-theme={id} aria-hidden="true"></span>
		</button>
	{/each}
</div>

<style>
	.theme-picker {
		display: flex;
		gap: 4px;
		margin-inline: -6px;
	}

	/* The button is the touch target; the swatch inside is what you see. */
	.theme-picker__option {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 44px;
		height: 44px;
		padding: 0;
		border: 0;
		border-radius: 50%;
		background: transparent;
		cursor: pointer;

		&:focus-visible {
			outline: 2px solid var(--color-white);
			outline-offset: -2px;
		}
	}

	/* A disc in the theme's surface color with a dot in its accent. */
	.theme-picker__swatch {
		position: relative;
		width: 32px;
		height: 32px;
		border-radius: 50%;
		background-color: var(--color-neutral-900);
		box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--color-white) 18%, transparent);
		transition:
			transform 200ms ease,
			box-shadow 200ms ease;

		&::after {
			content: '';
			position: absolute;
			inset: 4px;
			border-radius: 50%;
			background-color: var(--accent);
		}
	}

	.theme-picker__option:hover .theme-picker__swatch {
		transform: scale(1.08);
	}

	/* A fine ring, separated from the disc by a gap in the sheet's own color. */
	.theme-picker__option[aria-checked='true'] .theme-picker__swatch {
		box-shadow:
			0 0 0 3px var(--color-secondary),
			0 0 0 4px var(--color-white);
	}

	@media (prefers-reduced-motion: reduce) {
		.theme-picker__swatch {
			transition: none;
		}
	}
</style>
