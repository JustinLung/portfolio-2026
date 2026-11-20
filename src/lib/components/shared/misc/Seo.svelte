<script lang="ts">
	import { page } from '$app/state';
	import { SITE_URL } from '../../../../utils/site';
	import { htmlToText, truncateText } from '../../../../utils/text';
	import type { SeoProps } from '../../../../utils/types';

	let {
		title,
		description,
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
	// Search results cut descriptions at about 160 characters, so a long excerpt is shortened here.
	const plainDescription = $derived(
		description ? truncateText(htmlToText(description).replace(/\s*\[…\]$/, '…'), 160) : undefined
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
	<link rel="canonical" href={pageUrl} />
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
