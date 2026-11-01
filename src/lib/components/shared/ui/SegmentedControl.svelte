<script lang="ts" generics="T extends string">
	import { playSfx } from '$lib/sfx.svelte';

	type Props = {
		name: string;
		label: string;
		options: readonly { id: T; label: string }[];
		value: T;
		onchange: (value: T) => void;
	};

	let { name, label, options, value, onchange }: Props = $props();
</script>

<!-- Native radios give arrow-key navigation and a single tab stop without extra handlers. -->
<div class="segmented" role="radiogroup" aria-label={label}>
	{#each options as option (option.id)}
		<label class="segmented__option" data-uisfx-hover="hover">
			<input
				type="radio"
				class="segmented__input"
				{name}
				value={option.id}
				checked={value === option.id}
				onchange={() => {
					onchange(option.id);
					playSfx('select');
				}}
			/>
			<span class="segmented__label">{option.label}</span>
		</label>
	{/each}
</div>

<style>
	.segmented {
		display: inline-flex;
		border: 1px solid color-mix(in srgb, var(--color-quaternary) 40%, transparent);
		border-radius: 999px;
	}

	.segmented__option {
		position: relative;
		cursor: pointer;
	}

	.segmented__input {
		position: absolute;
		inset: 0;
		margin: 0;
		opacity: 0;
		cursor: inherit;
	}

	.segmented__label {
		display: block;
		padding: 6px 14px;
		border-radius: 999px;
		color: var(--color-quaternary);
		font-size: 0.875rem;
		transition:
			color 200ms ease,
			background-color 200ms ease;
	}

	.segmented__input:checked + .segmented__label {
		color: var(--color-white);
		background: color-mix(in srgb, var(--color-quaternary) 30%, transparent);
	}

	.segmented__input:focus-visible + .segmented__label {
		outline: 2px solid currentColor;
		outline-offset: 2px;
	}

	@media (prefers-reduced-motion: reduce) {
		.segmented__label {
			transition: none;
		}
	}
</style>
