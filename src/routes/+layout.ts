import type { LayoutLoad } from './$types';

export const load: LayoutLoad = async () => {
	// Auth is handled client-side in +layout.svelte
	// This is a PWA — all auth state is managed via IndexedDB + Supabase client
	return {};
};