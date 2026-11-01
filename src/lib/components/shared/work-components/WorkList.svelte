<script lang="ts">
	import { readReducedMotion } from '$lib/settings.svelte';
	import { tick } from 'svelte';
	import gsap from 'gsap';
	import { Flip } from 'gsap/Flip';
	import WorkListCard from './WorkListCard.svelte';
	import WorkListRow from './WorkListRow.svelte';
	import type { WorkItem } from '../../../../utils/types';
	import { playSfx } from '$lib/sfx.svelte';

	gsap.registerPlugin(Flip);

	let { items }: { items: WorkItem[] } = $props();

	let selectedCategory = $state('all');
	let viewMode = $state<'grid' | 'list'>('list');
	let listRef: HTMLUListElement | null = null;
	let layoutAnimation: gsap.core.Timeline | null = null;
	let categories = $derived([
		...new Set(
			items.flatMap((item) =>
				item.categories?.length ? item.categories.map((category) => category.name) : [item.category]
			)
		)
	]);
	let filteredItems = $derived(
		selectedCategory === 'all'
			? items
			: items.filter((item) =>
					item.categories?.length
						? item.categories.some((category) => category.name === selectedCategory)
						: item.category === selectedCategory
				)
	);

	async function animateLayout(update: () => void) {
		const reduceMotion = readReducedMotion();
		const currentItems = listRef?.querySelectorAll('.work-list-item');
		layoutAnimation?.kill();

		if (currentItems?.length) {
			gsap.killTweensOf(currentItems);
			Flip.killFlipsOf(currentItems);
			gsap.set(currentItems, {
				clearProps:
					'position,top,left,width,height,maxWidth,maxHeight,minWidth,minHeight,transform,opacity'
			});
		}

		const state = !reduceMotion && currentItems?.length ? Flip.getState(currentItems) : null;

		update();
		await tick();

		if (!state || !listRef) return;

		const nextItems = listRef.querySelectorAll('.work-list-item');
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
			ease: 'power2.inOut',
			prune: true,
			onEnter: (elements) =>
				gsap.fromTo(
					elements,
					{ opacity: 0, y: 12 },
					{ opacity: 1, y: 0, duration: 0.3, ease: 'power2.out', stagger: 0.03 }
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

	function selectViewMode(mode: 'grid' | 'list') {
		if (viewMode === mode) return;

		void animateLayout(() => {
			viewMode = mode;
		});
		playSfx('select');
	}

	$effect(() => {
		return () => {
			layoutAnimation?.kill();
		};
	});
</script>

<!--
	@component
	Filters portfolio items and switches between list and grid presentations with FLIP transitions.
-->
<div class="work-list-filter-container">
	<div class="work-list-filter">
		<button
			type="button"
			class={selectedCategory === 'all' ? 'button button--secondary' : 'button'}
			aria-pressed={selectedCategory === 'all'}
			data-uisfx-hover="hover"
			onclick={() => selectCategory('all')}
		>
			All
		</button>
		{#each categories as category (category)}
			<button
				type="button"
				class={selectedCategory === category ? 'button button--secondary' : 'button'}
				aria-pressed={selectedCategory === category}
				data-uisfx-hover="hover"
				onclick={() => selectCategory(category)}
			>
				{category}
			</button>
		{/each}
	</div>

	<div class="work-list-filter-grid-toggle">
		<button
			type="button"
			class="button work-list-view-button"
			class:button--secondary={viewMode === 'list'}
			aria-pressed={viewMode === 'list'}
			data-uisfx-hover="hover"
			onclick={() => selectViewMode('list')}
		>
			<span class="visually-hidden">List view</span>
			<svg viewBox="0 0 16 16" aria-hidden="true">
				<circle cx="2.5" cy="3.5" r="0.75" fill="currentColor" stroke="none" />
				<circle cx="2.5" cy="8" r="0.75" fill="currentColor" stroke="none" />
				<circle cx="2.5" cy="12.5" r="0.75" fill="currentColor" stroke="none" />
				<path d="M5 3.5h8.5M5 8h8.5M5 12.5h8.5" />
			</svg>
		</button>
		<button
			type="button"
			class="button work-list-view-button"
			class:button--secondary={viewMode === 'grid'}
			aria-pressed={viewMode === 'grid'}
			data-uisfx-hover="hover"
			onclick={() => selectViewMode('grid')}
		>
			<span class="visually-hidden">Grid view</span>
			<svg viewBox="0 0 16 16" aria-hidden="true">
				<rect x="1.5" y="1.5" width="5" height="5" rx="0.5" />
				<rect x="9.5" y="1.5" width="5" height="5" rx="0.5" />
				<rect x="1.5" y="9.5" width="5" height="5" rx="0.5" />
				<rect x="9.5" y="9.5" width="5" height="5" rx="0.5" />
			</svg>
		</button>
	</div>
</div>

<ul bind:this={listRef} class={viewMode === 'grid' ? 'work-list work-list--grid' : 'work-list'}>
	{#each filteredItems as item (item.id)}
		{#if viewMode === 'grid'}
			<WorkListCard {item} />
		{:else}
			<WorkListRow {item} />
		{/if}
	{/each}
</ul>

<style>
	.work-list-filter-container {
		display: flex;
		justify-content: space-between;
		margin-bottom: 24px;

		.work-list-filter {
			display: flex;
			flex-wrap: wrap;
			gap: 8px;
		}

		.work-list-filter-grid-toggle {
			display: flex;
			gap: 8px;
		}

		.work-list-view-button {
			width: 32px;
			padding-inline: 0;

			svg {
				width: 16px;
				height: 16px;
				fill: none;
				stroke: currentColor;
				stroke-linecap: round;
				stroke-linejoin: round;
				stroke-width: 1.25;
			}
		}
	}

	.work-list {
		display: grid;
		gap: 0;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.work-list.work-list--grid {
		gap: 24px;
		border-top: 0;
	}

	@media (--viewport-md-up) {
		.work-list {
			gap: 24px;
			border-top: 0;
		}

		.work-list.work-list--grid {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}

		.work-list:not(.work-list--grid) {
			display: block;
		}
	}

	@media (--viewport-lg-up) {
		.work-list.work-list--grid {
			grid-template-columns: repeat(3, minmax(0, 1fr));
		}
	}
</style>
