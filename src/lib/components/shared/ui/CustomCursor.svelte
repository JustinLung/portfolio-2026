<script lang="ts">
	import { onMount, untrack } from 'svelte';
	import { finePointer, prefersReducedMotion, settings } from '$lib/settings.svelte';

	type CursorMode = 'default' | 'link';

	let cursor: HTMLDivElement;
	const enabled = $derived(finePointer.current && !prefersReducedMotion() && settings.cursor);
	let visible = $state(false);
	let pressed = $state(false);
	let mode = $state<CursorMode>('default');

	let targetX = 0;
	let targetY = 0;
	let currentX = 0;
	let currentY = 0;
	let hasPosition = false;
	let frame = 0;
	let magneticTarget: HTMLElement | null = null;
	let magneticTargetTranslate = '';
	let magneticTargetWillChange = '';
	let magneticX = 0;
	let magneticY = 0;
	let targetMagneticX = 0;
	let targetMagneticY = 0;
	let resettingMagneticTarget = false;

	const linkSelector = 'a[href], [data-cursor="link"]';
	const magneticSelector = 'button, [role="button"], .button, [data-magnetic]';
	const nativeCursorSelector =
		'input, textarea, select, [contenteditable="true"], [data-cursor="native"]';

	function animateCursor() {
		let keepAnimating = false;
		const cursorEase = 0.38;
		currentX += (targetX - currentX) * cursorEase;
		currentY += (targetY - currentY) * cursorEase;
		cursor.style.transform = `translate3d(${currentX}px, ${currentY}px, 0)`;

		if (Math.abs(targetX - currentX) > 0.05 || Math.abs(targetY - currentY) > 0.05) {
			keepAnimating = true;
		} else {
			currentX = targetX;
			currentY = targetY;
			cursor.style.transform = `translate3d(${currentX}px, ${currentY}px, 0)`;
		}

		if (magneticTarget) {
			const magneticEase = resettingMagneticTarget ? 0.16 : 0.24;
			magneticX += (targetMagneticX - magneticX) * magneticEase;
			magneticY += (targetMagneticY - magneticY) * magneticEase;
			magneticTarget.style.translate = `${magneticX.toFixed(2)}px ${magneticY.toFixed(2)}px`;

			if (
				Math.abs(targetMagneticX - magneticX) > 0.05 ||
				Math.abs(targetMagneticY - magneticY) > 0.05
			) {
				keepAnimating = true;
			} else if (resettingMagneticTarget) {
				restoreMagneticTarget();
			}
		}

		frame = keepAnimating ? requestAnimationFrame(animateCursor) : 0;
	}

	function scheduleCursorFrame() {
		if (!frame) frame = requestAnimationFrame(animateCursor);
	}

	function attachCursor(node: HTMLDivElement) {
		cursor = node;
	}

	function restoreMagneticTarget() {
		if (!magneticTarget) return;
		magneticTarget.style.translate = magneticTargetTranslate;
		magneticTarget.style.willChange = magneticTargetWillChange;
		magneticTarget = null;
		magneticTargetTranslate = '';
		magneticTargetWillChange = '';
		magneticX = 0;
		magneticY = 0;
		targetMagneticX = 0;
		targetMagneticY = 0;
		resettingMagneticTarget = false;
	}

	function resetMagneticTarget() {
		if (!magneticTarget || resettingMagneticTarget) return;
		targetMagneticX = 0;
		targetMagneticY = 0;
		resettingMagneticTarget = true;
		scheduleCursorFrame();
	}

	function updateMagneticTarget(element: Element | null, x: number, y: number) {
		const nextTarget = element?.closest<HTMLElement>(magneticSelector) ?? null;
		const isDisabled =
			nextTarget?.matches(':disabled') || nextTarget?.getAttribute('aria-disabled') === 'true';
		const optedOut = nextTarget?.getAttribute('data-magnetic') === 'false';

		if (!nextTarget || isDisabled || optedOut) {
			resetMagneticTarget();
			return;
		}

		if (magneticTarget !== nextTarget) {
			restoreMagneticTarget();
			magneticTarget = nextTarget;
			magneticTargetTranslate = nextTarget.style.translate;
			magneticTargetWillChange = nextTarget.style.willChange;
			nextTarget.style.willChange = 'translate';
			resettingMagneticTarget = false;
		}

		const bounds = nextTarget.getBoundingClientRect();
		const centerX = bounds.left + bounds.width / 2 - magneticX;
		const centerY = bounds.top + bounds.height / 2 - magneticY;
		targetMagneticX = (x - centerX) * 0.05;
		targetMagneticY = (y - centerY) * 0.05;
	}

	function handlePointerMove(event: PointerEvent) {
		if (!enabled || event.pointerType === 'touch') return;

		targetX = event.clientX;
		targetY = event.clientY;

		if (!hasPosition) {
			currentX = targetX;
			currentY = targetY;
			hasPosition = true;
		}

		visible = true;
		const element = event.target instanceof Element ? event.target : null;
		if (element?.closest(nativeCursorSelector)) {
			visible = false;
			mode = 'default';
			resetMagneticTarget();
			scheduleCursorFrame();
			return;
		}

		mode = element?.closest(linkSelector) ? 'link' : 'default';
		updateMagneticTarget(element, event.clientX, event.clientY);
		scheduleCursorFrame();
	}

	function handlePointerDown(event: PointerEvent) {
		if (enabled && visible && event.isPrimary && event.button === 0) pressed = true;
	}

	function handlePointerEnd(event: PointerEvent) {
		if (event.isPrimary) pressed = false;
	}

	function hideCursor() {
		visible = false;
		pressed = false;
		resetMagneticTarget();
	}

	$effect(() => {
		document.documentElement.classList.toggle('custom-cursor-active', enabled);
		if (!enabled) untrack(hideCursor);

		return () => document.documentElement.classList.remove('custom-cursor-active');
	});

	onMount(() => {
		return () => {
			cancelAnimationFrame(frame);
			restoreMagneticTarget();
		};
	});
