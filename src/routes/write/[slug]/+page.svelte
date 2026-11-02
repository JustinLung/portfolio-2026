<script lang="ts">
	import RelatedPostsCarousel from '$lib/components/shared/post-components/RelatedPostsCarousel.svelte';
	import Seo from '$lib/components/shared/misc/Seo.svelte';
	import WriteHero from '$lib/components/shared/post-components/WriteHero.svelte';
	import ReadProgress from '$lib/components/shared/ui/ReadProgress.svelte';
	import ShareButtons from '$lib/components/shared/ui/ShareButtons.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	let article = $state<HTMLElement>();
</script>

<Seo
	title={data.post.title}
	description={data.post.excerpt ?? data.post.title}
	ogType="article"
	ogImage={`/og/write/${data.post.slug}.png`}
	ogImageAlt={data.post.title}
/>

<ReadProgress target={article} />

<article bind:this={article} class="post" aria-labelledby="post-title">
	<WriteHero
		image={data.post.image}
		imageAlt={data.post.imageAlt}
		title={data.post.title}
		category={data.post.category}
		date={data.post.date}
	/>

	{#if data.post.content}
		<div class="post__content">
			<!-- eslint-disable-next-line svelte/no-at-html-tags -- Content comes from the trusted WordPress CMS. -->
			{@html data.post.content}
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

	.post__content {
		max-width: 44rem;
		margin-inline: auto;
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

	.post__content :global(pre code) {
		background: none;
		padding: 0;
		border-radius: 0;
		font-size: 0.85em;
		line-height: 1.6;
	}
</style>
