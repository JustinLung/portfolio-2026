import { env } from '$env/dynamic/private';
import type { ContactValues } from '$lib/contact';
import { renderContactEmail } from './contact-email';

/**
 * Best-effort fixed-window limiter: the map lives in one server instance's memory, so on
 * serverless it resets on cold starts and isn't shared between instances. It stops casual
 * hammering; use a shared store (e.g. Upstash) if abuse ever becomes real.
 */
const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 3;
const MAX_TRACKED_KEYS = 500;
const windows = new Map<string, { count: number; resetAt: number }>();

export function isRateLimited(key: string, now = Date.now()): boolean {
	const current = windows.get(key);

	if (current && current.resetAt > now) {
		current.count += 1;
		return current.count > MAX_PER_WINDOW;
	}

	// Windows are all the same length, so the Map's insertion order is also expiry order:
	// trim expired entries from the front, and evict the oldest if it's still full.
	if (windows.size >= MAX_TRACKED_KEYS) {
		for (const [id, { resetAt }] of windows) {
			if (resetAt > now && windows.size < MAX_TRACKED_KEYS) break;
			windows.delete(id);
		}
	}

	// Re-insert so an expired key moves to the back of the order.
	windows.delete(key);
	windows.set(key, { count: 1, resetAt: now + WINDOW_MS });
	return false;
}

/** Sends the inquiry through Resend. Throws if it isn't configured or the API rejects it. */
export async function sendContactEmail(
	values: ContactValues,
	fetchFn: typeof fetch = fetch
): Promise<void> {
	const { RESEND_API_KEY, CONTACT_TO_EMAIL, CONTACT_FROM_EMAIL } = env;

	if (!RESEND_API_KEY || !CONTACT_TO_EMAIL || !CONTACT_FROM_EMAIL) {
		throw new Error('RESEND_API_KEY, CONTACT_TO_EMAIL and CONTACT_FROM_EMAIL must be configured');
	}

	const response = await fetchFn('https://api.resend.com/emails', {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${RESEND_API_KEY}`,
			'Content-Type': 'application/json'
		},
		signal: AbortSignal.timeout(8000),
		body: JSON.stringify({
			from: `Portfolio contact <${CONTACT_FROM_EMAIL}>`,
			to: [CONTACT_TO_EMAIL],
			reply_to: values.email,
			subject: `[Portfolio] ${values.subject}`,
			...renderContactEmail(values)
		})
	});

	if (!response.ok) {
		throw new Error(
			`Resend responded ${response.status}: ${(await response.text()).slice(0, 500)}`
		);
	}
}
