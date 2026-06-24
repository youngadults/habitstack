import { describe, it, expect } from 'vitest';
import {
	checkStreakBadges,
	checkCompletionBadges,
	checkLevelBadges,
	checkAllAchievements,
	BADGES
} from '$lib/utils/badges';

describe('Badge definitions', () => {
	it('has all required badges', () => {
		expect(BADGES.length).toBeGreaterThan(0);
		expect(BADGES.some(b => b.category === 'streak')).toBe(true);
		expect(BADGES.some(b => b.category === 'completion')).toBe(true);
		expect(BADGES.some(b => b.category === 'level')).toBe(true);
		expect(BADGES.some(b => b.category === 'stack')).toBe(true);
	});

	it('all badges have unique keys', () => {
		const keys = BADGES.map(b => b.key);
		expect(new Set(keys).size).toBe(keys.length);
	});
});

describe('Streak badges', () => {
	it('unlocks streak_3 at 3 days', () => {
		const results = checkStreakBadges(3);
		const streak3 = results.find(r => r.badgeKey === 'streak_3');
		expect(streak3?.shouldUnlock).toBe(true);
	});

	it('does not unlock streak_7 at 3 days', () => {
		const results = checkStreakBadges(3);
		const streak7 = results.find(r => r.badgeKey === 'streak_7');
		expect(streak7?.shouldUnlock).toBe(false);
	});

	it('unlocks all streak badges at 100 days', () => {
		const results = checkStreakBadges(100);
		expect(results.every(r => r.shouldUnlock)).toBe(true);
	});
});

describe('Completion badges', () => {
	it('unlocks first_habit at 1 completion', () => {
		const results = checkCompletionBadges(1);
		const first = results.find(r => r.badgeKey === 'first_habit');
		expect(first?.shouldUnlock).toBe(true);
	});

	it('does not unlock complete_10 at 5 completions', () => {
		const results = checkCompletionBadges(5);
		const c10 = results.find(r => r.badgeKey === 'complete_10');
		expect(c10?.shouldUnlock).toBe(false);
	});
});

describe('Level badges', () => {
	it('unlocks level_5 at level 5', () => {
		const results = checkLevelBadges(5);
		const lvl5 = results.find(r => r.badgeKey === 'level_5');
		expect(lvl5?.shouldUnlock).toBe(true);
	});
});

describe('checkAllAchievements', () => {
	it('returns all badge checks', () => {
		const results = checkAllAchievements(0, 0, 0, 0, false);
		expect(results.length).toBe(BADGES.length);
	});

	it('unlocks nothing at zero progress', () => {
		const results = checkAllAchievements(0, 0, 0, 0, false);
		const unlocked = results.filter(r => r.shouldUnlock);
		expect(unlocked.length).toBe(0);
	});

	it('unlocks milestones at high progress', () => {
		const results = checkAllAchievements(30, 100, 10, 5, true);
		const unlocked = results.filter(r => r.shouldUnlock);
		expect(unlocked.length).toBeGreaterThan(0);
	});
});