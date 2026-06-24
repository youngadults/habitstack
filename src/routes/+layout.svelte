<script lang="ts">
	import '../app.css';
	import { getAppState, initializeState } from '$lib/stores/app';
	import { onMount } from 'svelte';

	const appState = getAppState();

	let ready = $state(false);

	let { children } = $props();

	onMount(async () => {
		// Check for existing session
		try {
			const { getSession } = await import('$lib/services/auth');
			const session = await getSession();
			if (session?.user) {
				await initializeState(session.user.id);
			}
		} catch (e) {
			console.error('Session check failed:', e);
		}
		ready = true;
	});
</script>

{#if !ready}
	<div class="flex items-center justify-center min-h-screen">
		<div class="text-center">
			<div class="text-4xl mb-4">🏗️</div>
			<div class="text-xl font-bold text-indigo-400">StackFlow</div>
			<div class="text-sm text-slate-500 mt-2">Loading...</div>
		</div>
	</div>
{:else if !appState.userId}
	{@render children()}
{:else}
	<div class="min-h-screen flex flex-col bg-slate-950">
		<main class="flex-1 pb-20 px-4 pt-4 max-w-lg mx-auto w-full">
			{@render children()}
		</main>

		<nav class="fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-sm border-t border-slate-800 safe-bottom">
			<div class="max-w-lg mx-auto flex items-center justify-around py-2">
				<a href="/" class="flex flex-col items-center px-3 py-1 text-slate-400 hover:text-indigo-400 transition-colors">
					<svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
					</svg>
					<span class="text-xs mt-0.5">Today</span>
				</a>
				<a href="/stacks" class="flex flex-col items-center px-3 py-1 text-slate-400 hover:text-indigo-400 transition-colors">
					<svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
					</svg>
					<span class="text-xs mt-0.5">Stacks</span>
				</a>
				<a href="/stats" class="flex flex-col items-center px-3 py-1 text-slate-400 hover:text-indigo-400 transition-colors">
					<svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
					</svg>
					<span class="text-xs mt-0.5">Stats</span>
				</a>
				<a href="/achievements" class="flex flex-col items-center px-3 py-1 text-slate-400 hover:text-indigo-400 transition-colors">
					<svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M5 3v4M3 5h4M6 17v2m1-2h2m2-4v2m0-2h2M3 21l6-6m0 0l3 3m6-12v4m0 0h4" />
					</svg>
					<span class="text-xs mt-0.5">Awards</span>
				</a>
			</div>
		</nav>
	</div>
{/if}