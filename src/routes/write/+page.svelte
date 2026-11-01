<script lang="ts">
	import { readReducedMotion } from '$lib/settings.svelte';
	import { tick } from 'svelte';
	import gsap from 'gsap';
	import { Flip } from 'gsap/Flip';
	import BlogCard from '$lib/components/shared/post-components/BlogCard.svelte';
	import Seo from '$lib/components/shared/misc/Seo.svelte';
	import { playSfx } from '$lib/sfx.svelte';
	import { appReady } from '$lib/stores/app-ready.svelte';
	import type { PageProps } from './$types';

	gsap.registerPlugin(Flip);

	let { data }: PageProps = $props();

	let selectedCategory = $state('all');
	let gridRef = $state<HTMLDivElement | null>(null);
	let entranceAnimation: gsap.core.Timeline | null = null;
	let entranceTargets: HTMLElement[] = [];
	let layoutAnimation: gsap.core.Timeline | null = null;
	let categories = $derived([...new Set(data.posts.map((post) => post.category))]);
	let filteredPosts = $derived(
		selectedCategory === 'all'
			? data.posts
			: data.posts.filter((post) => post.category === selectedCategory)
	);

	function finishEntranceAnimation() {
		entranceAnimation?.kill();
		gsap.killTweensOf(entranceTargets);
		gsap.set(entranceTargets, { clearProps: 'opacity,transform' });
		entranceAnimation = null;
		entranceTargets = [];
	}

	function animateWritePage(section: HTMLElement) {
		if (readReducedMotion()) return;

		const header = gsap.utils.toArray<HTMLElement>('.write-page__header > *', section);
		const filter = gsap.utils.toArray<HTMLElement>('.write-page__filter', section);
		const items = gsap.utils.toArray<HTMLElement>('.write-page__item', section);
		const targets = [...header, ...filter, ...items];

		entranceTargets = targets;
		gsap.set(targets, { opacity: 0, y: 10 });

		$effect(() => {
			if (!appReady.ready) return;

			const context = gsap.context(() => {
				const timeline = gsap.timeline({
					defaults: { ease: 'expo.out' },
					onComplete() {
						gsap.set(targets, { clearProps: 'opacity,transform' });
						if (entranceAnimation === timeline) {
							entranceAnimation = null;
							entranceTargets = [];
						}
					}
				});

				entranceAnimation = timeline;

				timeline.to(header, {
					opacity: 1,
					y: 0,
					duration: 0.7,
					stagger: 0.08
				});

				if (filter.length) {
					timeline.to(
						filter,
						{
							opacity: 1,
							y: 0,
							duration: 0.55,
							stagger: 0.04
						},
						'-=0.45'
					);
				}

				if (items.length) {
					timeline.to(
						items,
						{
							opacity: 1,
							y: 0,
							duration: 0.7,
							stagger: 0.06
						},
						'-=0.35'
					);
				}
			}, section);

			return () => context.revert();
		});

		return () => {
			entranceAnimation?.kill();
			gsap.killTweensOf(targets);
			gsap.set(targets, { clearProps: 'opacity,transform' });
			if (entranceTargets === targets) {
				entranceAnimation = null;
				entranceTargets = [];
			}
		};
	}

	async function animateLayout(update: () => void) {
		const reduceMotion = readReducedMotion();
		const currentItems = gridRef?.querySelectorAll('.write-page__item');
		finishEntranceAnimation();
		layoutAnimation?.kill();

		if (currentItems?.length) {
			Flip.killFlipsOf(currentItems);
			gsap.killTweensOf(currentItems);
			gsap.set(currentItems, {
				clearProps:
					'position,top,left,width,height,maxWidth,maxHeight,minWidth,minHeight,transform,opacity'
			});
		}

		const state = !reduceMotion && currentItems?.length ? Flip.getState(currentItems) : null;

		update();
		await tick();

		if (!state || !gridRef) return;

		const nextItems = gridRef.querySelectorAll('.write-page__item');
		const cleanup = () => {
			gsap.set(nextItems, {
				clearProps:
					'position,top,left,width,height,maxWidth,maxHeight,minWidth,minHeight,transform,opacity'
			});
			layoutAnimation = null;
		};

		layoutAnimation = Flip.from(state, {
			targets: nextItems,
			duration: 0.45,
			ease: 'expo.out',
			prune: true,
			onEnter: (elements) =>
				gsap.fromTo(
					elements,
					{ opacity: 0, y: 12 },
					{ opacity: 1, y: 0, duration: 0.3, ease: 'expo.out', stagger: 0.03 }
				),
			onComplete: cleanup,
			onInterrupt: cleanup
		});
	}

	function selectCategory(category: string) {
		if (selectedCategory === category) return;

		void animateLayout(() => {
			selectedCategory = category;
		});
		playSfx('select');
	}

	$effect(() => {
		return () => {
			layoutAnimation?.kill();
		};
	});
