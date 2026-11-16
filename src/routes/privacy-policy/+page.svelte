<script lang="ts">
	import Seo from '$lib/components/shared/misc/Seo.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<Seo title={data.page.title ?? 'Privacy Policy'} description={data.page.content ?? undefined} />

<article class="privacy-policy">
	<h1>{data.page.title}</h1>

	{#if data.page.content}
		<div class="privacy-policy__content prose">
			<!-- eslint-disable-next-line svelte/no-at-html-tags -- Content comes from the trusted WordPress CMS. -->
			{@html data.page.content}
		</div>
	{/if}
</article>

<style>
	.privacy-policy {
		max-width: 48rem;
		margin-inline: auto;
		padding-block: 128px;
	}

	.privacy-policy__content :global(li) {
		font-size: 1rem;
	}
</style>
