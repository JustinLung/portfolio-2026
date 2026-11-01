<script lang="ts">
	import gsap from 'gsap';
	import type { Snippet } from 'svelte';
	import { prefersReducedMotion, readReducedMotion } from '$lib/settings.svelte';

	interface Props {
		id: string;
		open: boolean;
		onclose: () => void;
		returnFocus?: () => HTMLElement | undefined;
		children: Snippet;
	}

	let { id, open, onclose, returnFocus, children }: Props = $props();

	const DRAG_THRESHOLD = 6;
	const CLOSE_DISTANCE = 0.25;
	const CLOSE_VELOCITY = 0.5;

	let sheet: HTMLElement;
	let backdrop: HTMLElement;
	let body: HTMLElement;
	let content: HTMLElement;
	let canScrollDown = $state(false);
	let initialized = false;

	let drag: {
		pointerId: number;
		startY: number;
		lastY: number;
		lastTime: number;
		velocity: number;
		height: number;
		active: boolean;
	} | null = null;
	let suppressClick = false;
	let setSheetY: (value: number) => void;
	let setBackdropOpacity: (value: number) => void;

	function handlePointerDown(event: PointerEvent) {
		if (!open || event.button !== 0) return;
		drag = {
			pointerId: event.pointerId,
			startY: event.clientY,
			lastY: event.clientY,
			lastTime: event.timeStamp,
			velocity: 0,
			height: 0,
			active: false
		};
	}

	function handlePointerMove(event: PointerEvent) {
		if (!drag || event.pointerId !== drag.pointerId) return;

		const offset = event.clientY - drag.startY;

		if (!drag.active) {
			if (Math.abs(offset) < DRAG_THRESHOLD) return;
			drag.active = true;
			drag.height = sheet.offsetHeight;
			sheet.setPointerCapture(event.pointerId);
			gsap.killTweensOf([sheet, backdrop]);
		}

		const elapsed = event.timeStamp - drag.lastTime;
		if (elapsed > 0) drag.velocity = (event.clientY - drag.lastY) / elapsed;
		drag.lastY = event.clientY;
		drag.lastTime = event.timeStamp;

		// Follow the finger downwards; resist dragging upwards like a native sheet.
		const y = offset > 0 ? offset : offset * 0.2;
		const progress = Math.max(0, y) / drag.height;

		setSheetY(y);
		setBackdropOpacity(1 - progress);
	}

	function handlePointerUp(event: PointerEvent) {
		if (!drag || event.pointerId !== drag.pointerId) return;

		const { active, startY, velocity, height } = drag;
		drag = null;

		if (!active) return;

		// A drag ends with a click on whatever is under the finger; swallow it.
		suppressClick = true;
		setTimeout(() => (suppressClick = false));

		const offset = event.clientY - startY;
		const shouldClose = offset > height * CLOSE_DISTANCE || velocity > CLOSE_VELOCITY;

		if (shouldClose && event.type === 'pointerup') {
			onclose();
			return;
		}

		const duration = prefersReducedMotion() ? 0 : 0.35;
		gsap.to(sheet, { y: 0, duration, ease: 'power3.out' });
		gsap.to(backdrop, { opacity: 1, duration });
	}

	function handleClickCapture(event: MouseEvent) {
		if (!suppressClick) return;
		event.preventDefault();
		event.stopPropagation();
	}

	$effect(() => {
		const isOpen = open;

		if (!sheet || !backdrop) return;

		if (!initialized) {
			initialized = true;
			gsap.set(sheet, { yPercent: 100 });
			setSheetY = gsap.quickSetter(sheet, 'y', 'px') as (value: number) => void;
			setBackdropOpacity = gsap.quickSetter(backdrop, 'opacity') as (value: number) => void;
			return;
		}

		// Untracked so changing the Motion setting from inside the sheet doesn't replay the open animation.
		const duration = readReducedMotion() ? 0 : isOpen ? 0.5 : 0.35;

		gsap.killTweensOf([sheet, backdrop]);

		if (isOpen) gsap.set(sheet, { visibility: 'visible' });

		gsap.to(sheet, {
			yPercent: isOpen ? 0 : 100,
			y: 0,
			duration,
			ease: isOpen ? 'expo.out' : 'power3.in',
			onComplete: () => {
				if (!isOpen) gsap.set(sheet, { visibility: 'hidden' });
			}
		});
		gsap.to(backdrop, { autoAlpha: isOpen ? 1 : 0, duration });

		if (isOpen) {
			[...sheet.querySelectorAll<HTMLElement>('a, button')]
				.find((element) => element.checkVisibility())
				?.focus({ preventScroll: true });
		} else if (sheet.contains(document.activeElement)) {
			returnFocus?.()?.focus();
		}
	});

	$effect(() => () => gsap.killTweensOf([sheet, backdrop]));

	// Hint at hidden rows below, and re-check whenever the body or its content changes size.
	function updateScrollHint() {
		canScrollDown = body.scrollTop + body.clientHeight < body.scrollHeight - 1;
	}

	$effect(() => {
		const observer = new ResizeObserver(updateScrollHint);

		observer.observe(body);
		observer.observe(content);

		return () => observer.disconnect();
	});
