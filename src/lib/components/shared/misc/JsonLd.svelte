<script lang="ts">
	let { data }: { data: Record<string, unknown> } = $props();

	// `<` is escaped so CMS text containing a closing script tag cannot end the block early.
	const json = $derived(JSON.stringify(data).replace(/</g, '\\u003c'));
	const tag = $derived(`<script type="application/ld+json">${json}<${'/'}script>`);
</script>

<!--
	@component
	Renders a schema.org JSON-LD block in the document head.
-->
<svelte:head>
	<!-- eslint-disable-next-line svelte/no-at-html-tags -- Serialised and `<`-escaped above. -->
	{@html tag}
</svelte:head>
