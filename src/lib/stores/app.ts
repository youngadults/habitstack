// Svelte stores for app state management
// Uses runes ($state) for Svelte 5 reactivity

import type { Stack, Habit, Completion, Achievement, Profile, StackChecklist, HabitWithCompletions } from '$lib/types';
import * as db from '$lib/services/db';
import * as sync from '$lib/services/sync';
import { calculateStreak } from '$lib/utils/gamification';
import { generateId, today } from '$lib/utils/helpers';
import {
	updateProfileOnComplete as doUpdateProfileComplete,
	updateProfileOnUncomplete as doUpdateProfileUncomplete,
	checkAndUnlockAchievements as doCheckAchievements,
	checkIfFullStackToday
} from './profile';

// App state using Svelte 5 runes
let stacks = $state<Stack[]>([]);
let habits = $state<Habit[]>([]);
let completions = $state<Completion[]>([]);
let achievements = $state<Achievement[]>([]);
let profile = $state<Profile | null>(null);
let userId = $state<string | null>(null);
let isLoading = $state(true);

export function getAppState() {
	return {
		get stacks() { return stacks; },
		get habits() { return habits; },
		get completions() { return completions; },
		get achievements() { return achievements; },
		get profile() { return profile; },
		get userId() { return userId; },
		get isLoading() { return isLoading; },
	};
}

// Initialize app state for a user
export async function initializeState(uid: string): Promise<void> {
	userId = uid;
	isLoading = true;

	try {
		const [dbStacks, dbHabits, dbCompletions, dbProfile, dbAchievements] = await Promise.all([
			db.getAllStacks(uid),
			db.getAllHabitsByUser(uid),
			db.getCompletionsByUser(uid),
			db.getProfile(uid),
			db.getAchievementsByUser(uid)
		]);

		stacks = dbStacks;
		habits = dbHabits;
		completions = dbCompletions;
		achievements = dbAchievements;

		if (dbProfile) {
			profile = dbProfile;
		} else {
			const newProfile: Profile = {
				id: uid, xp: 0, level: 0, streak_days: 0,
				longest_streak: 0, total_completions: 0, theme: 'default',
				created_at: new Date().toISOString(), updated_at: new Date().toISOString()
			};
			await db.saveProfile(newProfile);
			profile = newProfile;
		}

		await sync.fullSync(uid);

		const [sStacks, sHabits, sCompletions, sProfile, sAchievements] = await Promise.all([
			db.getAllStacks(uid), db.getAllHabitsByUser(uid),
			db.getCompletionsByUser(uid), db.getProfile(uid), db.getAchievementsByUser(uid)
		]);

		stacks = sStacks;
		habits = sHabits;
		completions = sCompletions;
		if (sProfile) profile = sProfile;
		achievements = sAchievements;
	} finally {
		isLoading = false;
	}
}

export function resetState(): void {
	stacks = [];
	habits = [];
	completions = [];
	achievements = [];
	profile = null;
	userId = null;
	isLoading = true;
	db.resetDB();
}

// ============ STACK OPERATIONS ============

export async function createStack(name: string, trigger: string, color: string, icon: string): Promise<Stack> {
	if (!userId) throw new Error('Not authenticated');
	const stack: Stack = {
		id: generateId(), user_id: userId, name, trigger, color, icon,
		sort_order: stacks.length, created_at: new Date().toISOString(), updated_at: new Date().toISOString()
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
		id: generateId(), stack_id: stackId, user_id: userId, name, description,
		sort_order: stackHabits.length, created_at: new Date().toISOString(), updated_at: new Date().toISOString()
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
		await db.deleteCompletion(existing.id);
		await sync.pushToSyncQueue('completions', 'delete', { id: existing.id });
		completions = completions.filter(c => c.id !== existing.id);
		if (profile) {
			profile = await doUpdateProfileUncomplete(profile);
		}
		return false;
	}

	const completion: Completion = {
		id: generateId(), habit_id: habitId, user_id: userId,
		completed_at: completedDate, created_at: new Date().toISOString()
	};
	await db.saveCompletion(completion);
	await sync.pushToSyncQueue('completions', 'insert', completion as unknown as Record<string, unknown>);
	completions = [...completions, completion];

	if (profile) {
		profile = await doUpdateProfileComplete(profile, completions, stacks, habits);
		// Check for new achievements
		const result = await doCheckAchievements(
			profile, achievements, stacks, userId!, checkIfFullStackToday(stacks, habits, completions)
		);
		if (result.newAchievements.length > 0) {
			achievements = [...achievements, ...result.newAchievements];
		}
	}

	return true;
}

export async function checkAndUnlockAchievements(): Promise<string[]> {
	if (!profile || !userId) return [];
	const result = await doCheckAchievements(
		profile, achievements, stacks, userId, checkIfFullStackToday(stacks, habits, completions)
	);
	if (result.newAchievements.length > 0) {
		achievements = [...achievements, ...result.newAchievements];
	}
	return result.badgeKeys;
}