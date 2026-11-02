import { env } from '$env/dynamic/private';
import { PostsDocument, WorksDocument } from '$lib/graphql/generated/graphql';
import { createApolloClient } from '$lib/server/apollo';
import { toPostItem } from '$lib/server/post';
import { sortWorksByYearDesc, toWorkItem } from '$lib/server/work';
import type { SearchIndex } from '../../utils/types';
import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

/**
 * Titles and slugs for the command palette. It is fetched when the palette first opens,
 * so the CMS isn't queried on every page load. Either list may be empty if its query fails.
 */
export const GET: RequestHandler = async ({ fetch, setHeaders }) => {
	const endpoint = env.WORDPRESS_GRAPHQL_URL;

	if (!endpoint) {
		error(500, 'WORDPRESS_GRAPHQL_URL is not configured');
	}

	const client = createApolloClient(endpoint, fetch);

	const [works, posts] = await Promise.allSettled([
		client.query({ query: WorksDocument, fetchPolicy: 'no-cache' }),
		client.query({ query: PostsDocument, fetchPolicy: 'no-cache' })
	]);

	if (works.status === 'rejected') console.error('Search index: works failed', works.reason);
	if (posts.status === 'rejected') console.error('Search index: posts failed', posts.reason);

	if (works.status === 'rejected' && posts.status === 'rejected') {
		error(502, 'Unable to load the search index from WordPress');
	}

	const index: SearchIndex = {
		works:
			works.status === 'fulfilled'
				? sortWorksByYearDesc((works.value.data?.works?.nodes ?? []).map(toWorkItem)).map(
						({ slug, title, category, year }) => ({ slug, title, category, year })
					)
				: [],
		posts:
			posts.status === 'fulfilled'
				? (posts.value.data?.posts?.nodes ?? [])
						.map(toPostItem)
						.map(({ slug, title, category }) => ({ slug, title, category }))
				: []
	};

	setHeaders({ 'cache-control': 'public, max-age=300' });

	return json(index);
};
