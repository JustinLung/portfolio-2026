import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

const WP_ADMIN_URL = 'https://www.cms-justinlung.xyz/wp-admin';

/** Shortcut to the WordPress admin, so `/admin` works on every domain. */
export const GET: RequestHandler = () => redirect(302, WP_ADMIN_URL);