</script>

<Seo title="Writing" description="Notes, ideas and articles." />

<section class="write-page" {@attach animateWritePage}>
	<header class="write-page__header">
		<span class="write-page__subtitle font-small">index / {filteredPosts.length}</span>
		<h1>Writing</h1>
	</header>

	{#if categories.length > 1}
		<div class="write-page__filter">
			<label class="visually-hidden" for="write-category">Filter by category</label>
			<div class="write-page__select">
				<select
					id="write-category"
					value={selectedCategory}
					data-uisfx-hover="hover"
					onchange={(event) => selectCategory(event.currentTarget.value)}
				>
					<option value="all">All categories</option>
					{#each categories as category (category)}
						<option value={category}>{category}</option>
					{/each}
				</select>
				<svg viewBox="0 0 16 16" aria-hidden="true">
					<path d="M4 6.5 8 10.5 12 6.5" />
				</svg>
			</div>
		</div>
	{/if}

	{#if data.posts.length}
		<div bind:this={gridRef} class="write-page__grid">
			{#each filteredPosts as post (post.id)}
				<div class="write-page__item">
					<BlogCard item={post} />
				</div>
			{/each}
		</div>
	{:else}
		<p class="write-page__empty">Nothing published yet.</p>
	{/if}
</section>

<style>
	.write-page {
		margin-block: 128px;
	}

	.write-page__header {
		display: flex;
		align-items: end;
		justify-content: space-between;
		gap: 24px;
		margin-bottom: 24px;
		padding-bottom: 16px;
		border-bottom: 1px solid var(--color-primary);
	}

	.write-page__filter {
		margin-bottom: 40px;
	}

	.write-page__select {
		position: relative;
		display: inline-flex;
		align-items: center;
		border: 1px solid var(--color-primary);
		border-radius: 4px;
		background-color: var(--color-white);
		color: var(--color-primary);
		transition:
			color 250ms var(--easeOutExpo),
			background-color 250ms var(--easeOutExpo);

		select {
			appearance: none;
			height: 32px;
			padding-inline: 12px 36px;
			border: 0;
			background: none;
			color: inherit;
			font-family: inherit;
			font-size: 0.75rem;
			font-weight: 500;
			cursor: pointer;

			&:focus-visible {
				outline: none;
			}
		}

		/* Native dropdowns inherit the select's colors on some platforms. */
		option {
			background-color: var(--color-white);
			color: var(--color-primary);
		}

		svg {
			position: absolute;
			right: 12px;
			width: 16px;
			height: 16px;
			fill: none;
			stroke: currentColor;
			stroke-linecap: round;
			stroke-linejoin: round;
			stroke-width: 1.25;
			pointer-events: none;
		}

		&:has(select:focus-visible) {
			outline: 2px solid var(--color-primary);
			outline-offset: 2px;
		}

		&:hover {
			background-color: var(--color-primary);
			color: var(--color-white);
		}
	}

	.write-page__subtitle,
	.write-page__empty {
		color: var(--color-quaternary);
	}

	.write-page__grid {
		display: grid;
		grid-template-columns: repeat(1, 1fr);
		gap: 16px;

		@media (--viewport-md-up) {
			grid-template-columns: repeat(2, 1fr);
			gap: 24px;
		}

		@media (--viewport-lg-up) {
			grid-template-columns: repeat(3, 1fr);
		}
	}
</style>
