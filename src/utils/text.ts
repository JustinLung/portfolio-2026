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
