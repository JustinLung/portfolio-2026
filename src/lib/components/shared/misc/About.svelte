<script lang="ts">
	import { imageAttrs } from '../../../../utils/image';
	import type { AboutProps } from '../../../../utils/types';

	const { title, content, src, alt, imageMeta }: AboutProps = $props();
</script>

<section class="about">
	<div class="about__inner">
		<h1>{title}</h1>
		{#if content}
			<div class="about__content prose">
				<!-- eslint-disable-next-line svelte/no-at-html-tags -- Content comes from the trusted WordPress CMS. -->
				{@html content}
			</div>
		{/if}
	</div>
	{#if src}
		<picture class="about__image-container">
			<img {src} {alt} {...imageAttrs(imageMeta, '(min-width: 1280px) 50vw, 100vw')} />
		</picture>
	{/if}
</section>

<style>
	.about {
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		gap: 64px;
		margin-top: calc(var(--header-height) + 64px);

		@media (--viewport-xl-up) {
			flex-direction: row;
		}

		.about__inner {
			@media (--viewport-xl-up) {
				max-width: 650px;
			}
		}

		.about__content :global(p:first-child) {
			font-weight: 700;
		}

		picture {
			position: sticky;
			top: calc(var(--header-height) + 32px);
			align-self: flex-start;

			img {
				width: 100%;
				aspect-ratio: 5 / 4;
				object-fit: cover;
			}
		}
	}
</style>
