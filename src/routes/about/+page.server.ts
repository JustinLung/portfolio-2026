import { env } from '$env/dynamic/private';
import {
	GetAboutPageDocument,
	GetExperiencesDocument,
	type GetAboutPageQuery,
	type GetExperiencesQuery
} from '$lib/graphql/generated/graphql';
import { toAboutPage } from '$lib/server/about';
import { createApolloClient } from '$lib/server/apollo';
import { PAGE_CACHE_HEADERS } from '$lib/server/cache';
import { toExperienceItem } from '$lib/server/experience';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ fetch, setHeaders }) => {
	const endpoint = env.WORDPRESS_GRAPHQL_URL;

	if (!endpoint) {
		error(500, 'WORDPRESS_GRAPHQL_URL is not configured');
	}

	const client = createApolloClient(endpoint, fetch);
	let page: GetAboutPageQuery['page'];
	let experiences: GetExperiencesQuery['experiences'];

	try {
		const [{ data: pageData }, { data: experiencesData }] = await Promise.all([
			client.query({
				query: GetAboutPageDocument,
				fetchPolicy: 'no-cache'
			}),
			client.query({
				query: GetExperiencesDocument,
				fetchPolicy: 'no-cache'
			})
		]);

		page = pageData?.page ?? null;
		experiences = experiencesData?.experiences ?? null;
	} catch (cause) {
		console.error('Failed to fetch about page from WordPress', cause);
		error(502, 'Unable to load about page from WordPress');
	}

	if (!page) {
		error(404, 'About page not found');
	}

	if (!experiences) {
		error(502, 'Unable to load experiences from WordPress');
	}

	setHeaders(PAGE_CACHE_HEADERS);

	return {
		page: toAboutPage(page),
		experiences: experiences.nodes
			.map(toExperienceItem)
			.sort((a, b) => Number(a.startYear) - Number(b.startYear))
	};
};
