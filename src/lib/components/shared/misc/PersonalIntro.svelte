<script lang="ts">
	import { readReducedMotion } from '$lib/settings.svelte';
	import { resolve } from '$app/paths';
	import { onMount } from 'svelte';
	import gsap from 'gsap';
	import { ScrollTrigger } from 'gsap/ScrollTrigger';

	gsap.registerPlugin(ScrollTrigger);

	import type { PersonalIntroProps } from '../../../../utils/types';

	let { title, subtitle, description, image, imageAlt }: PersonalIntroProps = $props();
	let sectionRef: HTMLElement;

	onMount(() => {
		if (readReducedMotion()) return;

		const context = gsap.context(() => {
			const timeline = gsap.timeline({
				scrollTrigger: {
					trigger: sectionRef,
					start: 'top 78%',
					once: true
				}
			});

			timeline
				.from('.personal-intro__content > *', {
					opacity: 0,
					y: 24,
					duration: 0.65,
					stagger: 0.08,
					ease: 'expo.out'
				})
				.from(
					'.personal-intro__image',
					{
						clipPath: 'inset(0 0 100% 0)',
						duration: 0.9,
						ease: 'expo.out'
					},
					0.1
				)
				.from(
					'.personal-intro__image img',
					{
						scale: 1.08,
						duration: 1.1,
						ease: 'expo.out'
					},
					0.1
				);
		}, sectionRef);

		return () => context.revert();
	});
</script>

<section class="personal-intro" bind:this={sectionRef}>
	<div class="personal-intro__content">
		<span class="personal-intro__eyebrow font-small">{subtitle}</span>
		<h2 class="personal-intro__title">{title}</h2>
		<p class="personal-intro__description">{description}</p>
		<a
			href={resolve('/about')}
			class="button button--secondary"
			data-uisfx-hover="hover"
			data-uisfx="forward"
		>
			Read more →
			<span class="visually-hidden">{title}</span>
		</a>
	</div>
	<figure class="personal-intro__image">
		<img src={image} alt={imageAlt} loading="lazy" />
	</figure>
</section>

<style>
	.personal-intro {
		display: grid;
		gap: 48px;
		margin-bottom: 128px;
		padding-top: 24px;
		border-top: 1px solid var(--color-primary);
	}

	.personal-intro__content {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 16px;
	}

	.personal-intro__eyebrow {
		color: var(--color-quaternary);
	}

	.personal-intro__description {
		max-width: 34rem;
		margin: 0;
		color: var(--color-quaternary);
	}

	.personal-intro__image {
		margin: 0;
		overflow: hidden;
		border-radius: 4px;
		aspect-ratio: 4 / 3;

		img {
			display: block;
			width: 100%;
			height: 100%;
			object-fit: cover;
		}
	}

	@media (--viewport-md-up) {
		.personal-intro {
			grid-template-columns: repeat(2, minmax(0, 1fr));
			align-items: stretch;
		}
	}
</style>
