import { env } from '$env/dynamic/private';
import { PostsDocument } from '$lib/graphql/generated/graphql';
import { createApolloClient } from '$lib/server/apollo';
import { toPostItem } from '$lib/server/post';
import { error } from '@sveltejs/kit';
import { RSS_DESCRIPTION, RSS_TITLE, SITE_URL } from '../../utils/site';
import { escapeXml, htmlToText } from '../../utils/text';
import type { PostItem } from '../../utils/types';
import type { RequestHandler } from './$types';

/** WordPress excerpts end with a `[&hellip;]` read-more marker. */
const toExcerpt = (html: string) => htmlToText(html).replace(/\s*\[…\]$/, '…');

export const GET: RequestHandler = async ({ fetch }) => {
	const endpoint = env.WORDPRESS_GRAPHQL_URL;

	if (!endpoint) {
		error(500, 'WORDPRESS_GRAPHQL_URL is not configured');
	}

	const client = createApolloClient(endpoint, fetch);
	let posts: PostItem[];

	try {
		const { data } = await client.query({ query: PostsDocument, fetchPolicy: 'no-cache' });
		posts = (data?.posts?.nodes ?? []).map(toPostItem);
	} catch (cause) {
		console.error('Failed to fetch posts for the RSS feed', cause);
		error(502, 'Unable to load writing from WordPress');
	}

	const items = posts
		.map((post) => {
			const url = `${SITE_URL}/write/${post.slug}`;
			const description = post.excerpt ? toExcerpt(post.excerpt) : '';

			return `		<item>
			<title>${escapeXml(htmlToText(post.title))}</title>
			<link>${url}</link>
			<guid isPermaLink="true">${url}</guid>
			<pubDate>${new Date(post.date).toUTCString()}</pubDate>
			<category>${escapeXml(post.category)}</category>${
				description ? `\n\t\t\t<description>${escapeXml(description)}</description>` : ''
			}
		</item>`;
		})
		.join('\n');

	const lastBuildDate = posts[0] ? new Date(posts[0].date).toUTCString() : new Date().toUTCString();

	const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
	<channel>
		<title>${escapeXml(RSS_TITLE)}</title>
		<link>${SITE_URL}/write</link>
		<description>${escapeXml(RSS_DESCRIPTION)}</description>
		<language>en</language>
		<lastBuildDate>${lastBuildDate}</lastBuildDate>
		<atom:link href="${SITE_URL}/rss.xml" rel="self" type="application/rss+xml" />
${items}
	</channel>
</rss>
`;

	return new Response(xml, {
		headers: {
			'content-type': 'application/rss+xml; charset=utf-8',
			'cache-control': 'public, max-age=600, s-maxage=3600, stale-while-revalidate=86400'
		}
	});
};
