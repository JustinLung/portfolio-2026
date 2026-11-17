import { env } from '$env/dynamic/private';
import {
	WorkDocument,
	WorksDocument,
	type WorkFieldsFragment
} from '$lib/graphql/generated/graphql';
import { createApolloClient } from '$lib/server/apollo';
import { PAGE_CACHE_CONTROL } from '$lib/server/cache';
import { getAdjacentWorks, sortWorksByYearDesc, toWorkItem } from '$lib/server/work';
import { addHeadingAnchors } from '../../../utils/post-content';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ fetch, params, setHeaders }) => {
	const endpoint = env.WORDPRESS_GRAPHQL_URL;

	if (!endpoint) {
		error(500, 'WORDPRESS_GRAPHQL_URL is not configured');
	}

	const client = createApolloClient(endpoint, fetch);
	let work: WorkFieldsFragment | null;
	let previous = null;
	let next = null;

	try {
		const [{ data: workData }, { data: worksData }] = await Promise.all([
			client.query({
				query: WorkDocument,
				variables: { slug: params.slug },
				fetchPolicy: 'no-cache'
			}),
			client.query({
				query: WorksDocument,
				fetchPolicy: 'no-cache'
			})
		]);

		work = workData?.work ?? null;

		if (worksData?.works) {
			const works = sortWorksByYearDesc(worksData.works.nodes.map(toWorkItem));
			({ previous, next } = getAdjacentWorks(works, params.slug));
		}
	} catch (cause) {
		console.error(`Failed to fetch WordPress work "${params.slug}"`, cause);
		error(502, 'Unable to load work from WordPress');
	}

	if (!work) {
		error(404, 'Work not found');
	}

	setHeaders({ 'cache-control': PAGE_CACHE_CONTROL });

	const item = toWorkItem(work);

	return {
		work: { ...item, content: item.content ? addHeadingAnchors(item.content).html : undefined },
		previous,
		next
	};
};
