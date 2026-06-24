<script lang="ts">
	import { getAppState } from '$lib/stores/app';
	import { calculateStreak, xpProgressInLevel, completionHeatmapData, heatmapLevel } from '$lib/utils/gamification';
	import { today, generateDateRange, formatDate } from '$lib/utils/helpers';

	const appState = getAppState();

	// Generate last 365 days of data
	const dateRange = generateDateRange(365);
	const heatmapData = $derived(completionHeatmapData(appState.completions));
	const maxCompletions = $derived(Math.max(...heatmapData.values(), 0));

	// Get weekly grid (52 weeks x 7 days, like GitHub)
	function getHeatmapGrid(): { date: string; count: number; level: 0 | 1 | 2 | 3 | 4 }[][] {
		const weeks: { date: string; count: number; level: 0 | 1 | 2 | 3 | 4 }[][] = [];
		const todayDate = new Date();
		todayDate.setHours(0, 0, 0, 0);
		const todayDay = todayDate.getDay();

		// Go back ~52 weeks from today
		const startDate = new Date(todayDate);
		startDate.setDate(startDate.getDate() - (52 * 7 + todayDay) - 1);

		let currentWeek: { date: string; count: number; level: 0 | 1 | 2 | 3 | 4 }[] = [];
		let currentDate = new Date(startDate);

		while (currentDate <= todayDate) {
			const dateStr = currentDate.toISOString().slice(0, 10);
			const count = heatmapData.get(dateStr) ?? 0;
			const dayOfWeek = currentDate.getDay();

			currentWeek.push({
				date: dateStr,
				count,
				level: heatmapLevel(count, maxCompletions)
			});

			if (dayOfWeek === 6 || currentDate.getTime() === todayDate.getTime()) {
				weeks.push(currentWeek);
				currentWeek = [];
			}

			currentDate.setDate(currentDate.getDate() + 1);
		}

		if (currentWeek.length > 0) {
			weeks.push(currentWeek);
		}

		return weeks;
	}

	const heatmapGrid = $derived(getHeatmapGrid());

	function levelColor(level: number): string {
		const colors: Record<number, string> = {
			0: 'bg-slate-800',
			1: 'bg-indigo-900',
			2: 'bg-indigo-700',
			3: 'bg-indigo-500',
			4: 'bg-indigo-400',
		};
		return colors[level] ?? colors[0];
	}

	// Streak per habit
	function getStreaks(): { name: string; streak: number; habitId: string }[] {
		return appState.habits.map(h => {
			const dates = appState.completions
				.filter(c => c.habit_id === h.id)
				.map(c => c.completed_at);
			return { name: h.name, streak: calculateStreak(dates), habitId: h.id };
		}).sort((a, b) => b.streak - a.streak);
	}

	const streaks = $derived(getStreaks());

	// Total completions per day for last 7 days
	const last7Days = $derived(dateRange.slice(-7).map(date => ({
		date,
		count: appState.completions.filter(c => c.completed_at === date).length
	})));

	const progress = $derived(appState.profile ? xpProgressInLevel(appState.profile.xp) : null);
</script>

