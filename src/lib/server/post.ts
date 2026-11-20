import type { PostFieldsFragment } from '$lib/graphql/generated/graphql';
import type { AdjacentPost, PostItem } from '../../utils/types';
import { upgradeMediaUrls } from '../../utils/text';
import { toImageMeta } from './media';

export function toPostItem(post: PostFieldsFragment): PostItem {
	if (!post.slug || !post.title || !post.date) {
		throw new Error(`Post "${post.id}" is missing a slug, title, or date`);
	}

	return {
		id: post.id,
		slug: post.slug,
		title: post.title,
		date: post.date,
		category: post.categories?.nodes.find(({ name }) => Boolean(name))?.name ?? 'Writing',
		content: post.content ? upgradeMediaUrls(post.content) : undefined,
		excerpt: post.excerpt ?? undefined,
		image: post.featuredImage?.node.sourceUrl ?? undefined,
		imageAlt: post.featuredImage?.node.altText || post.title,
		imageMeta: toImageMeta(post.featuredImage?.node)
	};
}

/** The posts either side of `slug` in CMS order (newest first): "previous" is the newer one. */
export function getAdjacentPosts(
	posts: PostItem[],
	slug: string
): { previous: AdjacentPost | null; next: AdjacentPost | null } {
	const index = posts.findIndex((post) => post.slug === slug);

	if (index === -1) return { previous: null, next: null };

	const toAdjacent = ({ slug, title, category, date }: PostItem): AdjacentPost => ({
		slug,
		title,
		category,
		date
	});

	return {
		previous: index > 0 ? toAdjacent(posts[index - 1]) : null,
		next: index < posts.length - 1 ? toAdjacent(posts[index + 1]) : null
	};
}
