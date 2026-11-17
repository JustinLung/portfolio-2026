import { injectAnalytics, track } from '@vercel/analytics/sveltekit';

/**
 * Privacy-friendly analytics: Vercel Web Analytics sets no cookies and stores no personal data,
 * so it needs no consent banner. It is skipped on localhost and for visitors who send Do Not Track.
 */
const enabled = () =>
	typeof window !== 'undefined' &&
	navigator.doNotTrack !== '1' &&
	!['localhost', '127.0.0.1', '[::1]'].includes(location.hostname);

export function initializeAnalytics(): void {
	if (enabled()) injectAnalytics();
}

/** Records a custom event (a name and flat, non-personal properties). Never throws. */
export function trackEvent(name: string, properties?: Record<string, string | number | boolean>) {
	if (!enabled()) return;

	try {
		track(name, properties);
	} catch {
		// Analytics must never break the page.
	}
}
