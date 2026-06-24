<script lang="ts">
	import { signIn } from '$lib/services/auth';
	import { initializeState } from '$lib/stores/app';

	let email = $state('');
	let password = $state('');
	let error = $state('');
	let loading = $state(false);

	async function handleSubmit(e: Event) {
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
				window.location.href = '/';
			}
		} catch (e) {
			error = 'Something went wrong. Please try again.';
		} finally {
			loading = false;
		}
	}
</script>

<div class="min-h-screen flex items-center justify-center px-4 bg-slate-950">
	<div class="w-full max-w-sm">
		<div class="text-center mb-8">
			<div class="text-5xl mb-3">🏗️</div>
			<h1 class="text-2xl font-bold text-white">Welcome back</h1>
			<p class="text-slate-400 mt-1">Sign in to continue stacking</p>
		</div>

		<form onsubmit={handleSubmit} class="space-y-4">
			{#if error}
				<div class="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-red-400 text-sm">
					{error}
				</div>
			{/if}

			<div>
				<label for="email" class="block text-sm font-medium text-slate-300 mb-1">Email</label>
				<input
					id="email"
					type="email"
					bind:value={email}
					placeholder="you@example.com"
					class="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
					required
				/>
			</div>

			<div>
				<label for="password" class="block text-sm font-medium text-slate-300 mb-1">Password</label>
				<input
					id="password"
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
				{#if loading}
					Signing in...
				{:else}
					Sign In
				{/if}
			</button>
		</form>

		<p class="text-center text-slate-400 mt-6 text-sm">
			Don't have an account?
			<a href="/auth/signup" class="text-indigo-400 hover:text-indigo-300">Create one</a>
		</p>
	</div>
</div>