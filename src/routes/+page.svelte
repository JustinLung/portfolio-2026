<script lang="ts">
	import Hero from '$lib/components/shared/hero-components/Hero.svelte';
	import KineticManifesto from '$lib/components/shared/ui/KineticManifesto.svelte';
	import LatestWork from '$lib/components/shared/work-components/LatestWork.svelte';
	import PersonalIntro from '$lib/components/shared/misc/PersonalIntro.svelte';
	import RelatedPostsCarousel from '$lib/components/shared/post-components/RelatedPostsCarousel.svelte';
	import JsonLd from '$lib/components/shared/misc/JsonLd.svelte';
	import Seo from '$lib/components/shared/misc/Seo.svelte';
	import { personJsonLd } from '../utils/structured-data';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<JsonLd data={personJsonLd()} />
<Seo
	title={data.page.hero.subtitle}
	description="Justin Lung — creative frontend developer in Amsterdam building accessible, motion-led sites with GSAP, Framer Motion and Next.js."
/>

<Hero title={data.page.hero.title} subtitle={data.page.hero.subtitle} />
<KineticManifesto />
<LatestWork
	items={data.works}
	title={data.page.latestWork.title}
	subtitle={data.page.latestWork.subtitle}
/>
<RelatedPostsCarousel posts={data.relatedPosts} title="Latest posts" />
<PersonalIntro
	title={data.page.personal.title}
	subtitle={data.page.personal.subtitle}
	description={data.page.personal.text}
	image={data.page.personal.image}
	imageAlt={data.page.personal.imageAlt}
/>