</script>

<svelte:window
	onpointermove={handlePointerMove}
	onpointerdown={handlePointerDown}
	onpointerup={handlePointerEnd}
	onpointercancel={handlePointerEnd}
	onblur={hideCursor}
/>

<svelte:body onpointerleave={hideCursor} />

<div
	{@attach attachCursor}
	class="cursor"
	class:cursor--visible={enabled && visible}
	class:cursor--link={mode === 'link'}
	class:cursor--pressed={pressed}
	aria-hidden="true"
>
	<span class="cursor__ring"></span>
	<span class="cursor__dot"></span>
</div>

<style>
	.cursor {
		position: fixed;
		z-index: 9998;
		top: 0;
		left: 0;
		width: 1px;
		height: 1px;
		pointer-events: none;
		opacity: 0;
		transition: opacity 160ms ease;
		will-change: transform;
	}

	.cursor--visible {
		opacity: 1;
	}

	.cursor__ring,
	.cursor__dot {
		position: absolute;
		top: 50%;
		left: 50%;
		border-radius: 999px;
		transform: translate(-50%, -50%);
	}

	.cursor__ring {
		width: 28px;
		height: 28px;
		border: 1px solid rgb(255 255 255 / 70%);
		background-color: rgb(255 255 255 / 4%);
		mix-blend-mode: difference;
		transition:
			width 220ms var(--easeOutExpo),
			height 220ms var(--easeOutExpo),
			border-color 220ms ease,
			background-color 220ms ease,
			transform 140ms ease;
	}

	.cursor__dot {
		width: 4px;
		height: 4px;
		background-color: var(--color-white);
		mix-blend-mode: difference;
		transition:
			opacity 160ms ease,
			transform 140ms ease;
	}

	.cursor--link .cursor__dot {
		background-color: var(--color-white);
		mix-blend-mode: normal;
	}

	.cursor--pressed .cursor__ring {
		transform: translate(-50%, -50%) scale(0.84);
	}

	.cursor--pressed .cursor__dot {
		transform: translate(-50%, -50%) scale(0.7);
	}

	:global(html.custom-cursor-active body),
	:global(html.custom-cursor-active a),
	:global(html.custom-cursor-active button),
	:global(html.custom-cursor-active [role='button']),
	:global(html.custom-cursor-active .button),
	:global(html.custom-cursor-active [data-cursor='link']) {
		cursor: none;
	}

	:global(html.custom-cursor-active input),
	:global(html.custom-cursor-active textarea),
	:global(html.custom-cursor-active select),
	:global(html.custom-cursor-active [contenteditable='true']) {
		cursor: auto;
	}

	:global(html.custom-cursor-active [data-cursor='native'] a[href]) {
		cursor: pointer;
	}

	@media (hover: none), (pointer: coarse) {
		.cursor {
			display: none;
		}
	}
</style>
