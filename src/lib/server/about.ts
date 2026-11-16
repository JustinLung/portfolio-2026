import type { GetAboutPageQuery } from '$lib/graphql/generated/graphql';
import type { ImageMeta } from '../../utils/types';
import { toImageMeta } from './media';

export type AboutPage = {
	id: string;
	title: string;
	content: string;
	uri: string;
	image?: string;
	imageAlt: string;
	imageMeta?: ImageMeta;
	cardImages: {
		url: string;
		alt: string;
		imageMeta?: ImageMeta;
	}[];
};

type AboutPageNode = NonNullable<GetAboutPageQuery['page']>;

export function toAboutPage(page: AboutPageNode): AboutPage {
	const title = page.title;

	if (!title) {
		throw new Error(`About page "${page.id}" is missing a title`);
	}

	return {
		id: page.id,
		title,
		content: page.content ?? '',
		uri: page.uri ?? '/about/',
		image: page.featuredImage?.node.sourceUrl ?? undefined,
		imageAlt: page.featuredImage?.node.altText || title,
		imageMeta: toImageMeta(page.featuredImage?.node),
		cardImages: (page.aboutImages ?? []).flatMap((image) =>
			image?.sourceUrl
				? [{ url: image.sourceUrl, alt: image.altText || title, imageMeta: toImageMeta(image) }]
				: []
		)
	};
}
