<script lang="ts">
	import { getAppState } from '$lib/stores/app';
	import { BADGES, checkAllAchievements } from '$lib/utils/badges';

	const appState = getAppState();

	// Determine which badges are unlocked based on profile stats
	let badgeStatus = $derived(
		checkAllAchievements(
			appState.profile?.longest_streak ?? 0,
			appState.profile?.total_completions ?? 0,
			appState.profile?.level ?? 0,
			appState.stacks.length,
			false
		)
	);

	let unlockedSet = $derived(new Set(badgeStatus.filter(b => b.shouldUnlock).map(b => b.badgeKey)));

	// Group by category
	let categories = $derived([
		{ name: 'Streaks', key: 'streak', badges: BADGES.filter(b => b.category === 'streak') },
		{ name: 'Completions', key: 'completion', badges: BADGES.filter(b => b.category === 'completion') },
		{ name: 'Stacks', key: 'stack', badges: BADGES.filter(b => b.category === 'stack') },
		{ name: 'Levels', key: 'level', badges: BADGES.filter(b => b.category === 'level') },
		{ name: 'Special', key: 'special', badges: BADGES.filter(b => b.category === 'special') },
	]);

	let unlockedCount = $derived(unlockedSet.size);
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
							{@const isUnlocked = unlockedSet.has(badge.key)}
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