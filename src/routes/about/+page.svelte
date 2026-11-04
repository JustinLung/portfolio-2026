<script lang="ts">
	import CardStack from '$lib/components/shared/ui/CardStack.svelte';
	import About from '$lib/components/shared/misc/About.svelte';
	import Experiences from '$lib/components/shared/experiences-components/Experiences.svelte';
	import JsonLd from '$lib/components/shared/misc/JsonLd.svelte';
	import Seo from '$lib/components/shared/misc/Seo.svelte';
	import { personJsonLd } from '../../utils/structured-data';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<JsonLd data={personJsonLd()} />
<Seo
	title={data.page.title}
	description="Justin Lung — creative frontend developer in Amsterdam building accessible, motion-led sites with GSAP, Framer Motion and Next.js. Also a Shopify, WordPress and HubSpot developer."
/>

<About
	title={data.page.title}
	content={data.page.content}
	src={data.page.image ?? '/images/justin.avif'}
	alt={data.page.imageAlt}
/>
<Experiences items={data.experiences} />
{#if data.page.cardImages.length}
	<CardStack title="My life through a lens" cardImages={data.page.cardImages} />
{/if}
