<script lang="ts">
	import { page } from '$app/state';
	import { SITE_URL } from '../../../../utils/site';
	import { htmlToText } from '../../../../utils/text';
	import type { SeoProps } from '../../../../utils/types';

	const DEFAULT_KEYWORDS =
		'Justin, Creative Coder, Amsterdam, GSAP, Framer Motion, Next.js, SvelteKit';

	let {
		title,
		description,
		keywords = DEFAULT_KEYWORDS,
		author = 'Justin',
		robots = 'index, follow',
		ogImage,
		ogImageAlt,
		ogType = 'website'
	}: SeoProps = $props();

	// A PNG: LinkedIn and X don't render AVIF, which the portrait is.
	const DEFAULT_IMAGE = '/og/default.png';

	// Social scrapers need absolute URLs, and the canonical origin rather than a preview deployment's.
	const absolute = (path: string) => new URL(path, SITE_URL).href;
	const pageUrl = $derived(absolute(page.url.pathname));
	const imageUrl = $derived(absolute(ogImage ?? DEFAULT_IMAGE));

	const documentTitle = $derived(`Portfolio | ${title}`);

	// WordPress excerpts are HTML with entities (`&#8217;`) and a `[&hellip;]` read-more marker.
	const plainDescription = $derived(
		description ? htmlToText(description).replace(/\s*\[…\]$/, '…') : undefined
	);
</script>

<!--
	@component
	Sets document title and shared SEO meta tags for a route.
	Titles are formatted as `Portfolio | {title}`.
-->
<svelte:head>
	<title>{documentTitle}</title>
	{#if plainDescription}
		<meta name="description" content={plainDescription} />
	{/if}
	<meta name="keywords" content={keywords} />
	<meta name="author" content={author} />
	<meta name="robots" content={robots} />
	<meta property="og:title" content={documentTitle} />
	<meta property="og:description" content={plainDescription} />
	<meta property="og:type" content={ogType} />
	<meta property="og:url" content={pageUrl} />
	<meta property="og:image" content={imageUrl} />
	<meta property="og:image:alt" content={ogImageAlt ?? documentTitle} />
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />
	<meta property="og:image:type" content="image/png" />
	<meta name="twitter:card" content="summary_large_image" />
</svelte:head>
