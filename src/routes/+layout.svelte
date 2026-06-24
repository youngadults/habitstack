<script lang="ts">
	import '../app.css';
	import { getAppState, initializeState, resetState } from '$lib/stores/app';
	import { signIn, signUp } from '$lib/services/auth';
	import '$lib/services/pwa';
	import { onMount } from 'svelte';

	const appState = getAppState();

	let ready = $state(false);
	let authMode = $state<'none' | 'login' | 'signup'>('none');
	let email = $state('');
	let password = $state('');
	let confirmPassword = $state('');
	let error = $state('');
	let loading = $state(false);

	// Check if Supabase is configured
	const SUPABASE_URL = typeof window !== 'undefined'
		? (import.meta as any).env?.VITE_SUPABASE_URL ?? ''
		: '';
	const hasSupabase = SUPABASE_URL && SUPABASE_URL !== '';

	function generateLocalUserId(): string {
		let id = localStorage.getItem('stackflow_local_user_id');
		if (!id) {
			id = 'local_' + crypto.randomUUID();
			localStorage.setItem('stackflow_local_user_id', id);
		}
		return id;
	}

	async function handleLocalMode() {
		const localId = generateLocalUserId();
		await initializeState(localId);
		authMode = 'none';
	}

	let { children } = $props();

	onMount(async () => {
		if (!hasSupabase) {
			// No Supabase configured — go straight to local mode
			await handleLocalMode();
			ready = true;
			return;
		}

		try {
			const { getSession } = await import('$lib/services/auth');
			const session = await getSession();
			if (session?.user) {
				await initializeState(session.user.id);
			} else {
				authMode = 'login';
			}
		} catch (e) {
			console.error('Session check failed:', e);
			authMode = 'login';
		}
		ready = true;
	});

	async function handleSignIn(e: Event) {
		e.preventDefault();
		error = '';
		if (!email || !password) {
			error = 'Email and password are required';
			return;
		}
		loading = true;
		try {
			const result = await signIn(email, password);
			if (result.error) {
				error = result.error;
			} else if (result.user) {
				await initializeState(result.user.id);
				authMode = 'none';
			}
		} catch {
			error = 'Something went wrong. Please try again.';
		} finally {
			loading = false;
		}
	}

	async function handleSignUp(e: Event) {
		e.preventDefault();
		error = '';
		if (!email || !password) {
			error = 'Email and password are required';
			return;
		}
		if (password !== confirmPassword) {
			error = 'Passwords do not match';
			return;
		}
		if (password.length < 6) {
			error = 'Password must be at least 6 characters';
			return;
		}
		loading = true;
		try {
			const result = await signUp(email, password);
			if (result.error) {
				error = result.error;
			} else if (result.user) {
				await initializeState(result.user.id);
				authMode = 'none';
			}
		} catch {
			error = 'Something went wrong. Please try again.';
		} finally {
			loading = false;
		}
	}

	async function handleSignOut() {
		if (hasSupabase) {
			const { signOut } = await import('$lib/services/auth');
			await signOut();
		}
		resetState();
		if (hasSupabase) {
			authMode = 'login';
		} else {
			// Local mode — just re-initialize
			await handleLocalMode();
		}
		email = '';
		password = '';
		error = '';
	}
</script>

