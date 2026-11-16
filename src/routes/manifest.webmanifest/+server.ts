import icon192 from '$lib/assets/favicon-192x192.png';
import icon512 from '$lib/assets/favicon-512x512.png';
import type { RequestHandler } from './$types';

/**
 * Colors match the default (Ember) theme's page background, `--color-neutral-800`.
 * A manifest can't follow the theme picker, so installed apps use this; the open page
 * updates its `theme-color` meta tag instead (src/lib/theme.svelte.ts).
 */
const THEME_COLOR = '#181411';

const manifest = {
	name: 'Justin Lung — Creative Coder',
	short_name: 'Justin Lung',
	description: 'Portfolio of Justin Lung, a creative coder based in Amsterdam.',
	start_url: '/',
	scope: '/',
	display: 'standalone',
	background_color: THEME_COLOR,
	theme_color: THEME_COLOR,
	icons: [
		{ src: icon192, sizes: '192x192', type: 'image/png', purpose: 'any' },
		{ src: icon512, sizes: '512x512', type: 'image/png', purpose: 'any' }
	]
};

export const prerender = true;

export const GET: RequestHandler = () =>
	new Response(JSON.stringify(manifest), {
		headers: {
			'content-type': 'application/manifest+json',
			'cache-control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800'
		}
	});
