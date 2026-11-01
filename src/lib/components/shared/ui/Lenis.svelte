<script lang="ts">
	import Lenis from 'lenis';
	import { prefersReducedMotion } from '$lib/settings.svelte';

	$effect(() => {
		// Native scrolling is the calmer option when motion is reduced.
		if (prefersReducedMotion()) return;

		const lenis = new Lenis();
		let frame = 0;

		window.Lenis = lenis;

		function raf(time: number) {
			lenis.raf(time);
			frame = requestAnimationFrame(raf);
		}

		frame = requestAnimationFrame(raf);

		return () => {
			cancelAnimationFrame(frame);
			lenis.destroy();
			window.Lenis = undefined;
		};
	});
</script>
