<script lang="ts">
	import { saveSettings, settings, updateSetting } from '$lib/settings.svelte';
	import { playSfx } from '$lib/sfx.svelte';

	let { id }: { id: string } = $props();

	const percent = $derived(Math.round(settings.volume * 100));

	function handleInput(event: Event & { currentTarget: HTMLInputElement }) {
		const volume = event.currentTarget.valueAsNumber;

		updateSetting('volume', volume, false);
	}
</script>

<div class="volume">
	<input
		{id}
		type="range"
		class="volume__input"
		min="0"
		max="1"
		step="0.05"
		value={settings.volume}
		style:--fill="{percent}%"
		aria-valuetext="{percent}%"
		data-uisfx-hover="hover"
		oninput={handleInput}
		onchange={() => {
			saveSettings();
			playSfx('select');
		}}
	/>
	<output class="volume__value" for={id}>{percent}%</output>
</div>

<style>
	.volume {
		display: flex;
		align-items: center;
		gap: 12px;
	}

	.volume__input {
		--track-height: 4px;
		--thumb-size: 16px;

		width: 140px;
		height: 44px;
		margin: 0;
		background: transparent;
		appearance: none;
		cursor: pointer;
	}

	.volume__input::-webkit-slider-runnable-track {
		height: var(--track-height);
		border-radius: 999px;
		background: linear-gradient(
			to right,
			var(--accent) var(--fill),
			color-mix(in srgb, var(--color-quaternary) 40%, transparent) var(--fill)
		);
	}

	.volume__input::-moz-range-track {
		height: var(--track-height);
		border-radius: 999px;
		background: color-mix(in srgb, var(--color-quaternary) 40%, transparent);
	}

	.volume__input::-moz-range-progress {
		height: var(--track-height);
		border-radius: 999px;
		background: var(--accent);
	}

	.volume__input::-webkit-slider-thumb {
		width: var(--thumb-size);
		height: var(--thumb-size);
		margin-top: calc((var(--track-height) - var(--thumb-size)) / 2);
		border: 0;
		border-radius: 50%;
		background: var(--color-white);
		box-shadow: 0 0 0 4px transparent;
		appearance: none;
		transition: box-shadow 200ms ease;
	}

	.volume__input::-moz-range-thumb {
		width: var(--thumb-size);
		height: var(--thumb-size);
		border: 0;
		border-radius: 50%;
		background: var(--color-white);
		box-shadow: 0 0 0 4px transparent;
		transition: box-shadow 200ms ease;
	}

	.volume__input:hover::-webkit-slider-thumb,
	.volume__input:active::-webkit-slider-thumb {
		box-shadow: 0 0 0 4px color-mix(in srgb, var(--accent) 35%, transparent);
	}

	.volume__input:hover::-moz-range-thumb,
	.volume__input:active::-moz-range-thumb {
		box-shadow: 0 0 0 4px color-mix(in srgb, var(--accent) 35%, transparent);
	}

	.volume__input:focus-visible {
		outline: 2px solid currentColor;
		outline-offset: -8px;
		border-radius: 999px;
	}

	.volume__value {
		min-width: 3ch;
		color: color-mix(in srgb, var(--color-white) 65%, transparent);
		font-size: 0.875rem;
		font-variant-numeric: tabular-nums;
		text-align: right;
	}

	@media (prefers-reduced-motion: reduce) {
		.volume__input::-webkit-slider-thumb,
		.volume__input::-moz-range-thumb {
			transition: none;
		}
	}
</style>
