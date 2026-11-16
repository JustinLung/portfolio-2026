import type { PostFieldsFragment } from '$lib/graphql/generated/graphql';
import type { PostItem } from '../../utils/types';
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
		content: post.content ?? undefined,
		excerpt: post.excerpt ?? undefined,
		image: post.featuredImage?.node.sourceUrl ?? undefined,
		imageAlt: post.featuredImage?.node.altText || post.title,
		imageMeta: toImageMeta(post.featuredImage?.node)
	};
}
