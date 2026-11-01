<script lang="ts">
	import { readReducedMotion } from '$lib/settings.svelte';
	import { resolve } from '$app/paths';
	import { onMount } from 'svelte';
	import gsap from 'gsap';
	import { ScrollTrigger } from 'gsap/ScrollTrigger';
	import type { WorkItem } from '../../../../utils/types';
	import WorkListCard from './WorkListCard.svelte';

	gsap.registerPlugin(ScrollTrigger);

	let {
		items,
		title,
		subtitle
	}: {
		items: WorkItem[];
		title: string;
		subtitle: string;
	} = $props();
	let sectionRef: HTMLElement;

	const cardAspectRatios = ['16 / 10', '4 / 3', '5 / 4', '16 / 9', '4 / 3', '16 / 10'] as const;

	onMount(() => {
		if (readReducedMotion()) return;

		const context = gsap.context(() => {
			const cards = gsap.utils.toArray<HTMLElement>('.work-list-item');
			const timeline = gsap.timeline({
				scrollTrigger: {
					trigger: sectionRef,
					start: 'top 80%',
					once: true
				}
			});

			timeline
				.from('.latest-work__intro', {
					y: 32,
					opacity: 0,
					duration: 0.7,
					ease: 'power3.out'
				})
				.from(
					cards,
					{
						y: 48,
						opacity: 0,
						scale: 0.98,
						duration: 0.8,
						stagger: 0.1,
						ease: 'power3.out'
					},
					'-=0.35'
				)
				.from(
					'.latest-work > .button',
					{
						y: 20,
						opacity: 0,
						duration: 0.5,
						ease: 'power2.out'
					},
					'-=0.35'
				);
		}, sectionRef);

		return () => context.revert();
	});
</script>

<section class="latest-work" bind:this={sectionRef}>
	<div class="latest-work__intro">
		<p class="latest-work__subtitle font-small">{subtitle}</p>
		<h2 class="latest-work__title">{title}</h2>
	</div>
	{#if items.length > 0}
		<ul class="latest-work__list">
			{#each items.slice(0, 6) as item, index (item.id)}
				<WorkListCard
					{item}
					imageAspectRatio={cardAspectRatios[index]}
					mobileImageAspectRatio="16 / 9"
				/>
			{/each}
		</ul>
		<a
			href={resolve('/work')}
			class="button button--secondary"
			data-uisfx-hover="hover"
			data-uisfx="forward"
		>
			All works
		</a>
	{:else}
		<p class="latest-work__empty">No works found</p>
	{/if}
</section>

<style>
	.latest-work {
		margin-block: 64px 128px;
		display: flex;
		flex-direction: column;
		gap: 24px;

		.latest-work__subtitle {
			color: var(--color-quaternary);
		}

		.latest-work__title {
			max-width: 480px;
		}

		.button {
			margin-inline: auto;
		}

		.latest-work__empty {
			color: var(--color-quaternary);
		}

		.latest-work__list {
			margin: 0;
			padding: 0;
			list-style: none;

			:global(.work-list-item) {
				margin-bottom: 16px;
			}

			@media (--viewport-md-up) {
				display: grid;
				grid-template-columns: repeat(2, minmax(0, 1fr));
				gap: 24px 16px;

				:global(.work-list-item) {
					margin-bottom: 0;
				}
			}

			@media (--viewport-lg-up) {
				grid-template-columns: repeat(3, minmax(0, 1fr));
			}
		}
	}
</style>
