import { env } from '$env/dynamic/private';
import { PostsDocument } from '$lib/graphql/generated/graphql';
import { createApolloClient } from '$lib/server/apollo';
import { PAGE_CACHE_HEADERS } from '$lib/server/cache';
import { toPostItem } from '$lib/server/post';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ fetch, setHeaders }) => {
	const endpoint = env.WORDPRESS_GRAPHQL_URL;

	if (!endpoint) {
		error(500, 'WORDPRESS_GRAPHQL_URL is not configured');
	}

	const client = createApolloClient(endpoint, fetch);

	let posts: ReturnType<typeof toPostItem>[];

	try {
		const { data } = await client.query({
			query: PostsDocument,
			fetchPolicy: 'no-cache'
		});

		if (!data?.posts) {
			throw new Error('WordPress returned no post data');
		}

		posts = data.posts.nodes.map(toPostItem);
	} catch (cause) {
		console.error('Failed to fetch posts from WordPress', cause);
		error(502, 'Unable to load writing from WordPress');
	}

	setHeaders(PAGE_CACHE_HEADERS);

	return { posts };
};
