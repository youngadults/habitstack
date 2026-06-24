<script lang="ts">
	import { getAppState, toggleCompletion, createStack, createHabit } from '$lib/stores/app';
	import { today, formatDate, randomColor, randomIcon } from '$lib/utils/helpers';
	import { calculateStreak, xpProgressInLevel } from '$lib/utils/gamification';
	import NewStackModal from '$lib/components/NewStackModal.svelte';

	const appState = getAppState();

	let showNewStack = $state(false);
	let newStackName = $state('');
	let newStackTrigger = $state('');
	let newStackColor = $state(randomColor());
	let newStackIcon = $state(randomIcon());
	let newHabitStackId = $state<string | null>(null);
	let newHabitName = $state('');

	const todayStr = today();
	const dateObj = new Date();
	const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
	const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
	const dayName = dayNames[dateObj.getDay()];
	const monthName = monthNames[dateObj.getMonth()];
	const dateNum = dateObj.getDate();

	function getStackChecklist() {
		return appState.stacks.map(stack => {
			const stackHabits = appState.habits.filter(h => h.stack_id === stack.id);
			const completedCount = stackHabits.filter(h =>
				appState.completions.some(c => c.habit_id === h.id && c.completed_at === todayStr)
			).length;
			return {
				...stack,
				habits: stackHabits,
				completedCount,
				totalCount: stackHabits.length,
				allComplete: stackHabits.length > 0 && completedCount === stackHabits.length
			};
		});
	}

	async function handleToggle(habitId: string) {
		await toggleCompletion(habitId);
	}

	async function handleCreateStack() {
		if (!newStackName.trim() || !newStackTrigger.trim()) return;
		await createStack(newStackName.trim(), newStackTrigger.trim(), newStackColor, newStackIcon);
		resetNewStack();
	}

	function resetNewStack() {
		newStackName = '';
		newStackTrigger = '';
		newStackColor = randomColor();
		newStackIcon = randomIcon();
		showNewStack = false;
	}

	async function handleCreateHabit() {
		if (!newHabitName.trim() || !newHabitStackId) return;
		await createHabit(newHabitStackId, newHabitName.trim());
		newHabitName = '';
		newHabitStackId = null;
	}

	function getHabitStreak(habitId: string): number {
		const dates = appState.completions
			.filter(c => c.habit_id === habitId)
			.map(c => c.completed_at);
		return calculateStreak(dates);
	}

	function isHabitCompletedToday(habitId: string): boolean {
		return appState.completions.some(c => c.habit_id === habitId && c.completed_at === todayStr);
	}

	function colorClasses(color: string): string {
		const map: Record<string, string> = {
			indigo: 'bg-indigo-500/20 border-indigo-500/30 text-indigo-400',
			violet: 'bg-violet-500/20 border-violet-500/30 text-violet-400',
			fuchsia: 'bg-fuchsia-500/20 border-fuchsia-500/30 text-fuchsia-400',
			pink: 'bg-pink-500/20 border-pink-500/30 text-pink-400',
			rose: 'bg-rose-500/20 border-rose-500/30 text-rose-400',
			red: 'bg-red-500/20 border-red-500/30 text-red-400',
			orange: 'bg-orange-500/20 border-orange-500/30 text-orange-400',
			amber: 'bg-amber-500/20 border-amber-500/30 text-amber-400',
			yellow: 'bg-yellow-500/20 border-yellow-500/30 text-yellow-400',
			lime: 'bg-lime-500/20 border-lime-500/30 text-lime-400',
			green: 'bg-green-500/20 border-green-500/30 text-green-400',
			emerald: 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400',
			teal: 'bg-teal-500/20 border-teal-500/30 text-teal-400',
			cyan: 'bg-cyan-500/20 border-cyan-500/30 text-cyan-400',
			sky: 'bg-sky-500/20 border-sky-500/30 text-sky-400',
			blue: 'bg-blue-500/20 border-blue-500/30 text-blue-400',
		};
		return map[color] ?? map.indigo;
	}

	function completedBg(color: string): string {
		const map: Record<string, string> = {
			indigo: 'bg-indigo-600', violet: 'bg-violet-600', fuchsia: 'bg-fuchsia-600',
			pink: 'bg-pink-600', rose: 'bg-rose-600', red: 'bg-red-600',
			orange: 'bg-orange-600', amber: 'bg-amber-600', yellow: 'bg-yellow-600',
			lime: 'bg-lime-600', green: 'bg-green-600', emerald: 'bg-emerald-600',
			teal: 'bg-teal-600', cyan: 'bg-cyan-600', sky: 'bg-sky-600', blue: 'bg-blue-600',
		};
		return map[color] ?? map.indigo;
	}

	let checklist = $derived(getStackChecklist());
	let progress = $derived(appState.profile ? xpProgressInLevel(appState.profile.xp) : null);

	// Streak nudge: habits with streaks >= 3 that haven't been completed today
	let streakAtRisk = $derived(
		appState.habits
			.filter(h => !isHabitCompletedToday(h.id) && getHabitStreak(h.id) >= 3)
			.map(h => ({ name: h.name, streak: getHabitStreak(h.id) }))
	);
</script>

