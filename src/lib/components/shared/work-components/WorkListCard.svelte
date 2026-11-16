<script lang="ts">
	import { imageAttrs } from '../../../../utils/image';
	import { resolve } from '$app/paths';
	import previewPlaceholder from '$lib/assets/work-preview-placeholder.svg';
	import type { WorkItem } from '../../../../utils/types';

	let {
		item,
		imageAspectRatio = '16 / 9',
		mobileImageAspectRatio = imageAspectRatio
	}: { item: WorkItem; imageAspectRatio?: string; mobileImageAspectRatio?: string } = $props();
</script>

<!--
	@component
	A grid presentation of a portfolio item with an inline image preview.
-->
<li
	class="work-list-item"
	style={`--work-card-aspect-ratio: ${imageAspectRatio}; --work-card-mobile-aspect-ratio: ${mobileImageAspectRatio};`}
>
	<a
		href={resolve('/work/[slug]', { slug: item.slug })}
		class="work-list-item__link"
		data-uisfx-hover="hover"
		data-uisfx="forward"
	>
		<figure class="work-list-item__media">
			<img
				src={item.image ?? previewPlaceholder}
				alt={item.imageAlt ?? item.title}
				{...imageAttrs(item.imageMeta, '(min-width: 1024px) 50vw, 100vw')}
			/>
		</figure>
		<span class="work-list-item__title">{item.title}</span>
		<span class="work-list-item__category">{item.category}</span>
		{#if item.year}
			<span class="work-list-item__year">{item.year}</span>
		{/if}
	</a>
</li>

<style>
	.work-list-item {
		position: relative;

		.work-list-item__link {
			position: relative;
			z-index: 1;
			display: grid;
			grid-template-columns: auto 1fr auto;
			gap: 8px 4px;
			width: 100%;
			padding: 0;
			color: var(--color-white);
			font-size: 0.875rem;
			text-decoration: none;

			.work-list-item__media {
				display: block;
				grid-column: 1 / -1;
				margin: 0;
				overflow: hidden;
				border-radius: 4px;

				img {
					display: block;
					width: 100%;
					height: auto;
					aspect-ratio: var(--work-card-mobile-aspect-ratio);
					object-fit: cover;
					transition: transform 300ms var(--easeOutExpo);

					@media (--viewport-md-up) {
						aspect-ratio: var(--work-card-aspect-ratio);
					}
				}
			}

			&:hover,
			&:focus-visible {
				.work-list-item__media img {
					transform: scale(1.25);
				}
			}

			.work-list-item__category,
			.work-list-item__year {
				color: var(--color-quaternary);
			}

			.work-list-item__category::before {
				content: '• ';
			}

			.work-list-item__year {
				grid-column: 3;
			}

			@media (prefers-reduced-motion: reduce) {
				.work-list-item__media img {
					transition: none;
				}
			}
		}
	}
</style>