{#if !ready}
	<div class="flex items-center justify-center min-h-screen">
		<div class="text-center">
			<div class="text-5xl mb-4 animate-pulse-slow">🏗️</div>
			<div class="text-xl font-bold text-indigo-400">StackFlow</div>
			<div class="text-sm text-slate-500 mt-2">Loading...</div>
		</div>
	</div>
{:else if !appState.userId}
	<!-- Auth screens (only shown when Supabase is configured) -->
	<div class="min-h-screen flex items-center justify-center px-4 bg-slate-950">
		<div class="w-full max-w-sm">
			<div class="text-center mb-8">
				<div class="text-5xl mb-3">🏗️</div>
				<h1 class="text-2xl font-bold text-white">StackFlow</h1>
				<p class="text-slate-400 mt-1">Build habits, one stack at a time</p>
			</div>

			{#if error}
				<div class="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-red-400 text-sm mb-4">
					{error}
				</div>
			{/if}

			{#if authMode === 'login'}
				<form onsubmit={handleSignIn} class="space-y-4">
					<div>
						<label for="login-email" class="block text-sm font-medium text-slate-300 mb-1">Email</label>
						<input
							id="login-email"
							type="email"
							bind:value={email}
							placeholder="you@example.com"
							class="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
							required
						/>
					</div>
					<div>
						<label for="login-password" class="block text-sm font-medium text-slate-300 mb-1">Password</label>
						<input
							id="login-password"
							type="password"
							bind:value={password}
							placeholder="Your password"
							class="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
							required
						/>
					</div>
					<button
						type="submit"
						disabled={loading}
						class="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 disabled:cursor-not-allowed rounded-lg font-medium text-white transition-colors"
					>
						{loading ? 'Signing in...' : 'Sign In'}
					</button>
				</form>
				<p class="text-center text-slate-400 mt-6 text-sm">
					Don't have an account?
					<button onclick={() => { authMode = 'signup'; error = ''; }} class="text-indigo-400 hover:text-indigo-300 ml-1">Create one</button>
				</p>
			{:else if authMode === 'signup'}
				<form onsubmit={handleSignUp} class="space-y-4">
					<div>
						<label for="signup-email" class="block text-sm font-medium text-slate-300 mb-1">Email</label>
						<input
							id="signup-email"
							type="email"
							bind:value={email}
							placeholder="you@example.com"
							class="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
							required
						/>
					</div>
					<div>
						<label for="signup-password" class="block text-sm font-medium text-slate-300 mb-1">Password</label>
						<input
							id="signup-password"
							type="password"
							bind:value={password}
							placeholder="6+ characters"
							class="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
							required
						/>
					</div>
					<div>
						<label for="signup-confirm" class="block text-sm font-medium text-slate-300 mb-1">Confirm Password</label>
						<input
							id="signup-confirm"
							type="password"
							bind:value={confirmPassword}
							placeholder="Re-enter password"
							class="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
							required
						/>
					</div>
					<button
						type="submit"
						disabled={loading}
						class="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 disabled:cursor-not-allowed rounded-lg font-medium text-white transition-colors"
					>
						{loading ? 'Creating account...' : 'Create Account'}
					</button>
				</form>
				<p class="text-center text-slate-400 mt-6 text-sm">
					Already have an account?
					<button onclick={() => { authMode = 'login'; error = ''; }} class="text-indigo-400 hover:text-indigo-300 ml-1">Sign in</button>
				</p>
			{/if}
		</div>
	</div>
{:else}
	<div class="min-h-screen flex flex-col bg-slate-950">
		<header class="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-sm border-b border-slate-800/50 px-4 pt-safe">
			<div class="max-w-lg mx-auto flex items-center justify-between py-3">
				<div class="flex items-center gap-2">
					<span class="text-lg font-bold text-indigo-400">🏗️ StackFlow</span>
				</div>
				<div class="flex items-center gap-3">
					{#if appState.profile}
						<span class="text-xs text-slate-400">Lv.{appState.profile.level}</span>
					{/if}
					<button onclick={handleSignOut} class="text-slate-500 hover:text-slate-300 text-xs" aria-label="Sign out">
						<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
							<path stroke-linecap="round" stroke-linejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
						</svg>
					</button>
				</div>
			</div>
		</header>

		<main class="flex-1 px-4 pb-24 pt-4 max-w-lg mx-auto w-full">
			{@render children()}
		</main>

		<nav class="fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-sm border-t border-slate-800 safe-bottom z-40">
			<div class="max-w-lg mx-auto flex items-center justify-around py-2">
				<a href="/" class="nav-link flex flex-col items-center px-3 py-1 text-slate-400 hover:text-indigo-400 transition-colors">
					<svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
					</svg>
					<span class="text-xs mt-0.5">Today</span>
				</a>
				<a href="/stacks" class="nav-link flex flex-col items-center px-3 py-1 text-slate-400 hover:text-indigo-400 transition-colors">
					<svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
					</svg>
					<span class="text-xs mt-0.5">Stacks</span>
				</a>
				<a href="/stats" class="nav-link flex flex-col items-center px-3 py-1 text-slate-400 hover:text-indigo-400 transition-colors">
					<svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
					</svg>
					<span class="text-xs mt-0.5">Stats</span>
				</a>
				<a href="/achievements" class="nav-link flex flex-col items-center px-3 py-1 text-slate-400 hover:text-indigo-400 transition-colors">
					<svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M5 3v4M3 5h4M6 17v2m1-2h2m2-4v2m0-2h2M3 21l6-6m0 0l3 3m6-12v4m0 0h4" />
					</svg>
					<span class="text-xs mt-0.5">Awards</span>
				</a>
			</div>
		</nav>
	</div>
{/if}