</script>

<div bind:this={backdrop} class="sheet__backdrop" aria-hidden="true" onclick={onclose}></div>

<div
	{id}
	bind:this={sheet}
	class="sheet"
	inert={!open}
	role="presentation"
	onpointerdown={handlePointerDown}
	onpointermove={handlePointerMove}
	onpointerup={handlePointerUp}
	onpointercancel={handlePointerUp}
	onclickcapture={handleClickCapture}
>
	<span class="sheet__handle" aria-hidden="true"></span>
	<div class="sheet__scroll">
		<!-- Lenis is stopped while the sheet is open, so the body scrolls natively. -->
		<div bind:this={body} class="sheet__body" data-lenis-prevent onscroll={updateScrollHint}>
			<div bind:this={content}>
				{@render children()}
			</div>
		</div>
		<div class="sheet__fade" class:sheet__fade--visible={canScrollDown} aria-hidden="true"></div>
	</div>
</div>

<style>
	/* Sits below the header so its buttons stay usable as close controls. */
	.sheet__backdrop {
		position: fixed;
		z-index: 9;
		inset: 0;
		background-color: rgb(0 0 0 / 50%);
		visibility: hidden;
		opacity: 0;
	}

	.sheet {
		position: fixed;
		z-index: 11;
		inset-inline: 0;
		bottom: 0;
		display: flex;
		flex-direction: column;
		max-height: 60dvh;
		padding: 12px 16px calc(24px + env(safe-area-inset-bottom));
		background-color: var(--color-secondary);
		border-radius: 16px 16px 0 0;
		box-shadow: 0 -12px 32px rgb(0 0 0 / 20%);
		visibility: hidden;
		touch-action: none;
		user-select: none;

		&::after {
			content: '';
			position: absolute;
			inset-inline: 0;
			top: 100%;
			height: 100px;
			background-color: inherit;
		}

		@media (--viewport-md-up) {
			max-width: 42rem;
			margin-inline: auto;
		}
	}

	.sheet__handle {
		flex: none;
		display: block;
		width: 40px;
		height: 4px;
		margin: 0 auto 16px;
		background-color: var(--color-quaternary);
		border-radius: 2px;
	}

	.sheet__scroll {
		position: relative;
		display: flex;
		flex: 1;
		flex-direction: column;
		min-height: 0;
		margin-inline: -4px -8px;
	}

	/* The sheet disables touch panning for its drag-to-close, so the body opts back in. */
	.sheet__body {
		flex: 1;
		min-height: 0;
		/* Room for rings and focus outlines that extend past their controls, which overflow would clip. */
		padding-inline: 4px 8px;
		overflow-y: auto;
		overscroll-behavior: contain;
		scrollbar-width: thin;
		scrollbar-color: var(--color-quaternary) transparent;
		touch-action: pan-y;
	}

	.sheet__fade {
		position: absolute;
		inset-inline: 0;
		bottom: 0;
		height: 48px;
		background: linear-gradient(to bottom, transparent, var(--color-secondary));
		opacity: 0;
		pointer-events: none;
		transition: opacity 200ms ease;

		/* A small chevron so the fade reads as "more below". */
		&::after {
			content: '';
			position: absolute;
			bottom: 8px;
			left: 50%;
			width: 8px;
			height: 8px;
			border-right: 1.5px solid var(--color-quaternary);
			border-bottom: 1.5px solid var(--color-quaternary);
			transform: translateX(-50%) rotate(45deg);
		}

		@media (prefers-reduced-motion: reduce) {
			transition: none;
		}
	}

	.sheet__fade--visible {
		opacity: 1;
	}
</style>
