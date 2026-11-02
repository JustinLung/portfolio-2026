import { env } from '$env/dynamic/private';
import { WorkDocument } from '$lib/graphql/generated/graphql';
import { createApolloClient } from '$lib/server/apollo';
import { loadOgPhoto, renderOgImage } from '$lib/server/og-image';
import { toWorkItem } from '$lib/server/work';
import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

/** Social preview image for a work case study, e.g. `/og/work/my-project.png`. */
export const GET: RequestHandler = async ({ fetch, params }) => {
	const endpoint = env.WORDPRESS_GRAPHQL_URL;

	if (!endpoint) {
		error(500, 'WORDPRESS_GRAPHQL_URL is not configured');
	}

	const client = createApolloClient(endpoint, fetch);
	let work;

	try {
		const { data } = await client.query({
			query: WorkDocument,
			variables: { slug: params.slug },
			fetchPolicy: 'no-cache'
		});
		work = data?.work ? toWorkItem(data.work) : null;
	} catch (cause) {
		console.error(`OG image: failed to fetch work "${params.slug}"`, cause);
		error(502, 'Unable to load work from WordPress');
	}

	if (!work) {
		error(404, 'Work not found');
	}

	const png = await renderOgImage({
		slug: work.slug,
		kind: 'Work',
		title: work.title,
		photo: await loadOgPhoto(work.image),
		meta: [work.category, work.year ? String(work.year) : undefined]
	});

	return new Response(png as BodyInit, {
		headers: {
			'content-type': 'image/png',
			'cache-control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800'
		}
	});
};
