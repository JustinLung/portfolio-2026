<script lang="ts">
	import Seo from '$lib/components/shared/misc/Seo.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<Seo title={data.page.title ?? 'Terms of Service'} description={data.page.content ?? undefined} />

<article class="terms-of-service">
	<h1>{data.page.title}</h1>

	{#if data.page.content}
		<div class="terms-of-service__content">
			<!-- eslint-disable-next-line svelte/no-at-html-tags -- Content comes from the trusted WordPress CMS. -->
			{@html data.page.content}
		</div>
	{/if}
</article>

<style>
	.terms-of-service {
		max-width: 48rem;
		margin-inline: auto;
		padding-block: 128px;
	}

	.terms-of-service__content :global(p),
	.terms-of-service__content :global(li) {
		font-size: 1rem;
	}

	.terms-of-service__content :global(a) {
		color: inherit;
		text-decoration: underline;
		text-underline-offset: 0.2em;
	}
</style>
