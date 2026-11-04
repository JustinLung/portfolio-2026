<script lang="ts">
	import RelatedPostsCarousel from '$lib/components/shared/post-components/RelatedPostsCarousel.svelte';
	import JsonLd from '$lib/components/shared/misc/JsonLd.svelte';
	import Seo from '$lib/components/shared/misc/Seo.svelte';
	import PostToc from '$lib/components/shared/post-components/PostToc.svelte';
	import WriteHero from '$lib/components/shared/post-components/WriteHero.svelte';
	import ReadProgress from '$lib/components/shared/ui/ReadProgress.svelte';
	import ShareButtons from '$lib/components/shared/ui/ShareButtons.svelte';
	import { copyCode } from '$lib/actions/copy-code';
	import { htmlToText } from '../../../utils/text';
	import { articleJsonLd } from '../../../utils/structured-data';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	let article = $state<HTMLElement>();

	const jsonLd = $derived(
		articleJsonLd({
			slug: data.post.slug,
			title: htmlToText(data.post.title),
			description: data.post.excerpt
				? htmlToText(data.post.excerpt).replace(/\s*\[…\]$/, '…')
				: undefined,
			date: data.post.date
		})
	);
</script>

<Seo
	title={data.post.title}
	description={data.post.excerpt ?? data.post.title}
	ogType="article"
	ogImage={`/og/write/${data.post.slug}.png`}
	ogImageAlt={data.post.title}
/>

<JsonLd data={jsonLd} />

<ReadProgress target={article} />

<article bind:this={article} class="post" aria-labelledby="post-title">
	<WriteHero
		image={data.post.image}
		imageAlt={data.post.imageAlt}
		title={data.post.title}
		category={data.post.category}
		date={data.post.date}
		readingMinutes={data.readingMinutes}
	/>

	{#if data.post.content}
		<div class="post__body">
			<aside class="post__toc">
				<PostToc items={data.toc} />
			</aside>

			<div class="post__content" use:copyCode={data.post.content}>
				<!-- eslint-disable-next-line svelte/no-at-html-tags -- Content comes from the trusted WordPress CMS. -->
				{@html data.post.content}
			</div>
		</div>
	{/if}

	<footer class="post__share">
		<ShareButtons title={data.post.title} />
	</footer>
</article>

<RelatedPostsCarousel posts={data.relatedPosts} title="Related posts" />

<style>
	.post {
		margin-block: 64px 128px;
	}

	.post__body {
		display: grid;
		grid-template-columns: minmax(0, 1fr);

		@media (--viewport-xl-up) {
			grid-template-columns: 1fr minmax(0, 44rem) 1fr;
			column-gap: 48px;
		}
	}

	.post__toc {
		max-width: 44rem;
		margin: 0 auto 32px;
		width: 100%;

		@media (--viewport-xl-up) {
			grid-column: 3;
			grid-row: 1;
			max-width: 14rem;
			margin: 0;
			align-self: start;
			position: sticky;
			top: 96px;
		}
	}

	.post__content {
		width: 100%;
		max-width: 44rem;
		margin-inline: auto;

		@media (--viewport-xl-up) {
			grid-column: 2;
			grid-row: 1;
		}
	}

	.post__content :global(h2),
	.post__content :global(h3) {
		scroll-margin-top: 96px;
	}

	.post__share {
		max-width: 44rem;
		margin: 48px auto 0;
		padding-top: 24px;
		border-top: 1px solid var(--color-primary);
	}

	.post__content :global(p) {
		font-size: 1rem;
	}

	.post__content :global(img) {
		display: block;
		width: 100%;
		height: auto;
		border-radius: 4px;
	}

	.post__content :global(a) {
		color: inherit;
		text-decoration: underline;
		text-underline-offset: 0.2em;
	}

	.post__content :global(code) {
		font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
		font-size: 0.875em;
		background: var(--color-tertiary);
		padding: 0.15em 0.4em;
		border-radius: 4px;
	}

	.post__content :global(pre) {
		background: var(--color-tertiary);
		padding: 1rem 1.25rem;
		border-radius: 8px;
		overflow-x: auto;
		margin-block: 1.5rem;
	}

	.post__content :global(.code-block) {
		position: relative;
		margin-block: 1.5rem;
	}

	.post__content :global(.code-block pre) {
		margin: 0;
		padding-right: 5rem;
	}

	.post__content :global(.code-block__copy) {
		position: absolute;
		top: 0.5rem;
		right: 0.5rem;
		padding: 0.25rem 0.625rem;
		font: inherit;
		font-size: 0.75rem;
		color: inherit;
		background: var(--color-secondary);
		border: 1px solid var(--color-primary);
		border-radius: 4px;
		cursor: pointer;
		opacity: 0.7;
		transition: opacity 0.15s;

		&:hover,
		&:focus-visible {
			opacity: 1;
		}
	}

	.post__content :global(pre code) {
		background: none;
		padding: 0;
		border-radius: 0;
		font-size: 0.85em;
		line-height: 1.6;
	}
</style>
