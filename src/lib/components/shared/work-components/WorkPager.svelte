<script lang="ts">
	import { resolve } from '$app/paths';
	import previewPlaceholder from '$lib/assets/work-preview-placeholder.svg';
	import type { AdjacentWork } from '../../../../utils/types';

	let {
		previous = null,
		next = null
	}: {
		previous: AdjacentWork | null;
		next: AdjacentWork | null;
	} = $props();
</script>

<!--
	@component
	Previous / next project navigation for a work detail page.
	Hides a direction when that neighbour does not exist.
-->
{#snippet projectLink(work: AdjacentWork, direction: 'previous' | 'next')}
	{@const isPrevious = direction === 'previous'}
	<a
		class={[
			'work-pager__link',
			isPrevious ? 'work-pager__link--previous' : 'work-pager__link--next'
		]}
		href={resolve('/work/[slug]', { slug: work.slug })}
		aria-label="{isPrevious ? 'Previous' : 'Next'} project: {work.title}"
		data-uisfx-hover="hover"
		data-uisfx={isPrevious ? 'back' : 'forward'}
	>
		<span class="work-pager__copy">
			<span class="work-pager__label font-small">
				{#if isPrevious}
					<span class="work-pager__arrow" aria-hidden="true">←</span>
					Previous
				{:else}
					Next
					<span class="work-pager__arrow" aria-hidden="true">→</span>
				{/if}
			</span>
			<span class="work-pager__title font-heading-3">{work.title}</span>
			<span class="work-pager__meta font-small">
				{#if work.year}
					<time datetime={String(work.year)}>{work.year}</time>
				{/if}
				{#if work.year && work.category}
					<span aria-hidden="true"> · </span>
				{/if}
				{#if work.category}
					{work.category}
				{/if}
			</span>
		</span>
		<figure class="work-pager__media">
			<img src={work.image ?? previewPlaceholder} alt={work.imageAlt} />
		</figure>
	</a>
{/snippet}

{#if previous || next}
	<nav class="work-pager" aria-label="Adjacent projects">
		{#if previous}
			{@render projectLink(previous, 'previous')}
		{/if}
		{#if next}
			{@render projectLink(next, 'next')}
		{/if}
	</nav>
{/if}

<style>
	.work-pager {
		display: grid;
		margin-block: 64px 128px;
		border-top: 1px solid var(--color-primary);

		.work-pager__link {
			display: grid;
			gap: 24px;
			padding-block: 32px;
			color: inherit;
			text-decoration: none;

			.work-pager__copy {
				display: grid;
				gap: 8px;
				min-width: 0;
			}

			.work-pager__label {
				display: inline-flex;
				align-items: center;
				gap: 8px;
				color: var(--color-quaternary);
				transition: color 300ms var(--easeOutExpo);
			}

			.work-pager__arrow {
				display: inline-block;
				transition: transform 300ms var(--easeOutExpo);
			}

			.work-pager__title {
				width: fit-content;
				max-width: 100%;
				background-image: linear-gradient(currentColor, currentColor);
				background-position: left bottom;
				background-size: 0 1px;
				background-repeat: no-repeat;
				overflow-wrap: anywhere;
				transition: background-size 300ms var(--easeOutExpo);
			}

			.work-pager__meta {
				color: var(--color-quaternary);
			}

			.work-pager__media {
				margin: 0;
				overflow: hidden;
				border-radius: 4px;

				img {
					display: block;
					width: 100%;
					height: auto;
					aspect-ratio: 16 / 9;
					object-fit: cover;
					object-position: center;
					transition: transform 450ms var(--easeOutExpo);
				}
			}

			&:hover,
			&:focus-visible {
				.work-pager__label {
					color: var(--color-white);
				}

				.work-pager__title {
					background-size: 100% 1px;
				}

				.work-pager__media img {
					transform: scale(1.25);
				}
			}

			&:focus-visible {
				outline: 2px solid var(--color-white);
				outline-offset: 4px;
			}
		}

		.work-pager__link--previous {
			&:hover .work-pager__arrow,
			&:focus-visible .work-pager__arrow {
				transform: translateX(-4px);
			}
		}

		.work-pager__link--next {
			.work-pager__copy {
				justify-items: end;
				text-align: right;
			}

			.work-pager__title {
				background-position: right bottom;
			}

			&:hover .work-pager__arrow,
			&:focus-visible .work-pager__arrow {
				transform: translateX(4px);
			}
		}

		.work-pager__link--previous:not(:last-child) {
			border-bottom: 1px solid var(--color-primary);
		}

		@media (--viewport-md-up) {
			grid-template-columns: 1fr 1fr;

			.work-pager__link {
				padding-block: 48px;
			}

			.work-pager__link--previous {
				padding-right: 32px;
				border-right: 1px solid var(--color-primary);
			}

			.work-pager__link--previous:not(:last-child) {
				border-bottom: none;
			}

			.work-pager__link--next {
				grid-column: 2;
				padding-left: 32px;
			}

			.work-pager__link--next:first-child {
				border-left: 1px solid var(--color-primary);
			}
		}

		@media (--motion-reduce) {
			.work-pager__link {
				.work-pager__label,
				.work-pager__arrow,
				.work-pager__title,
				.work-pager__media img {
					transition: none;
				}

				&:hover .work-pager__arrow,
				&:focus-visible .work-pager__arrow,
				&:hover .work-pager__media img,
				&:focus-visible .work-pager__media img {
					transform: none;
				}
			}
		}
	}
</style>
