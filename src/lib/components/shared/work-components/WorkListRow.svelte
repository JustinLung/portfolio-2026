<script lang="ts">
	import { readReducedMotion } from '$lib/settings.svelte';
	import { resolve } from '$app/paths';
	import previewPlaceholder from '$lib/assets/work-preview-placeholder.svg';
	import gsap from 'gsap';
	import type { WorkItem } from '../../../../utils/types';

	let { item }: { item: WorkItem } = $props();

	let previewRef = $state<HTMLElement | null>(null);
	let previousPointer = { x: 0, y: 0, time: 0 };
	let settleTween: gsap.core.Tween | null = null;

	function getPointerPreviewPosition(event: PointerEvent) {
		if (!previewRef) return { x: event.clientX, y: event.clientY };

		const { width, height } = previewRef.getBoundingClientRect();
		const gap = 24;
		const edgePadding = 8;
		const fitsOnRight = event.clientX + gap + width <= window.innerWidth - edgePadding;
		const preferredX = fitsOnRight ? event.clientX + gap : event.clientX - gap - width;
		const maxX = Math.max(edgePadding, window.innerWidth - width - edgePadding);
		const maxY = Math.max(edgePadding, window.innerHeight - height - edgePadding);

		return {
			x: gsap.utils.clamp(edgePadding, maxX, preferredX),
			y: gsap.utils.clamp(edgePadding, maxY, event.clientY - height / 2)
		};
	}

	function positionPreview(event: PointerEvent, positionImmediately = false) {
		if (
			!previewRef ||
			event.pointerType === 'touch' ||
			window.matchMedia('(pointer: coarse)').matches
		) {
			return;
		}

		const reduceMotion = readReducedMotion();
		const now = performance.now();
		const elapsed = Math.max(now - previousPointer.time, 16);
		const distanceX = event.clientX - previousPointer.x;
		const distanceY = event.clientY - previousPointer.y;
		const velocityX = previousPointer.time === 0 ? 0 : distanceX / elapsed;
		const speed = previousPointer.time === 0 ? 0 : Math.hypot(distanceX, distanceY) / elapsed;
		const { x, y } = getPointerPreviewPosition(event);

		previousPointer = { x: event.clientX, y: event.clientY, time: now };
		settleTween?.kill();

		if (positionImmediately) {
			gsap.set(previewRef, { x, y });
		}

		gsap.to(previewRef, {
			x,
			y,
			opacity: 1,
			rotation: reduceMotion ? 0 : gsap.utils.clamp(-3, 3, velocityX * 2.5),
			scale: reduceMotion ? 1 : 1 + gsap.utils.clamp(0, 0.025, speed * 0.01),
			duration: reduceMotion ? 0 : 0.28,
			ease: 'expo.out',
			overwrite: 'auto'
		});

		settleTween = gsap.to(previewRef, {
			rotation: 0,
			scale: 1,
			duration: reduceMotion ? 0 : 0.45,
			delay: reduceMotion ? 0 : 0.08,
			ease: 'power3.out'
		});
	}

	function showPointerPreview(event: PointerEvent) {
		previousPointer.time = 0;
		positionPreview(event, true);
	}

	function showKeyboardPreview() {
		if (!previewRef) return;

		const reduceMotion = readReducedMotion();
		const { width, height } = previewRef.getBoundingClientRect();

		gsap.to(previewRef, {
			x: (window.innerWidth - width) / 2,
			y: (window.innerHeight - height) / 2,
			opacity: 1,
			rotation: 0,
			scale: 1,
			duration: reduceMotion ? 0 : 0.2,
			ease: 'expo.out',
			overwrite: 'auto'
		});
	}

	function hidePreview() {
		previousPointer.time = 0;
		settleTween?.kill();

		if (!previewRef) return;

		gsap.to(previewRef, {
			opacity: 0,
			rotation: 0,
			scale: 0.75,
			duration: readReducedMotion() ? 0 : 0.3,
			ease: 'expo.out',
			overwrite: 'auto'
		});
	}

	$effect(() => {
		const preview = previewRef;

		return () => {
			settleTween?.kill();
			if (preview) gsap.killTweensOf(preview);
		};
	});
