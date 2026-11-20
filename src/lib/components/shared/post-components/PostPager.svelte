<script lang="ts">
	import { resolve } from '$app/paths';
	import { formatShortDate } from '../../../../utils/date';
	import type { AdjacentPost } from '../../../../utils/types';

	let {
		previous = null,
		next = null
	}: {
		previous: AdjacentPost | null;
		next: AdjacentPost | null;
	} = $props();
</script>

<!--
	@component
	Newer / older post navigation for a post page. Hides a direction when that neighbour does not exist.
-->
{#snippet postLink(post: AdjacentPost, direction: 'previous' | 'next')}
	{@const isPrevious = direction === 'previous'}
	<a
		class={[
			'post-pager__link',
			isPrevious ? 'post-pager__link--previous' : 'post-pager__link--next'
		]}
		href={resolve('/write/[slug]', { slug: post.slug })}
		data-uisfx-hover="hover"
		data-uisfx={isPrevious ? 'back' : 'forward'}
	>
		<span class="post-pager__label font-small">
			{#if isPrevious}
				<span aria-hidden="true">←</span> Newer
			{:else}
				Older <span aria-hidden="true">→</span>
			{/if}
		</span>
		<span class="post-pager__title font-heading-3">{post.title}</span>
		<span class="post-pager__meta font-small">
			<time datetime={post.date}>{formatShortDate(post.date)}</time>
			<span aria-hidden="true"> · </span>
			{post.category}
		</span>
	</a>
{/snippet}

{#if previous || next}
	<nav class="post-pager" aria-label="More posts">
		{#if previous}
			{@render postLink(previous, 'previous')}
		{/if}
		{#if next}
			{@render postLink(next, 'next')}
		{/if}
	</nav>
{/if}

<style>
	.post-pager {
		display: grid;
		gap: 16px;
		margin-block: 0 96px;

		@media (--viewport-md-up) {
			grid-template-columns: 1fr 1fr;
			gap: 24px;
		}
	}

	.post-pager__link {
		display: flex;
		flex-direction: column;
		gap: 8px;
		padding: 24px;
		color: inherit;
		text-decoration: none;
		border: 1px solid var(--color-primary);
		border-radius: 4px;
		transition: background-color 250ms var(--easeOutExpo);

		@media (hover: hover) {
			&:hover {
				background-color: var(--color-tertiary);
			}
		}

		@media (--motion-reduce) {
			transition: none;
		}
	}

	.post-pager__link--next {
		text-align: end;

		@media (--viewport-md-up) {
			grid-column: 2;
		}
	}

	.post-pager__label,
	.post-pager__meta {
		color: var(--color-quaternary);
	}

	.post-pager__title {
		margin: 0;
	}
</style>
