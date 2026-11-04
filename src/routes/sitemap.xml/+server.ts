import { env } from '$env/dynamic/private';
import { PostsDocument, WorksDocument } from '$lib/graphql/generated/graphql';
import { createApolloClient } from '$lib/server/apollo';
import { toPostItem } from '$lib/server/post';
import { toWorkItem } from '$lib/server/work';
import { error } from '@sveltejs/kit';
import { SITE_URL, STATIC_PATHS } from '../../utils/site';
import { escapeXml } from '../../utils/text';
import type { RequestHandler } from './$types';

type SitemapEntry = { path: string; lastmod?: string };

const toLastmod = (date?: string) => {
	const time = date ? new Date(date) : undefined;
	return time && !Number.isNaN(time.getTime()) ? time.toISOString() : undefined;
};

export const GET: RequestHandler = async ({ fetch }) => {
	const endpoint = env.WORDPRESS_GRAPHQL_URL;

	if (!endpoint) {
		error(500, 'WORDPRESS_GRAPHQL_URL is not configured');
	}

	const client = createApolloClient(endpoint, fetch);
	let entries: SitemapEntry[];

	try {
		const [{ data: worksData }, { data: postsData }] = await Promise.all([
			client.query({ query: WorksDocument, fetchPolicy: 'no-cache' }),
			client.query({ query: PostsDocument, fetchPolicy: 'no-cache' })
		]);

		// Fail rather than serve a partial sitemap: crawlers may read a missing URL as a removed page.
		if (!worksData?.works || !postsData?.posts) {
			throw new Error('WordPress returned no works or posts');
		}

		entries = [
			// No `lastmod` on these: nothing records when they last changed, and a wrong date is worse than none.
			...STATIC_PATHS.map((path) => ({ path })),
			...worksData.works.nodes.map(toWorkItem).map((work) => ({
				path: work.url,
				lastmod: toLastmod(work.date)
			})),
			...postsData.posts.nodes.map(toPostItem).map((post) => ({
				path: `/write/${post.slug}`,
				lastmod: toLastmod(post.date)
			}))
		];
	} catch (cause) {
		console.error('Failed to build the sitemap', cause);
		error(502, 'Unable to load content from WordPress');
	}

	const urls = entries
		.map(
			({ path, lastmod }) => `	<url>
		<loc>${escapeXml(path === '/' ? SITE_URL : `${SITE_URL}${path}`)}</loc>${
			lastmod ? `\n\t\t<lastmod>${lastmod}</lastmod>` : ''
		}
	</url>`
		)
		.join('\n');

	const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;

	return new Response(xml, {
		headers: {
			'content-type': 'application/xml; charset=utf-8',
			'cache-control': 'public, max-age=600, s-maxage=3600, stale-while-revalidate=86400'
		}
	});
};