</script>

<!--
	@component
	A list presentation of a portfolio item that owns its pointer and keyboard preview motion.
-->
<li
	class="work-list-item"
	onpointerenter={showPointerPreview}
	onpointermove={positionPreview}
	onpointerleave={hidePreview}
	onpointercancel={hidePreview}
>
	<a
		href={resolve('/work/[slug]', { slug: item.slug })}
		class="work-list-item__link"
		data-uisfx-hover="hover"
		data-uisfx="forward"
		onfocus={showKeyboardPreview}
		onblur={hidePreview}
	>
		<span class="work-list-item__title">{item.title}</span>
		<span class="work-list-item__category">{item.category}</span>
		{#if item.year}
			<span class="work-list-item__year">{item.year}</span>
		{/if}
	</a>
	<figure
		bind:this={previewRef}
		class="work-list-item__preview"
		style={`--preview-hue: ${item.previewHue ?? 0}deg;`}
		aria-hidden="true"
	>
		<img src={item.image ?? previewPlaceholder} alt="" />
	</figure>
</li>

<style>
	.work-list-item {
		position: relative;
		border-top: 1px solid var(--color-primary);

		.work-list-item__link {
			position: relative;
			z-index: 1;
			display: grid;
			grid-template-columns: 1fr auto;
			gap: 6px 16px;
			width: 100%;
			padding: 16px 8px;
			color: var(--color-white);
			font-size: 0.875rem;
			text-decoration: none;

			.work-list-item__title {
				grid-row: 1;
				grid-column: 1;
				font-size: 1rem;
			}

			.work-list-item__category,
			.work-list-item__year {
				color: var(--color-quaternary);
			}

			.work-list-item__category {
				grid-row: 2;
				grid-column: 1 / -1;
			}

			.work-list-item__year {
				grid-row: 1;
				grid-column: 2;
			}
		}

		.work-list-item__preview {
			position: fixed;
			top: 0;
			left: 0;
			z-index: 10;
			display: none;
			width: min(70vw, 420px);
			aspect-ratio: 16 / 10;
			margin: 0;
			opacity: 0;
			pointer-events: none;
			transform: scale(0.94);
			transform-origin: center;
			will-change: transform, opacity;

			img {
				display: block;
				width: 100%;
				height: 100%;
				border-radius: 2px;
				filter: hue-rotate(var(--preview-hue));
				object-fit: cover;
			}
		}
	}

	@media (--viewport-md-up) {
		.work-list-item {
			.work-list-item__preview {
				display: block;
			}

			&::before {
				position: absolute;
				inset: 0;
				z-index: 0;
				background-color: var(--color-white);
				content: '';
				pointer-events: none;
				transform: scaleY(0);
				transform-origin: bottom;
				transition: transform 450ms var(--easeOutExpo);
			}

			&:hover::before,
			&:focus-within::before {
				transform: scaleY(1);
			}

			&:hover .work-list-item__link,
			&:hover .work-list-item__category,
			&:hover .work-list-item__year,
			&:focus-within .work-list-item__link,
			&:focus-within .work-list-item__category,
			&:focus-within .work-list-item__year {
				color: var(--color-black);
			}

			.work-list-item__link {
				display: flex;
				justify-content: space-between;
				gap: normal;
				padding: 16px 8px;

				.work-list-item__title,
				.work-list-item__year {
					flex: 1 1 0;
				}

				.work-list-item__title {
					font-size: inherit;
					font-weight: inherit;
				}

				.work-list-item__category {
					flex: 0 1 12rem;
					text-align: left;
				}

				.work-list-item__year {
					text-align: right;
				}
			}
		}
	}

	@media (--motion-reduce) {
		.work-list-item::before {
			transition-duration: 0.01ms;
		}
	}
</style>
