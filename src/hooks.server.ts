import type { Handle } from '@sveltejs/kit';

/**
 * Baseline security headers for every response. A Content-Security-Policy is deliberately not set:
 * the site relies on inline scripts and styles, CMS-hosted media, and Vercel Analytics, so one needs
 * its own pass with testing (e.g. in report-only mode first).
 */
const SECURITY_HEADERS = {
	'x-content-type-options': 'nosniff',
	'referrer-policy': 'strict-origin-when-cross-origin',
	'x-frame-options': 'SAMEORIGIN',
	'permissions-policy': 'camera=(), microphone=(), geolocation=(), payment=()'
} as const;

export const handle: Handle = async ({ event, resolve }) => {
	const response = await resolve(event);

	for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
		// Some responses (e.g. redirects built by fetch) have immutable headers; skip those quietly.
		try {
			response.headers.set(name, value);
		} catch {
			// Not worth failing the request over.
		}
	}

	return response;
};
