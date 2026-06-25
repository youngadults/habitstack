<script lang="ts">
	import { STACK_COLORS, STACK_ICONS, colorBg } from '$lib/utils/helpers';

	let { onclose, oncreate, show = $bindable(false), name = $bindable(''), trigger = $bindable(''), color = $bindable('indigo'), icon = $bindable('☕') } = $props<{
		onclose: () => void;
		oncreate: () => void;
		show?: boolean;
		name?: string;
		trigger?: string;
		color?: string;
		icon?: string;
	}>();
</script>

{#if show}
	<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
	<div
		class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end justify-center animate-fade-in"
		role="dialog"
		aria-modal="true"
		aria-label="Create new stack"
		tabindex="-1"
		onclick={(e) => { if (e.target === e.currentTarget) onclose(); }}
		onkeydown={(e) => { if (e.key === 'Escape') onclose(); }}
	>
		<div class="w-full max-w-lg bg-slate-900 rounded-t-2xl p-6 animate-slide-up safe-bottom">
			<h2 class="text-lg font-bold text-white mb-4">Create New Stack</h2>

			<div class="space-y-4">
				<div>
					<label for="new-stack-name" class="block text-sm font-medium text-slate-300 mb-1">Stack Name</label>
					<input
						id="new-stack-name"
						type="text"
						bind:value={name}
						placeholder="Morning Routine"
						class="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
					/>
				</div>

				<div>
					<label for="new-stack-trigger" class="block text-sm font-medium text-slate-300 mb-1">Trigger</label>
					<input
						id="new-stack-trigger"
						type="text"
						bind:value={trigger}
						placeholder="After I make coffee..."
						class="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
					/>
				</div>

				<div>
					<span class="block text-sm font-medium text-slate-300 mb-1">Color</span>
					<div class="flex flex-wrap gap-2">
						{#each STACK_COLORS as c}
							<button
								onclick={() => color = c}
								class="w-8 h-8 rounded-full {colorBg(c)} {color === c ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900' : ''}"
								aria-label="Select {c} color"
							></button>
						{/each}
					</div>
				</div>

				<div>
					<span class="block text-sm font-medium text-slate-300 mb-1">Icon</span>
					<div class="flex flex-wrap gap-2">
						{#each STACK_ICONS as i}
							<button
								onclick={() => icon = i}
								class="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center text-lg {icon === i ? 'ring-2 ring-indigo-500' : ''}"
								aria-label="Select {i} icon"
							>
								{i}
							</button>
						{/each}
					</div>
				</div>
			</div>

			<div class="flex gap-3 mt-6">
				<button
					onclick={onclose}
					class="flex-1 py-3 bg-slate-700 rounded-lg font-medium text-white"
				>Cancel</button>
				<button
					onclick={oncreate}
					disabled={!name.trim() || !trigger.trim()}
					class="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 disabled:cursor-not-allowed rounded-lg font-medium text-white"
				>Create</button>
			</div>
		</div>
	</div>
{/if}