<div class="animate-fade-in">
	<!-- Header -->
	<div class="flex items-center justify-between mb-6">
		<div>
			<p class="text-slate-400 text-sm">{dayName}</p>
			<h1 class="text-2xl font-bold text-white">{monthName} {dateNum}</h1>
		</div>
		{#if appState.profile}
			<div class="flex items-center gap-3">
				<div class="text-right">
					<div class="text-sm font-medium text-indigo-400">Level {appState.profile.level}</div>
					<div class="text-xs text-slate-500">{appState.profile.xp} XP</div>
				</div>
				<div class="w-10 h-10 rounded-full bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-lg">
					{appState.profile.streak_days > 0 ? '🔥' : '⭐'}
				</div>
			</div>
		{/if}
	</div>

	<!-- XP Progress -->
	{#if appState.profile && appState.profile.level > 0 && progress}
		<div class="mb-6">
			<div class="flex justify-between text-xs text-slate-400 mb-1">
				<span>Level {appState.profile.level}</span>
				<span>Level {appState.profile.level + 1}</span>
			</div>
			<div class="h-2 bg-slate-800 rounded-full overflow-hidden">
				<div
					class="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-500"
					style="width: {progress.percent}%"
				></div>
			</div>
			<div class="text-xs text-slate-500 mt-1 text-center">{progress.current} / {progress.needed} XP</div>
		</div>
	{/if}

	<!-- Streak Nudge -->
	{#if streakAtRisk.length > 0}
		{#if streakAtRisk.length === 1}
			<div class="mb-4 px-4 py-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center gap-3">
				<span class="text-2xl">⚠️</span>
				<div>
					<p class="text-sm font-medium text-amber-400">Streak at risk!</p>
					<p class="text-xs text-slate-400">{streakAtRisk[0].name} — {streakAtRisk[0].streak}-day streak</p>
				</div>
			</div>
		{:else}
			<div class="mb-4 px-4 py-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center gap-3">
				<span class="text-2xl">⚠️</span>
				<div>
					<p class="text-sm font-medium text-amber-400">{streakAtRisk.length} streaks at risk</p>
					<p class="text-xs text-slate-400">Complete them today to keep your streaks alive</p>
				</div>
			</div>
		{/if}
	{/if}

	<!-- Stacks Checklist -->
	{#if checklist.length === 0}
		<div class="text-center py-16">
			<div class="text-6xl mb-4">🏗️</div>
			<h2 class="text-xl font-semibold text-white mb-2">No stacks yet</h2>
			<p class="text-slate-400 mb-6">Create your first habit stack to get started</p>
			<button
				onclick={() => showNewStack = true}
				class="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-lg font-medium text-white"
			>
				Create Your First Stack
			</button>
		</div>
	{:else}
		<div class="space-y-4">
			{#each checklist as stack (stack.id)}
				<div class="rounded-xl border {colorClasses(stack.color)} overflow-hidden">
					<!-- Stack header -->
					<div class="px-4 py-3 flex items-center justify-between">
						<div class="flex items-center gap-2">
							<span class="text-xl">{stack.icon}</span>
							<div>
								<h3 class="font-semibold text-white text-sm">{stack.name}</h3>
								<p class="text-xs text-slate-400">{stack.trigger}</p>
							</div>
						</div>
						<div class="flex items-center gap-2">
							{#if stack.allComplete}
								<span class="text-xs {completedBg(stack.color)} text-white px-2 py-0.5 rounded-full">Done!</span>
							{:else}
								<span class="text-xs text-slate-400">{stack.completedCount}/{stack.totalCount}</span>
							{/if}
							<a href="/stacks/{stack.id}" class="text-slate-400 hover:text-white" aria-label="View {stack.name} details">
								<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
									<path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
								</svg>
							</a>
						</div>
					</div>

					<!-- Habits checklist -->
					{#if stack.habits.length > 0}
						<div class="px-2 pb-2 space-y-0.5">
							{#each stack.habits as habit (habit.id)}
								{@const completed = isHabitCompletedToday(habit.id)}
								{@const streak = getHabitStreak(habit.id)}
								<button
									onclick={() => handleToggle(habit.id)}
									class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all {completed
										? 'bg-slate-800/50'
										: 'bg-slate-900/50 hover:bg-slate-800/50'}"
								>
									<div class="w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all {completed
										? completedBg(stack.color) + ' border-transparent'
										: 'border-slate-600'}">
										{#if completed}
											<svg class="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
												<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
											</svg>
										{/if}
									</div>
									<span class="flex-1 text-left text-sm {completed ? 'text-slate-500 line-through' : 'text-white'}">
										{habit.name}
									</span>
									{#if streak > 1}
										<span class="text-xs text-orange-400">🔥 {streak}</span>
									{/if}
								</button>
							{/each}
						</div>
					{/if}

					<!-- Add habit inline -->
					{#if newHabitStackId === stack.id}
						<div class="px-4 pb-3">
							<div class="flex gap-2">
								<input
									type="text"
									bind:value={newHabitName}
									placeholder="New habit..."
									class="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
									onkeydown={(e) => e.key === 'Enter' && handleCreateHabit()}
								/>
								<button onclick={handleCreateHabit} class="px-3 py-2 bg-indigo-600 rounded-lg text-sm text-white">Add</button>
								<button onclick={() => { newHabitStackId = null; newHabitName = ''; }} class="px-3 py-2 bg-slate-700 rounded-lg text-sm text-white">✕</button>
							</div>
						</div>
					{:else}
						<button
							onclick={() => newHabitStackId = stack.id}
							class="w-full px-4 py-2 text-xs text-slate-400 hover:text-white hover:bg-slate-800/30 transition-colors"
						>
							+ Add habit
						</button>
					{/if}
				</div>
			{/each}
		</div>

		<button
			onclick={() => showNewStack = true}
			class="w-full mt-4 py-3 border border-dashed border-slate-700 rounded-xl text-slate-400 hover:text-white hover:border-indigo-500 transition-colors"
		>
			+ New Stack
		</button>
	{/if}
</div>

<NewStackModal
	bind:show={showNewStack}
	bind:name={newStackName}
	bind:trigger={newStackTrigger}
	bind:color={newStackColor}
	bind:icon={newStackIcon}
	onclose={resetNewStack}
	oncreate={handleCreateStack}
/>