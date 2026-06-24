// Svelte stores for app state management
// Uses runes ($state) for Svelte 5 reactivity

import type { Stack, Habit, Completion, Profile, StackChecklist, HabitWithCompletions } from '$lib/types';
import * as db from '$lib/services/db';
import * as sync from '$lib/services/sync';
import { calculateStreak, calculateXPGain, checkLevelUp } from '$lib/utils/gamification';
import { generateId, today } from '$lib/utils/helpers';
import { levelFromXp } from '$lib/utils/gamification';

// App state using Svelte 5 runes
let stacks = $state<Stack[]>([]);
let habits = $state<Habit[]>([]);
let completions = $state<Completion[]>([]);
let profile = $state<Profile | null>(null);
let userId = $state<string | null>(null);
let isLoading = $state(true);

// Derived state
let stacksChecklist = $derived<StackChecklist[]>([]);

export function getAppState() {
	return {
		get stacks() { return stacks; },
		get habits() { return habits; },
		get completions() { return completions; },
		get profile() { return profile; },
		get userId() { return userId; },
		get isLoading() { return isLoading; },
		get stacksChecklist() { return stacksChecklist; },
	};
}

// Initialize app state for a user
export async function initializeState(uid: string): Promise<void> {
	userId = uid;
	isLoading = true;

	try {
		// Load from IndexedDB first (instant)
		const [dbStacks, dbHabits, dbCompletions, dbProfile] = await Promise.all([
			db.getAllStacks(uid),
			db.getAllHabitsByUser(uid),
			db.getCompletionsByUser(uid),
			db.getProfile(uid)
		]);

		stacks = dbStacks;
		habits = dbHabits;
		completions = dbCompletions;

		if (dbProfile) {
			profile = dbProfile;
		} else {
			// Create default profile
			const newProfile: Profile = {
				id: uid,
				xp: 0,
				level: 0,
				streak_days: 0,
				longest_streak: 0,
				total_completions: 0,
				theme: 'default',
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString()
			};
			await db.saveProfile(newProfile);
			profile = newProfile;
		}

		// Then sync with remote
		await sync.fullSync(uid);

		// Reload after sync
		const [syncedStacks, syncedHabits, syncedCompletions, syncedProfile] = await Promise.all([
			db.getAllStacks(uid),
			db.getAllHabitsByUser(uid),
			db.getCompletionsByUser(uid),
			db.getProfile(uid)
		]);

		stacks = syncedStacks;
		habits = syncedHabits;
		completions = syncedCompletions;
		if (syncedProfile) profile = syncedProfile;

	} finally {
		isLoading = false;
	}
}

export function resetState(): void {
	stacks = [];
	habits = [];
	completions = [];
	profile = null;
	userId = null;
	isLoading = true;
	db.resetDB();
}

// ============ STACK OPERATIONS ============

export async function createStack(name: string, trigger: string, color: string, icon: string): Promise<Stack> {
	if (!userId) throw new Error('Not authenticated');

	const stack: Stack = {
		id: generateId(),
		user_id: userId,
		name,
		trigger,
		color,
		icon,
		sort_order: stacks.length,
		created_at: new Date().toISOString(),
		updated_at: new Date().toISOString()
	};

	await db.saveStack(stack);
	await sync.pushToSyncQueue('stacks', 'insert', stack as unknown as Record<string, unknown>);
	stacks = [...stacks, stack];
	return stack;
}

export async function updateStack(stack: Stack): Promise<void> {
	const updated = { ...stack, updated_at: new Date().toISOString() };
	await db.saveStack(updated);
	await sync.pushToSyncQueue('stacks', 'update', updated as unknown as Record<string, unknown>);
	stacks = stacks.map(s => s.id === updated.id ? updated : s);
}

export async function removeStack(id: string): Promise<void> {
	await db.deleteStack(id);
	await sync.pushToSyncQueue('stacks', 'delete', { id });
	stacks = stacks.filter(s => s.id !== id);
	habits = habits.filter(h => h.stack_id !== id);
}

// ============ HABIT OPERATIONS ============

export async function createHabit(stackId: string, name: string, description?: string): Promise<Habit> {
	if (!userId) throw new Error('Not authenticated');

	const stackHabits = habits.filter(h => h.stack_id === stackId);
	const habit: Habit = {
		id: generateId(),
		stack_id: stackId,
		user_id: userId,
		name,
		description,
		sort_order: stackHabits.length,
		created_at: new Date().toISOString(),
		updated_at: new Date().toISOString()
	};

	await db.saveHabit(habit);
	await sync.pushToSyncQueue('habits', 'insert', habit as unknown as Record<string, unknown>);
	habits = [...habits, habit];
	return habit;
}

