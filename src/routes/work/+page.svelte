<script lang="ts">
	import { readReducedMotion } from '$lib/settings.svelte';
	import gsap from 'gsap';
	import Seo from '$lib/components/shared/misc/Seo.svelte';
	import WorkList from '$lib/components/shared/work-components/WorkList.svelte';
	import { appReady } from '$lib/stores/app-ready.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	function animateWorkPage(section: HTMLElement) {
		if (readReducedMotion()) return;

		const header = gsap.utils.toArray<HTMLElement>('.work-page__header > *', section);
		const filters = gsap.utils.toArray<HTMLElement>('.work-list-filter-container button', section);
		const items = gsap.utils.toArray<HTMLElement>('.work-list-item', section);
		const targets = [...header, ...filters, ...items];

		gsap.set(targets, { opacity: 0, y: 10 });

		$effect(() => {
			if (!appReady.ready) return;

			const context = gsap.context(() => {
				const timeline = gsap.timeline({
					defaults: { ease: 'expo.out' }
				});

				timeline.to(header, {
					opacity: 1,
					y: 0,
					duration: 0.3,
					stagger: 0.08
				});

				if (filters.length) {
					timeline.to(
						filters,
						{
							opacity: 1,
							y: 0,
							duration: 0.35,
							stagger: 0.04
						},
						'-=0.15'
					);
				}

				if (items.length) {
					timeline.to(
						items,
						{
							opacity: 1,
							y: 0,
							duration: 0.35,
							stagger: 0.06,
							onComplete() {
								gsap.set(items, { clearProps: 'opacity,transform' });
							}
						},
						'-=0.35'
					);
				}
			}, section);

			return () => context.revert();
		});

		return () => {
			gsap.set(targets, { clearProps: 'opacity,transform' });
		};
	}
</script>

<Seo
	title="Work"
	description="Selected client and personal work — websites, motion-led experiences and custom themes."
/>

<section class="work-page" {@attach animateWorkPage}>
	<header class="work-page__header">
		<span class="work-page__subtitle font-small">index / {data.works.length}</span>
		<h1 class="work-page__title">Work</h1>
	</header>
	{#if data.works.length > 0}
		<WorkList items={data.works} />
	{:else}
		<p class="work-page__empty">No works found</p>
	{/if}
</section>

<style>
	.work-page {
		margin-block: 128px;

		.work-page__title {
			margin-bottom: 16px;
		}
	}

	.work-page__empty {
		color: var(--color-quaternary);
	}
</style>
