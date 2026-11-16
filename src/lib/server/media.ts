import type { MediaItemFieldsFragment } from '$lib/graphql/generated/graphql';
import type { ImageMeta } from '../../utils/types';

/** Responsive-image attributes for a CMS media item, omitting whatever WordPress didn't provide. */
export function toImageMeta(
	media: Pick<MediaItemFieldsFragment, 'srcSet' | 'mediaDetails'> | null | undefined
): ImageMeta | undefined {
	if (!media) return undefined;

	const meta: ImageMeta = {
		srcset: media.srcSet?.trim() || undefined,
		width: media.mediaDetails?.width ?? undefined,
		height: media.mediaDetails?.height ?? undefined
	};

	return meta.srcset || meta.width || meta.height ? meta : undefined;
}
