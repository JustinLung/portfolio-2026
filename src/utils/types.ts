import type { ThemeId } from '$lib/theme.svelte';

export type WorkItem = {
	id: number | string;
	slug: string;
	url: string;
	title: string;
	category: string;
	categories?: {
		id: string;
		name: string;
		slug: string;
	}[];
	year?: number;
	date?: string;
	content?: string;
	excerpt?: string;
	siteUrl?: string;
	githubUrl?: string;
	role?: string;
	clientInvolvements?: string;
	at?: string;
	image?: string;
	imageAlt?: string;
	previewHue?: number;
};

export type AdjacentWork = Pick<
	WorkItem,
	'slug' | 'title' | 'category' | 'year' | 'image' | 'imageAlt'
>;

export type ExperienceItem = {
	id: number | string;
	title: string;
	role: string;
	startYear: string;
	endYear?: string;
	currentYear?: boolean;
	link: string;
};

export type PostItem = {
	id: string;
	slug: string;
	title: string;
	date: string;
	category: string;
	content?: string;
	excerpt?: string;
	image?: string;
	imageAlt: string;
};

export type AboutProps = {
	title: string;
	content: string;
	src: string;
	alt: string;
};

export type CardStackProps = {
	title: string;
	cardImages: {
		url: string;
		alt: string;
	}[];
};

export type PersonalIntroProps = {
	title: string;
	subtitle: string;
	description: string;
	image: string;
	imageAlt: string;
};

export type SeoProps = {
	title: string;
	description?: string;
	keywords?: string;
	author?: string;
	robots?: string;
	/** Path (`/og/work/x.png`) or absolute URL of a generated social preview. Defaults to the portrait. */
	ogImage?: string;
	ogImageAlt?: string;
	ogType?: 'website' | 'article';
};

export type HomePage = {
	hero: {
		title: string;
		subtitle: string;
	};
	latestWork: {
		title: string;
		subtitle: string;
	};
	personal: {
		title: string;
		subtitle: string;
		text: string;
		image: string;
		imageAlt: string;
	};
};

export type Command = {
	id: string;
	group: string;
	label: string;
	/** Secondary text that is part of the option's accessible name, e.g. "Current page". */
	hint?: string;
	/** Extra search terms that are not shown. */
	keywords: string;
	current?: boolean;
	swatch?: ThemeId;
	/** Performs the command and returns what to announce to screen readers, if anything. */
	run: () => string | void;
};

export type SearchEntry = {
	slug: string;
	title: string;
	category: string;
	year?: number;
};

/** The content the command palette can jump to, beyond the fixed pages. */
export type SearchIndex = {
	works: SearchEntry[];
	posts: SearchEntry[];
};
