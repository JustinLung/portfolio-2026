<script lang="ts">
	import { imageAttrs } from '../../../../utils/image';
	import { resolve } from '$app/paths';
	import { formatShortDate } from '../../../../utils/date';
	import type { PostItem } from '../../../../utils/types';

	let { item }: { item: PostItem } = $props();

	const formattedDate = $derived(formatShortDate(item.date));
</script>

<article class="blog-card">
	<a
		class="blog-card__link"
		href={resolve('/write/[slug]', { slug: item.slug })}
		data-uisfx-hover="hover"
		data-uisfx="forward"
	>
		<figure class:blog-card__media--empty={!item.image} class="blog-card__media">
			{#if item.image}
				<img
					src={item.image}
					alt={item.imageAlt}
					loading="lazy"
					{...imageAttrs(
						item.imageMeta,
						'(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw'
					)}
				/>
			{:else}
				<span aria-hidden="true">{item.title.slice(0, 1)}</span>
			{/if}
		</figure>

		<div class="blog-card__meta">
			<span class="blog-card__category">{item.category}</span>
			<span class="blog-card__divider" aria-hidden="true"></span>
			<time datetime={item.date}>{formattedDate}</time>
		</div>

		<h2 class="blog-card__title">{item.title}</h2>
	</a>
</article>

<style>
	.blog-card {
		min-width: 0;

		.blog-card__link {
			display: block;
			color: inherit;
			text-decoration: none;
		}

		.blog-card__media {
			position: relative;
			margin: 0 0 24px;
			overflow: hidden;
			border-radius: 4px;
			background: var(--color-primary);
			aspect-ratio: 16 / 9;

			img {
				display: block;
				width: 100%;
				height: 100%;
				object-fit: cover;
				transition: transform 500ms var(--easeOutExpo);
				aspect-ratio: 16 / 9;
			}
		}

		.blog-card__media--empty {
			display: grid;
			place-items: center;
			background:
				linear-gradient(135deg, transparent 48%, rgb(255 255 255 / 8%) 48% 52%, transparent 52%),
				var(--color-primary);

			span {
				color: var(--color-quaternary);
				font-family: var(--font-family-heading);
				font-size: clamp(4rem, 10vw, 8rem);
			}
		}

		.blog-card__meta {
			display: flex;
			align-items: center;
			gap: 12px;
			margin-bottom: 16px;
			color: var(--color-quaternary);
			font-size: 0.875rem;
			line-height: 1;
		}

		.blog-card__category {
			min-height: 32px;
			padding-inline: 16px;
			display: grid;
			place-items: center;
			border-radius: 999px;
			background: var(--color-primary);
			color: var(--color-white);
		}

		.blog-card__divider {
			width: 1px;
			height: 18px;
			background: var(--color-quaternary);
			opacity: 0.5;
		}

		.blog-card__title {
			font-size: 1.125rem;
			text-wrap: balance;
			transition: color 300ms ease;
		}

		.blog-card__link:hover,
		.blog-card__link:focus-visible {
			.blog-card__media img {
				transform: scale(1.25);
			}

			.blog-card__title {
				color: var(--color-quaternary);
			}
		}

		.blog-card__link:focus-visible {
			outline: 2px solid var(--color-white);
			outline-offset: 6px;
		}
	}
</style>
