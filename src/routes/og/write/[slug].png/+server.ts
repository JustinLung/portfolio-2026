import { env } from '$env/dynamic/private';
import { PostDocument } from '$lib/graphql/generated/graphql';
import { createApolloClient } from '$lib/server/apollo';
import { loadOgPhoto, renderOgImage } from '$lib/server/og-image';
import { toPostItem } from '$lib/server/post';
import { error } from '@sveltejs/kit';
import { formatShortDate } from '../../../../utils/date';
import type { RequestHandler } from './$types';

/** Social preview image for a post, e.g. `/og/write/my-post.png`. */
export const GET: RequestHandler = async ({ fetch, params }) => {
	const endpoint = env.WORDPRESS_GRAPHQL_URL;

	if (!endpoint) {
		error(500, 'WORDPRESS_GRAPHQL_URL is not configured');
	}

	const client = createApolloClient(endpoint, fetch);
	let post;

	try {
		const { data } = await client.query({
			query: PostDocument,
			variables: { slug: params.slug },
			fetchPolicy: 'no-cache'
		});
		post = data?.post ? toPostItem(data.post) : null;
	} catch (cause) {
		console.error(`OG image: failed to fetch post "${params.slug}"`, cause);
		error(502, 'Unable to load writing from WordPress');
	}

	if (!post) {
		error(404, 'Post not found');
	}

	const png = await renderOgImage({
		slug: post.slug,
		kind: 'Writing',
		title: post.title,
		photo: await loadOgPhoto(post.image),
		meta: [post.category, formatShortDate(post.date)]
	});

	return new Response(png as BodyInit, {
		headers: {
			'content-type': 'image/png',
			'cache-control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800'
		}
	});
};
