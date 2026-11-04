<script lang="ts">
	import { resolve } from '$app/paths';
	import { formatShortDate } from '../../../../utils/date';

	let {
		image,
		imageAlt,
		title,
		category,
		date,
		readingMinutes
	}: {
		image?: string;
		imageAlt: string;
		title: string;
		category: string;
		date: string;
		readingMinutes?: number;
	} = $props();

	const formattedDate = $derived(formatShortDate(date));
</script>

<header class="write-hero" class:write-hero--no-image={!image}>
	{#if image}
		<figure class="write-hero__media">
			<img src={image} alt={imageAlt} />
		</figure>
	{/if}

	<div class="write-hero__content">
		<nav aria-label="Writing navigation">
			<a
				class="write-hero__back link"
				href={resolve('/write')}
				data-uisfx-hover="hover"
				data-uisfx="back"
			>
				<span aria-hidden="true">←</span>
				All writing
			</a>
		</nav>

		<h1 id="post-title">{title}</h1>

		<div class="write-hero__meta">
			<span>{category}</span>
			<span class="write-hero__divider" aria-hidden="true"></span>
			<time datetime={date}>{formattedDate}</time>
			{#if readingMinutes}
				<span class="write-hero__divider" aria-hidden="true"></span>
				<span>{readingMinutes} min read</span>
			{/if}
		</div>
	</div>
</header>

<style>
	.write-hero {
		display: grid;
		gap: 24px;
		margin-bottom: 32px;
	}

	.write-hero--no-image {
		padding-top: 64px;
	}

	.write-hero__media {
		margin: 0;
		overflow: hidden;
		border-radius: 8px;
		background: var(--color-primary);
		aspect-ratio: 16 / 6;
	}

	.write-hero__media img {
		display: block;
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.write-hero__content {
		display: grid;
		gap: 24px;
		width: 100%;
		max-width: 44rem;
		margin-inline: auto;
	}

	.write-hero__back {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		width: fit-content;
		color: var(--color-quaternary);
		font-size: 0.875rem;
	}

	.write-hero__meta {
		display: flex;
		align-items: center;
		gap: 12px;
		color: var(--color-quaternary);
		font-size: 0.875rem;
	}

	.write-hero__divider {
		width: 1px;
		height: 16px;
		background: currentColor;
		opacity: 0.5;
	}

	@media (--viewport-md-down) {
		.write-hero__media {
			aspect-ratio: 4 / 3;
		}
	}
</style>
