const namedEntities: Record<string, string> = {
	amp: '&',
	lt: '<',
	gt: '>',
	quot: '"',
	apos: "'",
	nbsp: ' ',
	hellip: '…',
	ndash: '–',
	mdash: '—',
	lsquo: '‘',
	rsquo: '’',
	ldquo: '“',
	rdquo: '”'
};

/**
 * Decodes the HTML entities WordPress leaves in titles and excerpts. Unknown ones are kept as-is.
 * Run it after stripping tags, so a decoded `&lt;` can't become markup.
 */
export function decodeEntities(value: string): string {
	return value.replace(
		/&(?:#(\d+)|#x([\da-f]+)|([a-z]+));/gi,
		(entity, decimal?: string, hex?: string, name?: string) => {
			if (name) return namedEntities[name.toLowerCase()] ?? entity;

			try {
				return String.fromCodePoint(decimal ? Number(decimal) : parseInt(hex!, 16));
			} catch {
				return entity;
			}
		}
	);
}

/** Plain text from WordPress HTML: tags stripped, entities decoded, whitespace collapsed. */
export function htmlToText(html: string): string {
	return decodeEntities(html.replace(/<[^>]*>/g, ' '))
		.replace(/\s+/g, ' ')
		.trim();
}

export function escapeXml(value: string): string {
	return value
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&apos;');
}

/** Shortens text to about `max` characters at a word boundary, adding an ellipsis when it cut anything. */
export function truncateText(text: string, max: number): string {
	if (text.length <= max) return text;

	const cut = text.slice(0, max - 1);
	const lastSpace = cut.lastIndexOf(' ');

	return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).replace(/[\s.,;:–—-]+$/, '')}…`;
}

/**
 * WordPress can emit `http://` media URLs, which browsers block or warn about on an HTTPS page
 * (a blocked video simply doesn't play). Upgrades `src`, `srcset`, and `poster` attributes only,
 * leaving ordinary links alone.
 */
export function upgradeMediaUrls(html: string): string {
	return html
		.replace(/(\s(?:src|poster)=["'])http:\/\//gi, '$1https://')
		.replace(
			/(\ssrcset=(["']))([^"']*)\2/gi,
			(_match, start: string, quote: string, value: string) => {
				return `${start}${value.replace(/http:\/\//gi, 'https://')}${quote}`;
			}
		);
}
