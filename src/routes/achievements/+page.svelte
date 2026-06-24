<script lang="ts">
	import { getAppState, checkAndUnlockAchievements } from '$lib/stores/app';
	import { BADGES } from '$lib/utils/badges';
	import { onMount } from 'svelte';

	const appState = getAppState();

	// Check for new achievements on mount
	onMount(() => {
		checkAndUnlockAchievements();
	});

	// Build a set of unlocked badge keys from persisted achievements
	let unlockedSet = $derived(new Set(appState.achievements.map(a => a.badge_key)));

	// Also check dynamic badges (streak, completion, level, stack count)
	let dynamicChecks = $derived(
		(() => {
			const checks: Record<string, boolean> = {};
			for (const a of appState.achievements) {
				checks[a.badge_key] = true;
			}
			// Also compute from current stats for real-time display
			const p = appState.profile;
			if (p) {
				if (p.longest_streak >= 3) checks['streak_3'] = true;
				if (p.longest_streak >= 7) checks['streak_7'] = true;
				if (p.longest_streak >= 14) checks['streak_14'] = true;
				if (p.longest_streak >= 30) checks['streak_30'] = true;
				if (p.longest_streak >= 100) checks['streak_100'] = true;
				if (p.total_completions >= 1) checks['first_habit'] = true;
				if (p.total_completions >= 10) checks['complete_10'] = true;
				if (p.total_completions >= 50) checks['complete_50'] = true;
				if (p.total_completions >= 100) checks['complete_100'] = true;
				if (p.total_completions >= 500) checks['complete_500'] = true;
				if (p.total_completions >= 1000) checks['complete_1000'] = true;
				if (p.level >= 5) checks['level_5'] = true;
				if (p.level >= 10) checks['level_10'] = true;
				if (p.level >= 25) checks['level_25'] = true;
				if (p.level >= 50) checks['level_50'] = true;
			}
			if (appState.stacks.length >= 1) checks['first_stack'] = true;
			if (appState.stacks.length >= 5) checks['stack_5'] = true;
			return checks;
		})()
	);

	let categories = $derived([
		{ name: 'Streaks', badges: BADGES.filter(b => b.category === 'streak') },
		{ name: 'Completions', badges: BADGES.filter(b => b.category === 'completion') },
		{ name: 'Stacks', badges: BADGES.filter(b => b.category === 'stack') },
		{ name: 'Levels', badges: BADGES.filter(b => b.category === 'level') },
		{ name: 'Special', badges: BADGES.filter(b => b.category === 'special') },
	]);

	let unlockedCount = $derived(
		BADGES.filter(b => dynamicChecks[b.key]).length
	);
	let totalCount = $derived(BADGES.length);
</script>

<div class="animate-fade-in">
	<h1 class="text-2xl font-bold text-white mb-2">Achievements</h1>
	<p class="text-sm text-slate-400 mb-6">{unlockedCount} / {totalCount} unlocked</p>

	<!-- Progress bar -->
	<div class="h-2 bg-slate-800 rounded-full overflow-hidden mb-8">
		<div
			class="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-500"
			style="width: {totalCount > 0 ? (unlockedCount / totalCount) * 100 : 0}%"
		></div>
	</div>

	<div class="space-y-8">
		{#each categories as category}
			{#if category.badges.length > 0}
				<div>
					<h2 class="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">{category.name}</h2>
					<div class="grid grid-cols-2 gap-3">
						{#each category.badges as badge (badge.key)}
							{@const isUnlocked = dynamicChecks[badge.key] === true}
							<div class="rounded-xl border {isUnlocked ? 'border-amber-500/30 bg-amber-500/5' : 'border-slate-800 bg-slate-900'} p-3 transition-all">
								<div class="flex items-start gap-3">
									<span class="text-2xl {isUnlocked ? '' : 'grayscale opacity-30'}">{badge.icon}</span>
									<div class="min-w-0">
										<h3 class="text-sm font-medium {isUnlocked ? 'text-white' : 'text-slate-500'}">{badge.name}</h3>
										<p class="text-xs {isUnlocked ? 'text-slate-400' : 'text-slate-600'} mt-0.5">{badge.description}</p>
									</div>
								</div>
								{#if isUnlocked}
									<div class="mt-2 flex items-center gap-1 text-xs text-amber-400">
										<svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
											<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
										</svg>
										Unlocked
									</div>
								{/if}
							</div>
						{/each}
					</div>
				</div>
			{/if}
		{/each}
	</div>
</div>