export async function updateHabit(habit: Habit): Promise<void> {
	const updated = { ...habit, updated_at: new Date().toISOString() };
	await db.saveHabit(updated);
	await sync.pushToSyncQueue('habits', 'update', updated as unknown as Record<string, unknown>);
	habits = habits.map(h => h.id === updated.id ? updated : h);
}

export async function removeHabit(id: string): Promise<void> {
	await db.deleteHabit(id);
	await sync.pushToSyncQueue('habits', 'delete', { id });
	habits = habits.filter(h => h.id !== id);
	completions = completions.filter(c => c.habit_id !== id);
}

// ============ COMPLETION OPERATIONS ============

export async function toggleCompletion(habitId: string, date?: string): Promise<boolean> {
	if (!userId) throw new Error('Not authenticated');

	const completedDate = date ?? today();
	const existing = completions.find(c => c.habit_id === habitId && c.completed_at === completedDate);

	if (existing) {
		// Uncomplete
		await db.deleteCompletion(existing.id);
		await sync.pushToSyncQueue('completions', 'delete', { id: existing.id });
		completions = completions.filter(c => c.id !== existing.id);
		await updateProfileOnUncomplete();
		return false;
	} else {
		// Complete
		const completion: Completion = {
			id: generateId(),
			habit_id: habitId,
			user_id: userId,
			completed_at: completedDate,
			created_at: new Date().toISOString()
		};
		await db.saveCompletion(completion);
		await sync.pushToSyncQueue('completions', 'insert', completion as unknown as Record<string, unknown>);
		completions = [...completions, completion];
		await updateProfileOnComplete();
		return true;
	}
}

async function updateProfileOnComplete(): Promise<void> {
	if (!profile || !userId) return;

	const newTotal = profile.total_completions + 1;
	const habitDates = completions.map(c => c.completed_at);
	const newStreak = calculateStreak(habitDates);
	const newLongest = Math.max(profile.longest_streak, newStreak);

	// Calculate XP for this completion
	const todayCompletions = completions.filter(c => c.completed_at === today());
	const todayHabitsCount = todayCompletions.length;
	const isFullStack = checkIfFullStackToday();
	const xpGain = calculateXPGain(todayHabitsCount, newStreak, isFullStack);
	const newXp = profile.xp + xpGain.total;
	const newLevel = levelFromXp(newXp);

	const updatedProfile: Profile = {
		...profile,
		xp: newXp,
		level: newLevel,
		streak_days: newStreak,
		longest_streak: newLongest,
		total_completions: newTotal,
		updated_at: new Date().toISOString()
	};

	await db.saveProfile(updatedProfile);
	await sync.pushToSyncQueue('profiles', 'update', updatedProfile as unknown as Record<string, unknown>);
	profile = updatedProfile;
}

async function updateProfileOnUncomplete(): Promise<void> {
	if (!profile || !userId) return;

	const newTotal = Math.max(0, profile.total_completions - 1);
	const habitDates = completions.map(c => c.completed_at);
	const newStreak = calculateStreak(habitDates);

	// Recalculate level from remaining XP
	// Deduct XP (simplified — just recalculate)
	const todayCompletions = completions.filter(c => c.completed_at === today());
	const isFullStack = checkIfFullStackToday();
	const xpGain = calculateXPGain(todayCompletions.length, newStreak, isFullStack);
	// We recalculate total XP by removing the last gain
	// This is approximate — for exact, we'd need to track per-completion XP
	const newXp = Math.max(0, profile.xp - 10); // Deduct base XP for one habit
	const newLevel = levelFromXp(newXp);

	const updatedProfile: Profile = {
		...profile,
		xp: newXp,
		level: newLevel,
		streak_days: newStreak,
		total_completions: newTotal,
		updated_at: new Date().toISOString()
	};

	await db.saveProfile(updatedProfile);
	await sync.pushToSyncQueue('profiles', 'update', updatedProfile as unknown as Record<string, unknown>);
	profile = updatedProfile;
}

function checkIfFullStackToday(): boolean {
	const todayStr = today();
	for (const stack of stacks) {
		const stackHabits = habits.filter(h => h.stack_id === stack.id);
		if (stackHabits.length === 0) continue;
		const allComplete = stackHabits.every(h =>
			completions.some(c => c.habit_id === h.id && c.completed_at === todayStr)
		);
		if (allComplete) return true;
	}
	return false;
}