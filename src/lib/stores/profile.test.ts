import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
	checkIfFullStackToday,
	updateProfileOnComplete,
	updateProfileOnUncomplete,
	checkAndUnlockAchievements
} from './profile';
import type { Stack, Habit, Completion, Achievement, Profile } from '$lib/types';
import * as db from '$lib/services/db';
import * as sync from '$lib/services/sync';

// Mock db and sync modules
vi.mock('$lib/services/db', () => ({
	saveProfile: vi.fn(),
	saveAchievement: vi.fn(),
	addToSyncQueue: vi.fn(),
}));

vi.mock('$lib/services/sync', () => ({
	pushToSyncQueue: vi.fn(),
}));

// Helper factories
function makeStack(id: string): Stack {
	return {
		id, user_id: 'user1', name: `Stack ${id}`, trigger: 'after trigger',
		color: 'indigo', icon: '☕', sort_order: 0,
		created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z'
	};
}

function makeHabit(id: string, stackId: string): Habit {
	return {
		id, stack_id: stackId, user_id: 'user1', name: `Habit ${id}`,
		sort_order: 0, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z'
	};
}

function makeCompletion(habitId: string, date: string): Completion {
	return {
		id: `c-${habitId}-${date}`, habit_id: habitId, user_id: 'user1',
		completed_at: date, created_at: '2024-01-01T00:00:00Z'
	};
}

function makeProfile(overrides: Partial<Profile> = {}): Profile {
	return {
		id: 'user1', xp: 100, level: 2, streak_days: 3, longest_streak: 5,
		total_completions: 20, theme: 'default',
		created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z',
		...overrides
	};
}

describe('checkIfFullStackToday', () => {
	it('returns false when there are no stacks', () => {
		expect(checkIfFullStackToday([], [], [])).toBe(false);
	});

	it('returns false when a stack has no habits', () => {
		const stack = makeStack('s1');
		expect(checkIfFullStackToday([stack], [], [])).toBe(false);
	});

	it('returns false when habits exist but none completed today', () => {
		const stack = makeStack('s1');
		const habit = makeHabit('h1', 's1');
		const yesterday = new Date();
		yesterday.setDate(yesterday.getDate() - 1);
		const completion = makeCompletion('h1', yesterday.toISOString().slice(0, 10));

		expect(checkIfFullStackToday([stack], [habit], [completion])).toBe(false);
	});

	it('returns true when all habits in a stack are completed today', () => {
		const stack = makeStack('s1');
		const h1 = makeHabit('h1', 's1');
		const h2 = makeHabit('h2', 's1');
		const today = new Date().toISOString().slice(0, 10);
		const c1 = makeCompletion('h1', today);
		const c2 = makeCompletion('h2', today);

		expect(checkIfFullStackToday([stack], [h1, h2], [c1, c2])).toBe(true);
	});

	it('returns false when only some habits in a stack are completed today', () => {
		const stack = makeStack('s1');
		const h1 = makeHabit('h1', 's1');
		const h2 = makeHabit('h2', 's1');
		const today = new Date().toISOString().slice(0, 10);
		const c1 = makeCompletion('h1', today);

		expect(checkIfFullStackToday([stack], [h1, h2], [c1])).toBe(false);
	});

	it('returns true if any stack is fully complete, even if others are not', () => {
		const s1 = makeStack('s1');
		const s2 = makeStack('s2');
		const h1 = makeHabit('h1', 's1');
		const h2 = makeHabit('h2', 's2');
		const today = new Date().toISOString().slice(0, 10);
		const c2 = makeCompletion('h2', today);

		expect(checkIfFullStackToday([s1, s2], [h1, h2], [c2])).toBe(true);
	});

	it('ignores completions from other habits not in the stack', () => {
		const stack = makeStack('s1');
		const h1 = makeHabit('h1', 's1');
		const today = new Date().toISOString().slice(0, 10);
		const wrongCompletion = makeCompletion('h_other', today);

		expect(checkIfFullStackToday([stack], [h1], [wrongCompletion])).toBe(false);
	});

	it('handles multiple stacks correctly', () => {
		const s1 = makeStack('s1');
		const s2 = makeStack('s2');
		const h1 = makeHabit('h1', 's1');
		const h2 = makeHabit('h2', 's2');
		const today = new Date().toISOString().slice(0, 10);
		const c1 = makeCompletion('h1', today);
		const c2 = makeCompletion('h2', today);

		expect(checkIfFullStackToday([s1, s2], [h1, h2], [c1, c2])).toBe(true);
	});
});

