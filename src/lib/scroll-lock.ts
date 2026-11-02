let locks = 0;

/**
 * Freezes page scroll (native and Lenis) and returns the function that releases this lock.
 * Locks are counted, so overlapping overlays only restore scrolling once the last one closes.
 */
export function lockScroll(): () => void {
	let released = false;

	if (locks++ === 0) {
		document.documentElement.style.overflow = 'hidden';
		window.Lenis?.stop();
	}

	return () => {
		if (released) return;
		released = true;

		if (--locks > 0) return;
		document.documentElement.style.overflow = '';
		window.Lenis?.start();
	};
}
