import { describe, it, expect } from 'vitest';
import {
	BADGES,
	getBadge,
	checkStreakBadges,
	checkCompletionBadges,
	checkLevelBadges,
	checkAllAchievements
} from '$lib/utils/badges';

describe('BADGES definitions', () => {
	it('has badges defined', () => {
		expect(BADGES.length).toBeGreaterThan(0);
	});

	it('all badges have required fields', () => {
		for (const badge of BADGES) {
			expect(badge.key).toBeTruthy();
			expect(badge.name).toBeTruthy();
			expect(badge.description).toBeTruthy();
			expect(badge.icon).toBeTruthy();
			expect(['streak', 'completion', 'level', 'stack', 'special']).toContain(badge.category);
		}
	});

	it('has unique keys', () => {
		const keys = BADGES.map(b => b.key);
		expect(new Set(keys).size).toBe(keys.length);
	});

	it('covers all categories', () => {
		const categories = new Set(BADGES.map(b => b.category));
		expect(categories.has('streak')).toBe(true);
		expect(categories.has('completion')).toBe(true);
		expect(categories.has('level')).toBe(true);
		expect(categories.has('stack')).toBe(true);
		expect(categories.has('special')).toBe(true);
	});
});

describe('getBadge', () => {
	it('returns badge by key', () => {
		const badge = getBadge('streak_3');
		expect(badge).toBeDefined();
		expect(badge!.key).toBe('streak_3');
		expect(badge!.name).toBe('Getting Started');
	});

	it('returns undefined for unknown key', () => {
		expect(getBadge('nonexistent')).toBeUndefined();
	});

	it('returns correct data for each category', () => {
		const streak = getBadge('streak_7');
		expect(streak!.category).toBe('streak');

		const completion = getBadge('complete_50');
		expect(completion!.category).toBe('completion');

		const level = getBadge('level_10');
		expect(level!.category).toBe('level');

		const stack = getBadge('first_stack');
		expect(stack!.category).toBe('stack');
	});
});

describe('checkStreakBadges', () => {
	it('unlocks nothing at streak 0', () => {
		const results = checkStreakBadges(0);
		expect(results.every(r => !r.shouldUnlock)).toBe(true);
	});

	it('unlocks streak_3 at streak 3', () => {
		const results = checkStreakBadges(3);
		const streak3 = results.find(r => r.badgeKey === 'streak_3');
		expect(streak3!.shouldUnlock).toBe(true);
	});

	it('unlocks multiple badges at higher streaks', () => {
		const results = checkStreakBadges(15);
		const unlocked = results.filter(r => r.shouldUnlock);
		expect(unlocked.length).toBe(3); // streak_3, streak_7, streak_14
	});

	it('unlocks all streak badges at streak 100', () => {
		const results = checkStreakBadges(100);
		expect(results.every(r => r.shouldUnlock)).toBe(true);
	});

	it('returns correct number of streak checks', () => {
		expect(checkStreakBadges(0)).toHaveLength(5);
	});
});

describe('checkCompletionBadges', () => {
	it('unlocks nothing at 0 completions', () => {
		const results = checkCompletionBadges(0);
		expect(results.every(r => !r.shouldUnlock)).toBe(true);
	});

	it('unlocks first_habit at 1 completion', () => {
		const results = checkCompletionBadges(1);
		const first = results.find(r => r.badgeKey === 'first_habit');
		expect(first!.shouldUnlock).toBe(true);
	});

	it('unlocks multiple badges at higher counts', () => {
		const results = checkCompletionBadges(55);
		const unlocked = results.filter(r => r.shouldUnlock);
		// 55 >= 1, 55 >= 10, 55 >= 50, but 55 < 100
		expect(unlocked.length).toBe(3);
		expect(unlocked.map(r => r.badgeKey)).toContain('first_habit');
		expect(unlocked.map(r => r.badgeKey)).toContain('complete_10');
		expect(unlocked.map(r => r.badgeKey)).toContain('complete_50');
	});

	it('unlocks all completion badges at 1000', () => {
		const results = checkCompletionBadges(1000);
		expect(results.every(r => r.shouldUnlock)).toBe(true);
	});

	it('returns correct number of completion checks', () => {
		expect(checkCompletionBadges(0)).toHaveLength(6);
	});
});

describe('checkLevelBadges', () => {
	it('unlocks nothing at level 0', () => {
		const results = checkLevelBadges(0);
		expect(results.every(r => !r.shouldUnlock)).toBe(true);
	});

	it('unlocks level_5 at level 5', () => {
		const results = checkLevelBadges(5);
		const level5 = results.find(r => r.badgeKey === 'level_5');
		expect(level5!.shouldUnlock).toBe(true);
	});

	it('unlocks all level badges at level 50', () => {
		const results = checkLevelBadges(50);
		expect(results.every(r => r.shouldUnlock)).toBe(true);
	});

	it('returns correct number of level checks', () => {
		expect(checkLevelBadges(0)).toHaveLength(4);
	});
});

describe('checkAllAchievements', () => {
	it('unlocks nothing for a brand new user', () => {
		const results = checkAllAchievements(0, 0, 0, 0, false);
		expect(results.every(r => !r.shouldUnlock)).toBe(true);
	});

	it('unlocks first_habit and first_stack with basic activity', () => {
		const results = checkAllAchievements(1, 1, 0, 1, false);
		const unlocked = results.filter(r => r.shouldUnlock);
		const keys = unlocked.map(r => r.badgeKey);
		expect(keys).toContain('first_habit');
		expect(keys).toContain('first_stack');
	});

	it('unlocks full_stack badge when a stack is completed', () => {
		const results = checkAllAchievements(0, 1, 0, 1, true);
		const fullStack = results.find(r => r.badgeKey === 'full_stack');
		expect(fullStack!.shouldUnlock).toBe(true);
	});

	it('unlocks streak badges when streak is high enough', () => {
		const results = checkAllAchievements(7, 10, 1, 1, false);
		const unlocked = results.filter(r => r.shouldUnlock);
		const keys = unlocked.map(r => r.badgeKey);
		expect(keys).toContain('streak_3');
		expect(keys).toContain('streak_7');
	});

	it('can unlock night_owl and early_bird', () => {
		const results = checkAllAchievements(0, 1, 0, 0, false, true, false);
		const nightOwl = results.find(r => r.badgeKey === 'night_owl');
		expect(nightOwl!.shouldUnlock).toBe(true);

		const results2 = checkAllAchievements(0, 1, 0, 0, false, false, true);
		const earlyBird = results2.find(r => r.badgeKey === 'early_bird');
		expect(earlyBird!.shouldUnlock).toBe(true);
	});

	it('returns all badge checks', () => {
		// streak(5) + completion(6) + level(4) + stack(3) + special(2) = 20
		const results = checkAllAchievements(0, 0, 0, 0, false);
		expect(results.length).toBe(20);
	});
});