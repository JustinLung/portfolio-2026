<script lang="ts">
	let { target }: { target: HTMLElement | undefined } = $props();

	let progress = $state(0);

	const update = () => {
		if (!target) return;

		const { top, height } = target.getBoundingClientRect();
		const scrollable = height - window.innerHeight;

		progress = scrollable > 0 ? Math.min(1, Math.max(0, -top / scrollable)) : 0;
	};

	$effect(() => {
		if (!target) return;

		update();
		const resizeObserver = new ResizeObserver(update);
		resizeObserver.observe(target);

		return () => resizeObserver.disconnect();
	});
</script>

<svelte:window onscroll={update} onresize={update} />

<div
	class="read-progress"
	role="progressbar"
	aria-label="Reading progress"
	aria-valuemin={0}
	aria-valuemax={100}
	aria-valuenow={Math.round(progress * 100)}
>
	<div class="read-progress__bar" style:transform={`scaleX(${progress})`}></div>
</div>

<style>
	.read-progress {
		position: fixed;
		inset: 0 0 auto 0;
		z-index: 11;
		height: 3px;
		pointer-events: none;

		.read-progress__bar {
			height: 100%;
			background-color: var(--color-light-green);
			transform-origin: left;
			will-change: transform;
		}
	}
</style>
