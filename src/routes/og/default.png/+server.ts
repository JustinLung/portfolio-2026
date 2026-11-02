import { renderOgImage } from '$lib/server/og-image';
import type { RequestHandler } from './$types';

/** Fallback social preview for pages without their own, e.g. home and about. */
export const GET: RequestHandler = async () => {
	const png = await renderOgImage({
		slug: 'portfolio',
		kind: 'Portfolio',
		title: 'Creative coder based in Amsterdam',
		meta: ['Motion', 'WebGL', 'SvelteKit']
	});

	return new Response(png as BodyInit, {
		headers: {
			'content-type': 'image/png',
			'cache-control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800'
		}
	});
};
