// Supabase client setup and auth service
// Environment variables are injected at build time

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = typeof window !== 'undefined'
	? (import.meta as any).env?.VITE_SUPABASE_URL ?? ''
	: '';

const SUPABASE_ANON_KEY = typeof window !== 'undefined'
	? (import.meta as any).env?.VITE_SUPABASE_ANON_KEY ?? ''
	: '';

let supabaseInstance: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
	if (!supabaseInstance) {
		supabaseInstance = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
	}
	return supabaseInstance;
}

export interface AuthUser {
	id: string;
	email: string;
}

export async function signUp(email: string, password: string): Promise<{ user: AuthUser | null; error: string | null }> {
	const { data, error } = await getSupabase().auth.signUp({ email, password });
	if (error) return { user: null, error: error.message };
	if (!data.user) return { user: null, error: 'No user returned' };
	return { user: { id: data.user.id, email: data.user.email ?? '' }, error: null };
}

export async function signIn(email: string, password: string): Promise<{ user: AuthUser | null; error: string | null }> {
	const { data, error } = await getSupabase().auth.signInWithPassword({ email, password });
	if (error) return { user: null, error: error.message };
	if (!data.user) return { user: null, error: 'No user returned' };
	return { user: { id: data.user.id, email: data.user.email ?? '' }, error: null };
}

export async function signOut(): Promise<void> {
	await getSupabase().auth.signOut();
}

export async function getCurrentUser(): Promise<AuthUser | null> {
	const { data } = await getSupabase().auth.getUser();
	if (!data.user) return null;
	return { id: data.user.id, email: data.user.email ?? '' };
}

export async function getSession() {
	const { data } = await getSupabase().auth.getSession();
	return data.session;
}