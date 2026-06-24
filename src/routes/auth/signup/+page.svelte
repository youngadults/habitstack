<script lang="ts">
	import { signUp } from '$lib/services/auth';
	import { initializeState } from '$lib/stores/app';

	let email = $state('');
	let password = $state('');
	let confirmPassword = $state('');
	let error = $state('');
	let loading = $state(false);

	async function handleSubmit(e: Event) {
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
			<h1 class="text-2xl font-bold text-white">StackFlow</h1>
			<p class="text-slate-400 mt-1">Build habits, one stack at a time</p>
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
					placeholder="6+ characters"
					class="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
					required
				/>
			</div>

			<div>
				<label for="confirm" class="block text-sm font-medium text-slate-300 mb-1">Confirm Password</label>
				<input
					id="confirm"
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
				{#if loading}
					Creating account...
				{:else}
					Create Account
				{/if}
			</button>
		</form>

		<p class="text-center text-slate-400 mt-6 text-sm">
			Already have an account?
			<a href="/auth/login" class="text-indigo-400 hover:text-indigo-300">Sign in</a>
		</p>
	</div>
</div>