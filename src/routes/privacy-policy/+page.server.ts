import { env } from '$env/dynamic/private';
import {
	GetPrivacyPolicyPageDocument,
	type GetPrivacyPolicyPageQuery
} from '$lib/graphql/generated/graphql';
import { createApolloClient } from '$lib/server/apollo';
import { PAGE_CACHE_HEADERS } from '$lib/server/cache';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ fetch, setHeaders }) => {
	const endpoint = env.WORDPRESS_GRAPHQL_URL;

	if (!endpoint) {
		error(500, 'WORDPRESS_GRAPHQL_URL is not configured');
	}

	const client = createApolloClient(endpoint, fetch);
	let page: GetPrivacyPolicyPageQuery['page'];

	try {
		const { data } = await client.query({
			query: GetPrivacyPolicyPageDocument,
			fetchPolicy: 'no-cache'
		});

		page = data?.page ?? null;
	} catch (cause) {
		console.error('Failed to fetch privacy policy from WordPress', cause);
		error(502, 'Unable to load privacy policy from WordPress');
	}

	if (!page) {
		error(404, 'Privacy policy not found');
	}

	setHeaders(PAGE_CACHE_HEADERS);

	return { page };
};