describe('updateProfileOnComplete', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('increments total_completions', async () => {
		const profile = makeProfile({ total_completions: 10 });
		const result = await updateProfileOnComplete(profile, [], [], []);
		expect(result.total_completions).toBe(11);
	});

	it('adds XP for the completion', async () => {
		const profile = makeProfile({ xp: 100 });
		const today = new Date().toISOString().slice(0, 10);
		const completions = [makeCompletion('h1', today)];
		const result = await updateProfileOnComplete(profile, completions, [], []);
		expect(result.xp).toBeGreaterThan(100);
	});

	it('saves profile to db', async () => {
		const profile = makeProfile();
		await updateProfileOnComplete(profile, [], [], []);
		expect(db.saveProfile).toHaveBeenCalled();
	});

	it('pushes to sync queue', async () => {
		const profile = makeProfile();
		await updateProfileOnComplete(profile, [], [], []);
		expect(sync.pushToSyncQueue).toHaveBeenCalled();
	});

	it('updates longest_streak when current streak exceeds it', async () => {
		// Create completions for 3 consecutive days to form a streak of 3
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		const d0 = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString().slice(0, 10);
		const d1 = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1).toISOString().slice(0, 10);
		const d2 = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 2).toISOString().slice(0, 10);
		const completions = [
			makeCompletion('h1', d0),
			makeCompletion('h1', d1),
			makeCompletion('h1', d2),
		];
		const profile = makeProfile({ longest_streak: 2, streak_days: 3 });
		const result = await updateProfileOnComplete(profile, completions, [], []);
		expect(result.longest_streak).toBeGreaterThanOrEqual(3);
	});
});

describe('updateProfileOnUncomplete', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('decrements total_completions', async () => {
		const profile = makeProfile({ total_completions: 10 });
		const result = await updateProfileOnUncomplete(profile);
		expect(result.total_completions).toBe(9);
	});

	it('deducts 10 XP', async () => {
		const profile = makeProfile({ xp: 100 });
		const result = await updateProfileOnUncomplete(profile);
		expect(result.xp).toBe(90);
	});

	it('does not go below 0 XP', async () => {
		const profile = makeProfile({ xp: 5 });
		const result = await updateProfileOnUncomplete(profile);
		expect(result.xp).toBe(0);
	});

	it('does not go below 0 completions', async () => {
		const profile = makeProfile({ total_completions: 0 });
		const result = await updateProfileOnUncomplete(profile);
		expect(result.total_completions).toBe(0);
	});

	it('recalculates level from XP', async () => {
		const profile = makeProfile({ xp: 60, level: 1 }); // level 1 threshold is 50
		const result = await updateProfileOnUncomplete(profile);
		// 60 - 10 = 50, still level 1
		expect(result.xp).toBe(50);
		expect(result.level).toBe(1);
	});

	it('can derank if XP drops below threshold', async () => {
		const profile = makeProfile({ xp: 55, level: 1 });
		const result = await updateProfileOnUncomplete(profile);
		// 55 - 10 = 45, below level 1 threshold (50) → level 0
		expect(result.xp).toBe(45);
		expect(result.level).toBe(0);
	});

	it('saves profile to db', async () => {
		const profile = makeProfile();
		await updateProfileOnUncomplete(profile);
		expect(db.saveProfile).toHaveBeenCalled();
	});

	it('pushes to sync queue', async () => {
		const profile = makeProfile();
		await updateProfileOnUncomplete(profile);
		expect(sync.pushToSyncQueue).toHaveBeenCalled();
	});
});

describe('checkAndUnlockAchievements', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('returns empty for a new user with no activity', async () => {
		const profile = makeProfile({ streak_days: 0, total_completions: 0, level: 0, longest_streak: 0 });
		const result = await checkAndUnlockAchievements(profile, [], [], 'user1', false);
		expect(result.newAchievements).toHaveLength(0);
		expect(result.badgeKeys).toHaveLength(0);
	});

	it('unlocks first_habit and first_stack', async () => {
		const profile = makeProfile({ total_completions: 1, streak_days: 0, level: 0 });
		const stacks = [makeStack('s1')];
		const result = await checkAndUnlockAchievements(profile, [], stacks, 'user1', false);
		expect(result.badgeKeys).toContain('first_habit');
		expect(result.badgeKeys).toContain('first_stack');
	});

	it('does not re-unlock already earned badges', async () => {
		const profile = makeProfile({ total_completions: 1, streak_days: 0, level: 0 });
		const existingAchievement: Achievement = {
			id: 'a1', user_id: 'user1', badge_key: 'first_habit', unlocked_at: '2024-01-01T00:00:00Z'
		};
		const stacks = [makeStack('s1')];
		const result = await checkAndUnlockAchievements(profile, [existingAchievement], stacks, 'user1', false);
		expect(result.badgeKeys).not.toContain('first_habit');
		expect(result.badgeKeys).toContain('first_stack'); // still unlocks this one
	});

	it('unlocks streak badges', async () => {
		const profile = makeProfile({ total_completions: 10, streak_days: 7, level: 1, longest_streak: 7 });
		const result = await checkAndUnlockAchievements(profile, [], [], 'user1', false);
		expect(result.badgeKeys).toContain('streak_3');
		expect(result.badgeKeys).toContain('streak_7');
	});

	it('saves new achievements to db', async () => {
		const profile = makeProfile({ total_completions: 1, streak_days: 0, level: 0 });
		const stacks = [makeStack('s1')];
		await checkAndUnlockAchievements(profile, [], stacks, 'user1', false);
		expect(db.saveAchievement).toHaveBeenCalled();
	});

	it('pushes new achievements to sync queue', async () => {
		const profile = makeProfile({ total_completions: 1, streak_days: 0, level: 0 });
		const stacks = [makeStack('s1')];
		await checkAndUnlockAchievements(profile, [], stacks, 'user1', false);
		expect(sync.pushToSyncQueue).toHaveBeenCalled();
	});
});