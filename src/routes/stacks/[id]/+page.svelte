<script lang="ts">
	import { getAppState, createHabit, updateHabit, removeHabit } from '$lib/stores/app';
	import { page } from '$app/state';

	const appState = getAppState();

	let stackId = $derived(page.params.id);
	let stack = $derived(appState.stacks.find(s => s.id === stackId));
	let habits = $derived(appState.habits.filter(h => h.stack_id === stackId));

	let showAddHabit = $state(false);
	let newHabitName = $state('');
	let newHabitDesc = $state('');
	let editingHabitId = $state<string | null>(null);
	let editName = $state('');
	let editDesc = $state('');
	let showDeleteConfirm = $state<string | null>(null);

	async function handleAddHabit() {
		if (!newHabitName.trim() || !stackId) return;
		await createHabit(stackId, newHabitName.trim(), newHabitDesc.trim() || undefined);
		newHabitName = '';
		newHabitDesc = '';
		showAddHabit = false;
	}

	function startEdit(id: string) {
		const habit = appState.habits.find(h => h.id === id);
		if (!habit) return;
		editingHabitId = id;
		editName = habit.name;
		editDesc = habit.description ?? '';
	}

	async function saveEdit() {
		if (!editingHabitId) return;
		const habit = appState.habits.find(h => h.id === editingHabitId);
		if (!habit) return;
		await updateHabit({ ...habit, name: editName.trim(), description: editDesc.trim() || undefined });
		editingHabitId = null;
	}

	async function handleDelete(id: string) {
		await removeHabit(id);
		showDeleteConfirm = null;
		editingHabitId = null;
	}
</script>

<div class="animate-fade-in">
	<a href="/stacks" class="text-indigo-400 hover:text-indigo-300 text-sm mb-4 inline-block">← All Stacks</a>

	{#if stack}
		<div class="flex items-center gap-3 mb-6">
			<span class="text-3xl">{stack.icon}</span>
			<div>
				<h1 class="text-xl font-bold text-white">{stack.name}</h1>
				<p class="text-sm text-slate-400">{stack.trigger}</p>
			</div>
		</div>

		<div class="space-y-2">
			{#each habits as habit (habit.id)}
				<div class="rounded-lg bg-slate-900 border border-slate-800 p-3">
					{#if editingHabitId === habit.id}
						<div class="space-y-2">
							<input
								type="text"
								bind:value={editName}
								class="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
							/>
							<input
								type="text"
								bind:value={editDesc}
								placeholder="Description (optional)"
								class="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
							/>
							<div class="flex gap-2">
								<button onclick={saveEdit} class="flex-1 py-1.5 bg-indigo-600 rounded text-sm text-white">Save</button>
								<button onclick={() => editingHabitId = null} class="flex-1 py-1.5 bg-slate-700 rounded text-sm text-white">Cancel</button>
							</div>
						</div>
					{:else}
						<div class="flex items-center justify-between">
							<div>
								<h3 class="font-medium text-white text-sm">{habit.name}</h3>
								{#if habit.description}
									<p class="text-xs text-slate-400 mt-0.5">{habit.description}</p>
								{/if}
							</div>
							<div class="flex items-center gap-1">
								<button onclick={() => startEdit(habit.id)} class="p-1.5 rounded hover:bg-slate-700 text-slate-400" aria-label="Edit habit">
									<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
										<path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
									</svg>
								</button>
								<button onclick={() => showDeleteConfirm = habit.id} class="p-1.5 rounded hover:bg-slate-700 text-slate-400 hover:text-red-400" aria-label="Delete habit">
									<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
										<path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
									</svg>
								</button>
							</div>
						</div>
						{#if showDeleteConfirm === habit.id}
							<div class="mt-2 p-2 bg-red-500/10 border border-red-500/20 rounded-lg">
								<p class="text-xs text-red-400 mb-1">Delete "{habit.name}"?</p>
								<div class="flex gap-2">
									<button onclick={() => handleDelete(habit.id)} class="px-3 py-1 bg-red-600 rounded text-xs text-white">Delete</button>
									<button onclick={() => showDeleteConfirm = null} class="px-3 py-1 bg-slate-700 rounded text-xs text-white">Cancel</button>
								</div>
							</div>
						{/if}
					{/if}
				</div>
			{/each}
		</div>

		<!-- Add Habit -->
		{#if showAddHabit}
			<div class="mt-3 p-4 bg-slate-900 border border-slate-700 rounded-lg">
				<h3 class="text-sm font-medium text-white mb-3">New Habit</h3>
				<div class="space-y-2">
					<input
						type="text"
						bind:value={newHabitName}
						placeholder="Habit name"
						class="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
						onkeydown={(e) => e.key === 'Enter' && handleAddHabit()}
					/>
					<input
						type="text"
						bind:value={newHabitDesc}
						placeholder="Description (optional)"
						class="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
					/>
					<div class="flex gap-2">
						<button onclick={handleAddHabit} class="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm text-white">Add</button>
						<button onclick={() => { showAddHabit = false; newHabitName = ''; newHabitDesc = ''; }} class="flex-1 py-2 bg-slate-700 rounded-lg text-sm text-white">Cancel</button>
					</div>
				</div>
			</div>
		{:else}
			<button
				onclick={() => showAddHabit = true}
				class="w-full mt-3 py-3 border border-dashed border-slate-700 rounded-lg text-slate-400 hover:text-white hover:border-indigo-500 transition-colors text-sm"
			>
				+ Add Habit
			</button>
		{/if}
	{:else}
		<div class="text-center py-16">
			<p class="text-slate-400">Stack not found</p>
			<a href="/stacks" class="text-indigo-400 hover:text-indigo-300 text-sm mt-2 inline-block">← Back to Stacks</a>
		</div>
	{/if}
</div>