<div class="animate-fade-in">
	<h1 class="text-2xl font-bold text-white mb-6">Stats</h1>

	{#if appState.profile}
		<!-- Profile Summary -->
		<div class="grid grid-cols-2 gap-3 mb-6">
			<div class="bg-slate-900 border border-slate-800 rounded-xl p-4 text-center">
				<div class="text-2xl font-bold text-indigo-400">Lv.{appState.profile.level}</div>
				<div class="text-xs text-slate-400 mt-1">Level</div>
			</div>
			<div class="bg-slate-900 border border-slate-800 rounded-xl p-4 text-center">
				<div class="text-2xl font-bold text-amber-400">{appState.profile.xp}</div>
				<div class="text-xs text-slate-400 mt-1">Total XP</div>
			</div>
			<div class="bg-slate-900 border border-slate-800 rounded-xl p-4 text-center">
				<div class="text-2xl font-bold text-orange-400">{appState.profile.streak_days}</div>
				<div class="text-xs text-slate-400 mt-1">Current Streak</div>
			</div>
			<div class="bg-slate-900 border border-slate-800 rounded-xl p-4 text-center">
				<div class="text-2xl font-bold text-emerald-400">{appState.profile.total_completions}</div>
				<div class="text-xs text-slate-400 mt-1">Total Logged</div>
			</div>
		</div>

		<!-- XP Progress -->
		{#if progress}
			<div class="bg-slate-900 border border-slate-800 rounded-xl p-4 mb-6">
				<div class="flex justify-between text-sm mb-2">
					<span class="text-slate-400">Level {appState.profile.level}</span>
					<span class="text-indigo-400">{appState.profile.xp} XP</span>
				</div>
				<div class="h-3 bg-slate-800 rounded-full overflow-hidden">
					<div
						class="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-500"
						style="width: {progress.percent}%"
					></div>
				</div>
				<div class="text-xs text-slate-500 mt-1 text-center">
					{progress.current} / {progress.needed} XP to Level {appState.profile.level + 1}
				</div>
			</div>
		{/if}
	{/if}

	<!-- Heatmap -->
	<div class="bg-slate-900 border border-slate-800 rounded-xl p-4 mb-6">
		<h2 class="text-sm font-semibold text-white mb-3">Completion Heatmap</h2>
		<div class="overflow-x-auto -mx-2">
			<div class="inline-flex gap-0.5 min-w-full">
				{#each heatmapGrid as week}
					<div class="flex flex-col gap-0.5">
						{#each week as day}
							<div
								class="w-2.5 h-2.5 rounded-sm {levelColor(day.level)}"
								title="{day.date}: {day.count} completed"
							></div>
						{/each}
					</div>
				{/each}
			</div>
		</div>
		<div class="flex items-center justify-end gap-1 mt-2 text-xs text-slate-500">
			<span>Less</span>
			<div class="w-2.5 h-2.5 rounded-sm bg-slate-800"></div>
			<div class="w-2.5 h-2.5 rounded-sm bg-indigo-900"></div>
			<div class="w-2.5 h-2.5 rounded-sm bg-indigo-700"></div>
			<div class="w-2.5 h-2.5 rounded-sm bg-indigo-500"></div>
			<div class="w-2.5 h-2.5 rounded-sm bg-indigo-400"></div>
			<span>More</span>
		</div>
	</div>

	<!-- Last 7 Days -->
	<div class="bg-slate-900 border border-slate-800 rounded-xl p-4 mb-6">
		<h2 class="text-sm font-semibold text-white mb-3">Last 7 Days</h2>
		<div class="flex items-end justify-between gap-2 h-32">
			{#each last7Days as day}
				<div class="flex-1 flex flex-col items-center gap-1">
					<div class="w-full bg-slate-800 rounded-t relative" style="height: 100%">
						<div
							class="absolute bottom-0 left-0 right-0 bg-indigo-500 rounded-t transition-all"
							style="height: {Math.min(100, (day.count / Math.max(...last7Days.map(d => d.count), 1)) * 100)}%"
						></div>
					</div>
					<span class="text-xs text-slate-400">{formatDate(day.date)}</span>
				</div>
			{/each}
		</div>
	</div>

	<!-- Habit Streaks -->
	{#if streaks.length > 0}
		<div class="bg-slate-900 border border-slate-800 rounded-xl p-4">
			<h2 class="text-sm font-semibold text-white mb-3">Habit Streaks</h2>
			<div class="space-y-2">
				{#each streaks as item (item.habitId)}
					<div class="flex items-center justify-between py-1.5">
						<span class="text-sm text-slate-300">{item.name}</span>
						<div class="flex items-center gap-1.5">
							{#if item.streak > 0}
								<span class="text-orange-400">🔥</span>
							{/if}
							<span class="text-sm font-medium {item.streak > 0 ? 'text-white' : 'text-slate-500'}">
								{item.streak} day{item.streak !== 1 ? 's' : ''}
							</span>
						</div>
					</div>
				{/each}
			</div>
		</div>
	{/if}
</div>