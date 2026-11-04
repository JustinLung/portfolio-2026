import { socialLinks } from './links';
import { AUTHOR_JOB_TITLE, AUTHOR_NAME, SITE_URL } from './site';
import type { PostItem } from './types';

const PERSON_ID = `${SITE_URL}/#person`;

const toIso = (date: string) => {
	const time = new Date(date);
	return Number.isNaN(time.getTime()) ? undefined : time.toISOString();
};

export function personJsonLd() {
	return {
		'@context': 'https://schema.org',
		'@type': 'Person',
		'@id': PERSON_ID,
		name: AUTHOR_NAME,
		jobTitle: AUTHOR_JOB_TITLE,
		url: SITE_URL,
		image: new URL('/og/default.png', SITE_URL).href,
		address: { '@type': 'PostalAddress', addressLocality: 'Amsterdam', addressCountry: 'NL' },
		sameAs: socialLinks.map(({ href }) => href)
	};
}

type ArticleInput = Pick<PostItem, 'slug' | 'date'> & { title: string; description?: string };

export function articleJsonLd({ slug, title, description, date }: ArticleInput) {
	const url = `${SITE_URL}/write/${slug}`;

	return {
		'@context': 'https://schema.org',
		'@type': 'Article',
		headline: title,
		...(description && { description }),
		datePublished: toIso(date),
		image: new URL(`/og/write/${slug}.png`, SITE_URL).href,
		mainEntityOfPage: { '@type': 'WebPage', '@id': url },
		url,
		author: { '@id': PERSON_ID, '@type': 'Person', name: AUTHOR_NAME, url: SITE_URL }
	};
}
