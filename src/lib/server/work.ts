import type { WorkFieldsFragment } from '$lib/graphql/generated/graphql';
import type { AdjacentWork, WorkItem } from '../../utils/types';
import { upgradeMediaUrls } from '../../utils/text';
import { toImageMeta } from './media';

export function toWorkItem(work: WorkFieldsFragment): WorkItem {
	if (!work.slug || !work.title || !work.date) {
		throw new Error(`Work "${work.id}" is missing a slug, title, or date`);
	}

	const categories = (work.categories?.nodes ?? []).flatMap(({ id, name, slug }) =>
		name && slug ? [{ id, name, slug }] : []
	);
	const categoryNames = categories.map((category) => category.name);
	const roles = work.workFields?.role?.filter((role): role is string => Boolean(role)) ?? [];
	const workplaces = work.workFields?.at?.filter((at): at is string => Boolean(at)) ?? [];

	return {
		id: work.id,
		slug: work.slug,
		url: `/work/${work.slug}`,
		title: work.title,
		category: categoryNames.join(', ') || 'Work',
		categories,
		year: work.workFields?.year != null ? Math.trunc(work.workFields.year) : undefined,
		date: work.date,
		content: work.content ? upgradeMediaUrls(work.content) : undefined,
		excerpt: work.workFields?.excerpt ?? undefined,
		siteUrl: work.workFields?.siteUrl ?? undefined,
		githubUrl: work.workFields?.githubUrl ?? undefined,
		role: roles.join(', ') || undefined,
		at: workplaces.join(', ') || undefined,
		image: work.featuredImage?.node.sourceUrl ?? undefined,
		imageAlt: work.featuredImage?.node.altText || work.title,
		imageMeta: toImageMeta(work.featuredImage?.node)
	};
}

export function sortWorksByYearDesc(works: WorkItem[]): WorkItem[] {
	return [...works].sort((a, b) => (b.year ?? 0) - (a.year ?? 0));
}

export function toAdjacentWork(work: WorkItem): AdjacentWork {
	return {
		slug: work.slug,
		title: work.title,
		category: work.category,
		year: work.year,
		image: work.image,
		imageAlt: work.imageAlt,
		imageMeta: work.imageMeta
	};
}

export function getAdjacentWorks(
	works: WorkItem[],
	slug: string
): { previous: AdjacentWork | null; next: AdjacentWork | null } {
	const index = works.findIndex((work) => work.slug === slug);

	if (index === -1) {
		return { previous: null, next: null };
	}

	const previousWork = works[index - 1];
	const nextWork = works[index + 1];

	return {
		previous: previousWork ? toAdjacentWork(previousWork) : null,
		next: nextWork ? toAdjacentWork(nextWork) : null
	};
}
