<script lang="ts">
	import { readReducedMotion } from '$lib/settings.svelte';
	import { playSfxIfUnlocked } from '$lib/sfx.svelte';
	import { appReady } from '$lib/stores/app-ready.svelte';
	import gsap from 'gsap';
	import { onMount, tick } from 'svelte';

	let progress = $state(0);
	let visible = $state(true);
	let loadingComplete = $state(false);
	let loader = $state<HTMLDivElement>();
	let indicator = $state<HTMLDivElement>();
	let message = $state<HTMLParagraphElement>();

	const resourceTimeout = 10000;

	function waitForResource(target: EventTarget, isReady: () => boolean, events: string[]) {
		if (isReady()) return Promise.resolve();

		return new Promise<void>((resolve) => {
			let timer = 0;

			const finish = () => {
				events.forEach((event) => target.removeEventListener(event, finish));
				clearTimeout(timer);
				resolve();
			};

			events.forEach((event) => target.addEventListener(event, finish, { once: true }));
			timer = window.setTimeout(finish, resourceTimeout);
		});
	}

	function waitWithTimeout(promise: Promise<unknown>) {
		return new Promise<void>((resolve) => {
			const timer = window.setTimeout(resolve, resourceTimeout);

			promise.then(
				() => {
					clearTimeout(timer);
					resolve();
				},
				() => {
					clearTimeout(timer);
					resolve();
				}
			);
		});
	}

	function getLoadingTasks() {
		const images = Array.from(document.images)
			.filter((image) => image.loading !== 'lazy')
			.map((image) => waitForResource(image, () => image.complete, ['load', 'error', 'abort']));

		const videos = Array.from(document.querySelectorAll('video')).map((video) =>
			waitForResource(video, () => video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA, [
				'loadeddata',
				'error',
				'abort'
			])
		);

		const fonts = waitWithTimeout(document.fonts.ready);
		const page = waitForResource(window, () => document.readyState === 'complete', ['load']);

		return [...images, ...videos, fonts, page];
	}

	/**
	 * Tracks eager images, videos, fonts, and the window load event. GSAP
	 * smooths each completed resource into the visible ring percentage.
	 */
	onMount(() => {
		if (readReducedMotion()) {
			visible = false;
			appReady.completeLoader();
			return;
		}

		if (!loader || !indicator) {
			visible = false;
			appReady.completeLoader();
			return;
		}

		const root = document.documentElement;
		const previousOverflow = root.style.overflow;
		const meter = { value: 0 };
		const tasks = getLoadingTasks();
		const loaderElement = loader;
		const indicatorElement = indicator;
		let completed = 0;

		root.style.overflow = 'hidden';

		const revealSite = async () => {
			void playSfxIfUnlocked('complete');
			loadingComplete = true;
			await tick();

			if (!message) {
				root.style.overflow = previousOverflow;
				visible = false;
				appReady.completeLoader();
				return;
			}

			const messageElement = message;

			gsap
				.timeline({
					onComplete: () => {
						root.style.overflow = previousOverflow;
						visible = false;
						appReady.completeLoader();
					}
				})
				.to(indicatorElement, {
					scale: 0.75,
					rotation: 20,
					autoAlpha: 0,
					duration: 0.4,
					ease: 'expo.in'
				})
				.fromTo(
					messageElement,
					{ yPercent: 120, rotation: 3, autoAlpha: 0 },
					{ yPercent: 0, rotation: 0, autoAlpha: 1, duration: 0.6, ease: 'expo.out' }
				)
				.to(
					messageElement,
					{ yPercent: -120, rotation: -3, autoAlpha: 0, duration: 0.45, ease: 'expo.in' },
					'+=0.65'
				)
				.to(
					loaderElement,
					{
						clipPath: 'inset(0 0 100% 0)',
						duration: 0.8,
						ease: 'expo.inOut'
					},
					'-=0.15'
				);
		};

		const updateProgress = () => {
			completed += 1;
			const target = Math.round((completed / tasks.length) * 100);

			gsap.to(meter, {
				value: target,
				duration: 0.45,
				ease: 'expo.out',
				overwrite: true,
				onUpdate: () => {
					progress = Math.round(meter.value);
				},
				onComplete: target === 100 ? () => void revealSite() : undefined
			});
		};

		tasks.forEach((task) => {
			void task.then(updateProgress);
		});

		return () => {
			gsap.killTweensOf([meter, loaderElement, indicatorElement]);
			root.style.overflow = previousOverflow;
		};
	});
</script>

{#if visible}
	<div bind:this={loader} class="site-loader">
		<div
			bind:this={indicator}
			class="site-loader__indicator"
			role="progressbar"
			aria-label="Loading site"
			aria-valuemin="0"
			aria-valuemax="100"
			aria-valuenow={progress}
		>
			<svg class="site-loader__ring" viewBox="0 0 120 120" aria-hidden="true">
				<circle class="site-loader__track" cx="60" cy="60" r="52"></circle>
				<circle
					class="site-loader__progress"
					cx="60"
					cy="60"
					r="52"
					pathLength="100"
					stroke-dasharray="100"
					stroke-dashoffset={100 - progress}
				></circle>
			</svg>
			<span class="site-loader__percentage">{progress}%</span>
		</div>

		{#if loadingComplete}
			<div class="site-loader__message-mask">
				<p bind:this={message} class="site-loader__message" role="status">Loading complete</p>
			</div>
		{/if}
	</div>
{/if}

<style>
	.site-loader {
		position: fixed;
		z-index: 10000;
		inset: 0;
		display: grid;
		place-items: center;
		background-color: var(--color-neutral-800);
		opacity: 1;
	}

	.site-loader__indicator,
	.site-loader__message-mask {
		grid-area: 1 / 1;
	}

	.site-loader__indicator {
		position: relative;
		display: grid;
		width: clamp(120px, 18vw, 180px);
		aspect-ratio: 1;
		place-items: center;
	}

	.site-loader__ring {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		transform: rotate(-90deg);
	}

	.site-loader__track,
	.site-loader__progress {
		fill: none;
		stroke-width: 2;
	}

	.site-loader__track {
		stroke: var(--color-secondary);
	}

	.site-loader__progress {
		stroke: var(--color-white);
		stroke-linecap: round;
	}

	.site-loader__percentage {
		font-family: var(--font-family-heading);
		font-size: clamp(0.875rem, 1.5vw, 1rem);
		font-variant-numeric: tabular-nums;
	}

	.site-loader__message-mask {
		overflow: hidden;
		padding: 0.25em;
	}

	.site-loader__message {
		margin: 0;
		font-family: var(--font-family-heading);
		font-size: clamp(1.25rem, 3vw, 2.5rem);
		text-transform: uppercase;
		letter-spacing: -0.04em;
		visibility: hidden;
		opacity: 0;
	}

	@media (--motion-reduce) {
		.site-loader {
			display: none;
		}
	}
</style>
