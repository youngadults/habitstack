import { redirect } from '@sveltejs/kit';
import type { LayoutLoad } from './$types';

export const load: LayoutLoad = async ({ url }) => {
	// Public routes that don't require auth
	const publicPaths = ['/auth/login', '/auth/signup'];

	// We'll handle auth state client-side since this is a PWA
	return {};
};