/**
 * CDN cache policy for pages rendered from WordPress (see ADR-009). Set it only after a
 * successful upstream fetch so error responses are never cached.
 */
export const PAGE_CACHE_CONTROL = 'public, max-age=0, s-maxage=300, stale-while-revalidate=86400';
