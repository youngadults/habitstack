// Profile and achievement logic — pure functions that operate on state
// Called from the main app store which holds all $state variables

import type { Stack, Habit, Completion, Achievement, Profile } from '$lib/types';
import * as db from '$lib/services/db';
import * as sync from '$lib/services/sync';
import { calculateStreak, calculateXPGain, levelFromXp } from '$lib/utils/gamification';
import { generateId, today } from '$lib/utils/helpers';
import { checkAllAchievements } from '$lib/utils/badges';

export function checkIfFullStackToday(
	stacks: Stack[],
	habits: Habit[],
	completions: Completion[]
): boolean {
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

export async function updateProfileOnComplete(
	profile: Profile,
	completions: Completion[],
	stacks: Stack[],
	habits: Habit[]
): Promise<Profile> {
	const newTotal = profile.total_completions + 1;
	const habitDates = completions.map(c => c.completed_at);
	const newStreak = calculateStreak(habitDates);
	const newLongest = Math.max(profile.longest_streak, newStreak);

	const todayCompletions = completions.filter(c => c.completed_at === today());
	const isFullStack = checkIfFullStackToday(stacks, habits, completions);
	const xpGain = calculateXPGain(todayCompletions.length, newStreak, isFullStack);
	const newXp = profile.xp + xpGain.total;
	const newLevel = levelFromXp(newXp);

	const updated: Profile = {
		...profile,
		xp: newXp,
		level: newLevel,
		streak_days: newStreak,
		longest_streak: newLongest,
		total_completions: newTotal,
		updated_at: new Date().toISOString()
	};

	await db.saveProfile(updated);
	await sync.pushToSyncQueue('profiles', 'update', updated as unknown as Record<string, unknown>);
	return updated;
}

export async function updateProfileOnUncomplete(profile: Profile): Promise<Profile> {
	const newXp = Math.max(0, profile.xp - 10);
	const newLevel = levelFromXp(newXp);

	const updated: Profile = {
		...profile,
		xp: newXp,
		level: newLevel,
		total_completions: Math.max(0, profile.total_completions - 1),
		updated_at: new Date().toISOString()
	};

	await db.saveProfile(updated);
	await sync.pushToSyncQueue('profiles', 'update', updated as unknown as Record<string, unknown>);
	return updated;
}

export async function checkAndUnlockAchievements(
	profile: Profile,
	achievements: Achievement[],
	stacks: Stack[],
	userId: string,
	fullStackToday: boolean
): Promise<{ newAchievements: Achievement[]; badgeKeys: string[] }> {
	const results = checkAllAchievements(
		profile.longest_streak,
		profile.total_completions,
		profile.level,
		stacks.length,
		fullStackToday
	);

	const newAchievements: Achievement[] = [];
	const badgeKeys: string[] = [];

	for (const result of results) {
		if (result.shouldUnlock) {
			const existing = achievements.find(a => a.badge_key === result.badgeKey);
			if (!existing) {
				const achievement: Achievement = {
					id: generateId(),
					user_id: userId,
					badge_key: result.badgeKey,
					unlocked_at: new Date().toISOString()
				};
				await db.saveAchievement(achievement);
				await sync.pushToSyncQueue('achievements', 'insert', achievement as unknown as Record<string, unknown>);
				newAchievements.push(achievement);
				badgeKeys.push(result.badgeKey);
			}
		}
	}

	return { newAchievements, badgeKeys };
}