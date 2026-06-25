<script lang="ts">
	import { getAppState, removeStack, updateStack } from '$lib/stores/app.svelte';
	import { STACK_COLORS, STACK_ICONS, colorClasses, colorBg } from '$lib/utils/helpers';

	const appState = getAppState();

	let editingStackId = $state<string | null>(null);
	let editName = $state('');
	let editTrigger = $state('');
	let editColor = $state('indigo');
	let editIcon = $state('☕');
	let showDeleteConfirm = $state<string | null>(null);

	function startEdit(id: string) {
		const stack = appState.stacks.find(s => s.id === id);
		if (!stack) return;
		editingStackId = id;
		editName = stack.name;
		editTrigger = stack.trigger;
		editColor = stack.color;
		editIcon = stack.icon;
	}

	async function saveEdit() {
		if (!editingStackId) return;
		const stack = appState.stacks.find(s => s.id === editingStackId);
		if (!stack) return;
		await updateStack({ ...stack, name: editName.trim(), trigger: editTrigger.trim(), color: editColor, icon: editIcon });
		editingStackId = null;
	}

	async function handleDelete(id: string) {
		await removeStack(id);
		showDeleteConfirm = null;
		editingStackId = null;
	}
</script>

<div class="animate-fade-in">
	<div class="flex items-center justify-between mb-6">
		<h1 class="text-2xl font-bold text-white">Stacks</h1>
		<a href="/" class="text-indigo-400 hover:text-indigo-300 text-sm">← Today</a>
	</div>

	{#if appState.stacks.length === 0}
		<div class="text-center py-16">
			<div class="text-6xl mb-4">🏗️</div>
			<h2 class="text-xl font-semibold text-white mb-2">No stacks yet</h2>
			<p class="text-slate-400 mb-6">Head to the Today page to create your first stack</p>
			<a href="/" class="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-lg font-medium text-white inline-block">
				Go to Today
			</a>
		</div>
	{:else}
		<div class="space-y-3">
			{#each appState.stacks as stack (stack.id)}
				{@const habitCount = appState.habits.filter(h => h.stack_id === stack.id).length}
				<div class="rounded-xl border {colorClasses(stack.color)} p-4">
					{#if editingStackId === stack.id}
						<div class="space-y-3">
							<input
								type="text"
								bind:value={editName}
								class="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
							/>
							<input
								type="text"
								bind:value={editTrigger}
								placeholder="After I..."
								class="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
							/>
							<div>
								<span class="text-xs text-slate-400 mb-1 block">Color</span>
								<div class="flex flex-wrap gap-2">
									{#each STACK_COLORS as color}
										<button
											onclick={() => editColor = color}
											class="w-7 h-7 rounded-full {colorBg(color)} {editColor === color ? 'ring-2 ring-white ring-offset-1 ring-offset-slate-900' : ''}"
											aria-label="Select {color} color"
										></button>
									{/each}
								</div>
							</div>
							<div>
								<span class="text-xs text-slate-400 mb-1 block">Icon</span>
								<div class="flex flex-wrap gap-2">
									{#each STACK_ICONS as icon}
										<button
											onclick={() => editIcon = icon}
											class="w-9 h-9 rounded-lg bg-slate-800 flex items-center justify-center {editIcon === icon ? 'ring-2 ring-indigo-500' : ''}"
											aria-label="Select {icon} icon"
										>
											{icon}
										</button>
									{/each}
								</div>
							</div>
							<div class="flex gap-2">
								<button onclick={saveEdit} class="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm text-white">Save</button>
								<button onclick={() => editingStackId = null} class="flex-1 py-2 bg-slate-700 rounded-lg text-sm text-white">Cancel</button>
							</div>
						</div>
					{:else}
						<div class="flex items-center justify-between">
							<div class="flex items-center gap-3">
								<span class="text-2xl">{stack.icon}</span>
								<div>
									<h3 class="font-semibold text-white">{stack.name}</h3>
									<p class="text-xs text-slate-400">{stack.trigger}</p>
								</div>
							</div>
							<div class="flex items-center gap-2">
								<span class="text-xs text-slate-400">{habitCount} habit{habitCount !== 1 ? 's' : ''}</span>
								<button onclick={() => startEdit(stack.id)} class="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white" aria-label="Edit stack">
									<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
										<path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
									</svg>
								</button>
							</div>
						</div>

						<!-- Habits list -->
						{#if habitCount > 0}
							<div class="mt-3 space-y-1">
								{#each appState.habits.filter(h => h.stack_id === stack.id) as habit (habit.id)}
									<div class="flex items-center gap-2 text-sm text-slate-300 py-1">
										<span class="w-1.5 h-1.5 rounded-full {colorBg(stack.color)}"></span>
										{habit.name}
									</div>
								{/each}
							</div>
							<a href="/stacks/{stack.id}" class="block mt-2 text-xs text-indigo-400 hover:text-indigo-300">
								Manage habits →
							</a>
						{/if}

						<!-- Delete -->
						{#if showDeleteConfirm === stack.id}
							<div class="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
								<p class="text-sm text-red-400 mb-2">Delete this stack and all its habits?</p>
								<div class="flex gap-2">
									<button onclick={() => handleDelete(stack.id)} class="flex-1 py-1.5 bg-red-600 hover:bg-red-500 rounded text-sm text-white">Delete</button>
									<button onclick={() => showDeleteConfirm = null} class="flex-1 py-1.5 bg-slate-700 rounded text-sm text-white">Cancel</button>
								</div>
							</div>
						{:else}
							<button
								onclick={() => showDeleteConfirm = stack.id}
								class="mt-2 text-xs text-red-400/60 hover:text-red-400"
							>Delete stack</button>
						{/if}
					{/if}
				</div>
			{/each}
		</div>
	{/if}
</div>