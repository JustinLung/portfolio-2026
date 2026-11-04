<script lang="ts">
	import { RSS_TITLE } from '../utils/site';
	import '../lib/css/app.css';
	import '../lib/css/normalize.css';
	import '../lib/css/colors.css';
	import '../lib/css/typography.css';
	import '../lib/css/variables.css';
	import '../lib/css/button.css';
	import '../utils/easter-egg';
	import favicon from '$lib/assets/favicon.ico';
	import CustomCursor from '$lib/components/shared/ui/CustomCursor.svelte';
	import Footer from '$lib/components/layout/Footer.svelte';
	import Header from '$lib/components/layout/Header.svelte';
	import Lenis from '$lib/components/shared/ui/Lenis.svelte';
	import PageTransition from '$lib/components/shared/ui/PageTransition.svelte';
	import SiteLoader from '$lib/components/shared/ui/SiteLoader.svelte';
	import { initializeSettings, settings } from '$lib/settings.svelte';
	import { initializeSfx, setSfxVolume, unlockSfx } from '$lib/sfx.svelte';
	import { initializeTheme } from '$lib/theme.svelte';
	import { onMount } from 'svelte';
	import SkipMainContent from '$lib/components/shared/ui/SkipMainContent.svelte';

	let { children } = $props();

	onMount(() => {
		initializeTheme();
		initializeSettings();

		const destroySfx = initializeSfx(document);

		const unlock = () => {
			window.removeEventListener('pointerdown', unlock, true);
			window.removeEventListener('keydown', unlock, true);
			void unlockSfx();
		};

		window.addEventListener('pointerdown', unlock, { capture: true });
		window.addEventListener('keydown', unlock, { capture: true });

		return () => {
			window.removeEventListener('pointerdown', unlock, true);
			window.removeEventListener('keydown', unlock, true);
			void destroySfx();
		};
	});

	$effect(() => setSfxVolume(settings.volume));
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<link rel="alternate" type="application/rss+xml" title={RSS_TITLE} href="/rss.xml" />
</svelte:head>

<SiteLoader />
<Lenis />
<PageTransition />
<CustomCursor />
<Header />
<SkipMainContent />
<main id="main" class="container" tabindex="-1">
	{@render children()}
</main>
<Footer />
