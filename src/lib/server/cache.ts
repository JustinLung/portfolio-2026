/** Cache tag on every CDN-cached response built from WordPress content (see ADR-013). */
export const CMS_CACHE_TAG = 'wordpress';

/**
 * CDN cache policy for pages rendered from WordPress (see ADR-009). Set it only after a
 * successful upstream fetch so error responses are never cached.
 */
export const PAGE_CACHE_CONTROL = 'public, max-age=0, s-maxage=300, stale-while-revalidate=86400';

/**
 * Cache policy plus the tag that lets `/api/revalidate` purge the page as soon as WordPress
 * content changes. The 5 minute `s-maxage` stays as the fallback if a webhook is missed.
 */
export const PAGE_CACHE_HEADERS = {
	'cache-control': PAGE_CACHE_CONTROL,
	'vercel-cache-tag': CMS_CACHE_TAG
};
