import type { GetHomePageQuery } from '$lib/graphql/generated/graphql';
import type { HomePage } from '../../utils/types';
import { toImageMeta } from './media';

type HomePageNode = NonNullable<GetHomePageQuery['page']>;

export function toHomePage(page: HomePageNode): HomePage {
	const fields = page.homeFields;

	if (!fields) {
		throw new Error(`Home page "${page.id}" is missing homeFields`);
	}

	const heroTitle = fields.heroTitle?.trim();
	const heroSubtitle = fields.heroSubtitle?.trim();
	const latestWorkTitle = fields.latestWorkTitle?.trim();
	const latestWorkSubtitle = fields.latestWorkSubtitle?.trim();
	const personalTitle = fields.personalTextTitle?.trim();
	const personalSubtitle = fields.personalTextSubtitle?.trim();
	const personalText = fields.personalText?.trim();
	const personalImage = fields.personalImage?.node.sourceUrl?.trim();

	const missing = [
		!heroTitle && 'heroTitle',
		!heroSubtitle && 'heroSubtitle',
		!latestWorkTitle && 'latestWorkTitle',
		!latestWorkSubtitle && 'latestWorkSubtitle',
		!personalTitle && 'personalTextTitle',
		!personalSubtitle && 'personalTextSubtitle',
		!personalText && 'personalText'
	].filter(Boolean);

	if (missing.length > 0) {
		throw new Error(
			`Home page "${page.id}" is missing required homeFields values: ${missing.join(', ')}`
		);
	}

	return {
		hero: {
			title: heroTitle!,
			subtitle: heroSubtitle!
		},
		latestWork: {
			title: latestWorkTitle!,
			subtitle: latestWorkSubtitle!
		},
		personal: {
			title: personalTitle!,
			subtitle: personalSubtitle!,
			text: personalText!,
			image: personalImage || '/images/justin.avif',
			imageAlt: fields.personalImage?.node.altText?.trim() || personalTitle!,
			imageMeta: toImageMeta(fields.personalImage?.node)
		}
	};
}
