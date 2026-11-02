<script lang="ts">
	import type { AboutProps } from '../../../../utils/types';

	const { title, content, src, alt }: AboutProps = $props();
</script>

<section class="about">
	<div class="about__inner">
		<h1>{title}</h1>
		{#if content}
			<div class="about__content">
				<!-- eslint-disable-next-line svelte/no-at-html-tags -- Content comes from the trusted WordPress CMS. -->
				{@html content}
			</div>
		{/if}
	</div>
	{#if src}
		<picture class="about__image-container">
			<img {src} {alt} />
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

		.about__content :global(p) {
			font-size: 1rem;
		}

		.about__content :global(p:first-child) {
			font-weight: 700;
		}

		.about__content :global(a) {
			color: inherit;
			text-decoration: underline;
			text-underline-offset: 0.2em;
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
