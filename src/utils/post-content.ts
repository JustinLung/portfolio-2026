import { htmlToText } from './text';

export type TocItem = { id: string; text: string; level: 2 | 3 };

const WORDS_PER_MINUTE = 220;

const slugify = (value: string) =>
	value
		.normalize('NFKD')
		.replace(/[̀-ͯ]/g, '')
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '');

/** Whole minutes to read the HTML at an average pace, never less than 1. */
export function getReadingMinutes(html: string): number {
	const words = htmlToText(html).match(/\S+/g)?.length ?? 0;

	return Math.max(1, Math.round(words / WORDS_PER_MINUTE));
}

/**
 * Gives every `h2`/`h3` in WordPress HTML a stable `id` (keeping an existing one) and returns
 * the rewritten HTML plus the heading list for a table of contents.
 */
export function addHeadingAnchors(html: string): { html: string; toc: TocItem[] } {
	const toc: TocItem[] = [];
	const used = new Set<string>();

	const rewritten = html.replace(
		/<h([23])((?:\s[^>]*)?)>([\s\S]*?)<\/h\1>/gi,
		(match, level: string, attrs: string, inner: string) => {
			const text = htmlToText(inner);
			if (!text) return match;

			const existing = /\sid=(["'])(.*?)\1/i.exec(attrs)?.[2];
			const base = existing || slugify(text) || 'section';
			let id = base;

			for (let suffix = 2; used.has(id); suffix++) id = `${base}-${suffix}`;
			used.add(id);
			toc.push({ id, text, level: Number(level) as 2 | 3 });

			return existing ? match : `<h${level}${attrs} id="${id}">${inner}</h${level}>`;
		}
	);

	return { html: rewritten, toc };
}
