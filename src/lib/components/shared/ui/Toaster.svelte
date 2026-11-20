<script lang="ts">
	import { expoOut } from 'svelte/easing';
	import { fly } from 'svelte/transition';
	import CheckIcon from '$lib/assets/icons/check.svg?component';
	import { readReducedMotion } from '$lib/settings.svelte';
	import { dismissToast, toasts, type Toast } from '$lib/toast.svelte';

	/** Removes a toast after its duration, restarting whenever the pointer or focus leaves it. */
	function autoDismiss(node: HTMLElement, toast: Toast) {
		let timer: ReturnType<typeof setTimeout> | undefined;

		const start = () => {
			clearTimeout(timer);
			timer = setTimeout(() => dismissToast(toast.id), toast.duration);
		};
		const pause = () => clearTimeout(timer);

		start();
		node.addEventListener('pointerenter', pause);
		node.addEventListener('pointerleave', start);
		node.addEventListener('focusin', pause);
		node.addEventListener('focusout', start);

		return {
			destroy() {
				clearTimeout(timer);
			}
		};
	}

	// The in-app Motion setting, not only the OS query, so it is read when each toast appears.
	const motion = () => ({ y: 12, duration: readReducedMotion() ? 0 : 400, easing: expoOut });
</script>

<!--
	@component
	Short, self-dismissing outcome messages ("Copied", "Download started"). This container is the one
	live region for them, so call `showToast` instead of adding another status element.
-->
<div class="toaster" role="status" aria-live="polite" aria-atomic="false">
	{#each toasts as toast (toast.id)}
		<div
			class="toast toast--{toast.tone}"
			in:fly={motion()}
			out:fly={{ ...motion(), y: 6 }}
			use:autoDismiss={toast}
		>
			{#if toast.tone === 'success'}
				<CheckIcon class="toast__icon" aria-hidden="true" />
			{/if}
			<span>{toast.message}</span>
		</div>
	{/each}
</div>

<style>
	.toaster {
		position: fixed;
		inset-inline: 16px;
		bottom: max(16px, env(safe-area-inset-bottom));
		z-index: 100;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 8px;
		/* Only the toasts take clicks; the empty strip must not block the page. */
		pointer-events: none;
	}

	.toast {
		display: flex;
		align-items: center;
		gap: 10px;
		max-width: min(100%, 28rem);
		padding: 12px 16px;
		color: var(--color-white);
		background-color: var(--color-neutral-950);
		border: 1px solid var(--color-primary);
		border-left: 3px solid var(--accent);
		border-radius: 4px;
		font-size: 0.9375rem;
		line-height: 1.4;
		pointer-events: auto;
		box-shadow: 0 8px 24px rgb(0 0 0 / 25%);
	}

	.toast--error {
		border-left-color: var(--color-light-red);
	}

	.toast :global(.toast__icon) {
		flex: none;
		color: var(--accent);
	}

	@media (forced-colors: active) {
		.toast {
			border: 1px solid CanvasText;
		}
	}
</style>
