<script lang="ts">
	import { readReducedMotion } from '$lib/settings.svelte';
	import { onNavigate } from '$app/navigation';
	import { appReady } from '$lib/stores/app-ready.svelte';
	import { onMount } from 'svelte';
	import gsap from 'gsap';

	let curtain: HTMLDivElement;

	const hiddenLeft = -100;
	const covering = 0;
	const hiddenRight = 100;

	onMount(() => {
		curtain.style.transform = 'none';
		gsap.set(curtain, { xPercent: hiddenLeft });

		return () => gsap.killTweensOf(curtain);
	});

	function moveCurtain(to: number) {
		return new Promise<void>((resolve) => {
			gsap.to(curtain, {
				xPercent: to,
				duration: 0.8,
				ease: 'expo.out',
				overwrite: true,
				onComplete: resolve,
				onInterrupt: resolve
			});
		});
	}

	/**
	 * Moves a curtain across the viewport while the View Transitions API swaps
	 * pages behind it. Unsupported browsers and people who prefer reduced
	 * motion keep SvelteKit's default instant navigation.
	 */
	onNavigate((navigation) => {
		if (!document.startViewTransition || readReducedMotion()) {
			return;
		}

		appReady.startTransition();

		return new Promise<void>((resolve) => {
			void moveCurtain(covering)
				.then(async () => {
					try {
						const transition = document.startViewTransition(async () => {
							resolve();
							await navigation.complete;
						});

						await transition.finished;
						await moveCurtain(hiddenRight);
						gsap.set(curtain, { xPercent: hiddenLeft });
					} catch {
						gsap.set(curtain, { xPercent: hiddenLeft });
						resolve();
					} finally {
						appReady.completeTransition();
					}
				})
				.catch(() => {
					gsap.set(curtain, { xPercent: hiddenLeft });
					appReady.completeTransition();
					resolve();
				});
		});
	});
</script>

<div bind:this={curtain} class="page-curtain" aria-hidden="true"></div>

<style>
	.page-curtain {
		position: fixed;
		z-index: 9999;
		inset: 0;
		background-color: var(--color-quaternary);
		pointer-events: none;
		transform: translate3d(-100%, 0, 0);
		will-change: transform;
	}

	:global(::view-transition-group(root)),
	:global(::view-transition-old(root)),
	:global(::view-transition-new(root)) {
		animation: none;
	}

	@media (--motion-reduce) {
		.page-curtain {
			display: none;
		}
	}
</style>
