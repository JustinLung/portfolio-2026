import type { ImageMeta } from './types';

/**
 * Attributes that let the browser pick a right-sized file and reserve space before it loads.
 * `sizes` is how wide the image renders at each breakpoint, and the browser needs it to choose from `srcset`.
 * Spread onto an `<img>`; it adds nothing for images without CMS metadata, e.g. static files.
 */
export function imageAttrs(meta: ImageMeta | undefined, sizes: string) {
	return {
		srcset: meta?.srcset,
		sizes: meta?.srcset ? sizes : undefined,
		width: meta?.width,
		height: meta?.height,
		decoding: 'async' as const
	};
}
