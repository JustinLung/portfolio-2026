import { env } from '$env/dynamic/private';
import { CMS_CACHE_TAG } from '$lib/server/cache';
import { dangerouslyDeleteByTag } from '@vercel/functions';
import { error, json } from '@sveltejs/kit';
import { createHash, timingSafeEqual } from 'node:crypto';
import type { RequestHandler } from './$types';

/** Compares through a fixed-length digest so neither length nor content leaks via timing. */
const matchesSecret = (received: string, expected: string) =>
	timingSafeEqual(
		createHash('sha256').update(received).digest(),
		createHash('sha256').update(expected).digest()
	);

/**
 * WordPress calls this when content is saved, so edits show up right away instead of after
 * the 5 minute CDN cache expires (see ADR-013). Send `Authorization: Bearer <REVALIDATE_SECRET>`
 * with a JSON body (SvelteKit rejects cross-origin POSTs with form content types).
 *
 * It deletes rather than invalidates the tag so the very next visit renders fresh content;
 * for a site this small the extra origin load of one refetch per page is negligible.
 */
export const POST: RequestHandler = async ({ request }) => {
	const secret = env.REVALIDATE_SECRET;

	if (!secret) {
		error(500, 'REVALIDATE_SECRET is not configured');
	}

	const received = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ?? '';

	if (!matchesSecret(received, secret)) {
		error(401, 'Invalid secret');
	}

	try {
		await dangerouslyDeleteByTag(CMS_CACHE_TAG);
	} catch (cause) {
		console.error('Failed to purge CDN cache', cause);
		error(502, 'Unable to purge the CDN cache');
	}

	return json({ revalidated: true, tag: CMS_CACHE_TAG });
};
