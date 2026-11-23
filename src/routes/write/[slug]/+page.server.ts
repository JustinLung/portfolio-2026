import { env } from '$env/dynamic/private';
import {
	PostDocument,
	PostsDocument,
	type PostFieldsFragment
} from '$lib/graphql/generated/graphql';
import { createApolloClient } from '$lib/server/apollo';
import { PAGE_CACHE_HEADERS } from '$lib/server/cache';
import { highlightCodeBlocks } from '$lib/server/highlight';
import { getAdjacentPosts, toPostItem } from '$lib/server/post';
import type { AdjacentPost } from '../../../utils/types';
import { addHeadingAnchors, getReadingMinutes } from '../../../utils/post-content';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ fetch, params, setHeaders }) => {
	const endpoint = env.WORDPRESS_GRAPHQL_URL;

	if (!endpoint) {
		error(500, 'WORDPRESS_GRAPHQL_URL is not configured');
	}

	const client = createApolloClient(endpoint, fetch);
	let post: PostFieldsFragment | null;
	let relatedPosts: ReturnType<typeof toPostItem>[] = [];
	let previous: AdjacentPost | null = null;
	let next: AdjacentPost | null = null;

	try {
		const [{ data: postData }, { data: postsData }] = await Promise.all([
			client.query({
				query: PostDocument,
				variables: { slug: params.slug },
				fetchPolicy: 'no-cache'
			}),
			client.query({
				query: PostsDocument,
				fetchPolicy: 'no-cache'
			})
		]);

		post = postData?.post ?? null;
		({ previous, next } = getAdjacentPosts(
			(postsData?.posts?.nodes ?? []).map(toPostItem),
			params.slug
		));
		relatedPosts =
			postsData?.posts?.nodes
				.filter((item) => item.slug !== params.slug)
				.slice(0, 4)
				.map(toPostItem) ?? [];
	} catch (cause) {
		console.error(`Failed to fetch WordPress post "${params.slug}"`, cause);
		error(502, 'Unable to load writing from WordPress');
	}

	if (!post) {
		error(404, 'Post not found');
	}

	const item = toPostItem(post);
	const { html, toc } = addHeadingAnchors(await highlightCodeBlocks(item.content ?? ''));

	setHeaders(PAGE_CACHE_HEADERS);

	return {
		post: { ...item, content: html || undefined },
		toc,
		readingMinutes: getReadingMinutes(item.content ?? ''),
		relatedPosts,
		previous,
		next
	};
};
