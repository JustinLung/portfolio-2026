import { env } from '$env/dynamic/private';
import {
	GetTermsOfServicePageDocument,
	type GetTermsOfServicePageQuery
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
	let page: GetTermsOfServicePageQuery['page'];

	try {
		const { data } = await client.query({
			query: GetTermsOfServicePageDocument,
			fetchPolicy: 'no-cache'
		});

		page = data?.page ?? null;
	} catch (cause) {
		console.error('Failed to fetch terms of service from WordPress', cause);
		error(502, 'Unable to load terms of service from WordPress');
	}

	if (!page) {
		error(404, 'Terms of service not found');
	}

	setHeaders(PAGE_CACHE_HEADERS);

	return { page };
};
