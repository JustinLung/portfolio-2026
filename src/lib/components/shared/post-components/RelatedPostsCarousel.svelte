<script lang="ts">
	import type { PostItem } from '../../../../utils/types';
	import BlogCard from './BlogCard.svelte';
	import type { EmblaCarouselType } from 'embla-carousel';
	import emblaCarouselSvelte from 'embla-carousel-svelte';
	import { playSfx } from '$lib/sfx.svelte';

	let { posts, title }: { posts: PostItem[]; title: string } = $props();
	let emblaApi = $state<EmblaCarouselType>();
	let canScrollPrev = $state(false);
	let canScrollNext = $state(false);
	let dragStartX: number | null = null;

	const carouselOptions = {
		align: 'start',
		containScroll: 'trimSnaps'
	} as const;

	function updateNavigation(api: EmblaCarouselType) {
		canScrollPrev = api.canScrollPrev();
		canScrollNext = api.canScrollNext();
	}

	function handleEmblaInit(event: CustomEvent<EmblaCarouselType>) {
		emblaApi = event.detail;
		updateNavigation(emblaApi);
		emblaApi.on('select', updateNavigation);
		emblaApi.on('reInit', updateNavigation);
	}

	function scrollPrevious() {
		if (!canScrollPrev) return;
		playSfx('skip-previous');
		emblaApi?.scrollPrev();
	}

	function scrollNext() {
		if (!canScrollNext) return;
		playSfx('skip-next');
		emblaApi?.scrollNext();
	}

	function handleDragEnd(event: PointerEvent) {
		if (dragStartX !== null && Math.abs(event.clientX - dragStartX) > 24) {
			playSfx('swipe');
		}
		dragStartX = null;
	}
</script>

{#if posts.length}
	<section class="related-posts" aria-labelledby="related-posts-title">
		<header class="related-posts__header">
			<h2 id="related-posts-title">{title}</h2>
			{#if canScrollPrev || canScrollNext}
				<div class="related-posts__navigation" aria-label="Carousel navigation">
					<button
						type="button"
						aria-label="Previous posts"
						disabled={!canScrollPrev}
						data-uisfx-hover="hover"
						onclick={scrollPrevious}
					>
						<span aria-hidden="true">←</span>
					</button>
					<button
						type="button"
						aria-label="Next posts"
						disabled={!canScrollNext}
						data-uisfx-hover="hover"
						onclick={scrollNext}
					>
						<span aria-hidden="true">→</span>
					</button>
				</div>
			{/if}
		</header>

		<div
			class="related-posts__carousel"
			role="region"
			aria-label="Related blog posts"
			aria-roledescription="carousel"
			use:emblaCarouselSvelte={{ options: carouselOptions, plugins: [] }}
			onemblaInit={handleEmblaInit}
			onpointerdown={(event) => (dragStartX = event.clientX)}
			onpointerup={handleDragEnd}
			onpointercancel={() => (dragStartX = null)}
		>
			<div class="related-posts__track">
				{#each posts as post, index (post.id)}
					<div
						class="related-posts__slide"
						role="group"
						aria-label={`${index + 1} of ${posts.length}`}
						aria-roledescription="slide"
					>
						<BlogCard item={post} />
					</div>
				{/each}
			</div>
		</div>
	</section>
{/if}

<style>
	.related-posts {
		margin-bottom: 64px;
	}

	.related-posts__header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 24px;
		margin-bottom: 64px;
		padding-bottom: 16px;
		border-bottom: 1px solid var(--color-primary);
	}

	.related-posts__navigation {
		display: flex;
		gap: 8px;

		button {
			display: grid;
			width: 44px;
			height: 44px;
			padding: 0;
			place-items: center;
			border: 1px solid var(--color-primary);
			border-radius: 50%;
			background: transparent;
			color: inherit;
			cursor: pointer;
			transition:
				background-color 300ms var(--ease-out-expo),
				color 300ms var(--ease-out-expo),
				opacity 300ms var(--ease-out-expo);
		}

		button:hover:not(:disabled),
		button:focus-visible {
			background: var(--color-primary);
			color: var(--color-white);
		}

		button:focus-visible {
			outline: 2px solid var(--color-white);
			outline-offset: 2px;
		}

		button:disabled {
			cursor: not-allowed;
			opacity: 0.35;
		}
	}

	.related-posts__carousel {
		overflow: hidden;
		cursor: grab;
		margin-right: -16px;

		@media (--viewport-md-up) {
			margin-right: 0;
		}
	}

	.related-posts__carousel:active {
		cursor: grabbing;
	}

	.related-posts__track {
		display: flex;
		margin-left: -16px;
		touch-action: pan-y pinch-zoom;

		@media (--viewport-md-up) {
			margin-left: -24px;
		}
	}

	.related-posts__slide {
		flex: 0 0 83.333%;
		min-width: 0;
		padding-left: 16px;

		@media (--viewport-md-up) {
			flex-basis: 50%;
			padding-left: 24px;
		}

		@media (--viewport-lg-up) {
			flex-basis: 33.333%;
		}

		@media (--viewport-xl-up) {
			flex-basis: 25%;
		}
	}
</style>
