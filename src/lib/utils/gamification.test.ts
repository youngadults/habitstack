import { describe, it, expect } from 'vitest';
import {
	xpForLevel,
	levelFromXp,
	xpProgressInLevel,
	calculateXPGain,
	checkLevelUp,
	calculateStreak,
	heatmapLevel
} from '$lib/utils/gamification';

describe('XP and Level calculations', () => {
	describe('xpForLevel', () => {
		it('returns 50 for level 1', () => {
			expect(xpForLevel(1)).toBe(50);
		});

		it('returns 150 for level 2', () => {
			expect(xpForLevel(2)).toBe(150);
		});

		it('returns 300 for level 3', () => {
			expect(xpForLevel(3)).toBe(300);
		});

		it('returns 750 for level 5', () => {
			expect(xpForLevel(5)).toBe(750);
		});

		it('returns 0 for level 0', () => {
			expect(xpForLevel(0)).toBe(0);
		});
	});

	describe('levelFromXp', () => {
		it('returns 0 for 0 XP', () => {
			expect(levelFromXp(0)).toBe(0);
		});

		it('returns 0 for 49 XP', () => {
			expect(levelFromXp(49)).toBe(0);
		});

		it('returns 1 for 50 XP', () => {
			expect(levelFromXp(50)).toBe(1);
		});

		it('returns 1 for 149 XP', () => {
			expect(levelFromXp(149)).toBe(1);
		});

		it('returns 2 for 150 XP', () => {
			expect(levelFromXp(150)).toBe(2);
		});

		it('returns 3 for 300 XP', () => {
			expect(levelFromXp(300)).toBe(3);
		});
	});

	describe('xpProgressInLevel', () => {
		it('shows 0% progress at start of level 1', () => {
			const progress = xpProgressInLevel(50);
			expect(progress.current).toBe(0);
			expect(progress.percent).toBe(0);
		});

		it('shows 50% progress at midpoint of level 1', () => {
			// Level 1 starts at 50 XP, level 2 at 150 XP, so midpoint is 100 XP
			const progress = xpProgressInLevel(100);
			expect(progress.current).toBe(50);
			expect(progress.percent).toBe(50);
		});

		it('shows 100% progress at level boundary', () => {
			// At 149 XP, you're 99/100 through level 1
			const progress = xpProgressInLevel(149);
			expect(progress.percent).toBe(99);
		});
	});
});

describe('XP Gain calculations', () => {
	it('calculates base XP for habits completed', () => {
		const gain = calculateXPGain(3, 0, false);
		expect(gain.base).toBe(30);
		expect(gain.streakBonus).toBe(0);
		expect(gain.stackBonus).toBe(0);
		expect(gain.total).toBe(30);
	});

	it('includes streak bonus', () => {
		const gain = calculateXPGain(1, 5, false);
		expect(gain.base).toBe(10);
		expect(gain.streakBonus).toBe(25); // 5 * 5
		expect(gain.total).toBe(35);
	});

	it('caps streak bonus at 50', () => {
		const gain = calculateXPGain(1, 20, false);
		expect(gain.streakBonus).toBe(50); // 20 * 5 = 100, capped at 50
	});

	it('includes stack completion bonus', () => {
		const gain = calculateXPGain(3, 0, true);
		expect(gain.base).toBe(30);
		expect(gain.stackBonus).toBe(25);
		expect(gain.total).toBe(55);
	});

	it('combines all bonuses', () => {
		const gain = calculateXPGain(5, 3, true);
		expect(gain.base).toBe(50);
		expect(gain.streakBonus).toBe(15); // 3 * 5
		expect(gain.stackBonus).toBe(25);
		expect(gain.total).toBe(90);
	});
});

describe('Level up detection', () => {
	it('detects level up from 0 to 1', () => {
		const result = checkLevelUp(0, 50);
		expect(result).not.toBeNull();
		expect(result!.newLevel).toBe(1);
		expect(result!.previousLevel).toBe(0);
	});

	it('returns null when no level up', () => {
		const result = checkLevelUp(50, 80);
		expect(result).toBeNull();
	});

	it('detects multi-level jump', () => {
		const result = checkLevelUp(0, 300);
		expect(result).not.toBeNull();
		expect(result!.newLevel).toBe(3);
	});
});

describe('Streak calculation', () => {
	it('returns 0 for empty dates', () => {
		expect(calculateStreak([])).toBe(0);
	});

	it('calculates streak from today', () => {
		const today = new Date().toISOString().slice(0, 10);
		expect(calculateStreak([today])).toBe(1);
	});

	it('calculates multi-day streak', () => {
		const today = new Date();
		const dates = [];
		for (let i = 0; i < 5; i++) {
			const d = new Date(today);
			d.setDate(d.getDate() - i);
			dates.push(d.toISOString().slice(0, 10));
		}
		expect(calculateStreak(dates)).toBe(5);
	});

	it('breaks streak with gap', () => {
		const today = new Date();
		const dates = [];
		// Days 0, 1, 2 (consecutive), then skip to day 5
		for (let i = 0; i < 3; i++) {
			const d = new Date(today);
			d.setDate(d.getDate() - i);
			dates.push(d.toISOString().slice(0, 10));
		}
		// Gap of 2 days
		const d = new Date(today);
		d.setDate(d.getDate() - 5);
		dates.push(d.toISOString().slice(0, 10));
		// Should still be 3 because the streak starts from most recent
		expect(calculateStreak(dates)).toBe(3);
	});

	it('streak is broken if most recent date is 2+ days ago', () => {
		const twoDaysAgo = new Date();
		twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
		expect(calculateStreak([twoDaysAgo.toISOString().slice(0, 10)])).toBe(0);
	});
});

describe('Heatmap level', () => {
	it('returns 0 for 0 count', () => {
		expect(heatmapLevel(0, 10)).toBe(0);
	});

	it('returns 1 for low count', () => {
		expect(heatmapLevel(1, 10)).toBe(1);
	});

	it('returns 4 for high count', () => {
		expect(heatmapLevel(10, 10)).toBe(4);
	});

	it('returns 2 for medium count', () => {
		expect(heatmapLevel(5, 10)).toBe(2);
	});

	it('handles max of 0', () => {
		expect(heatmapLevel(1, 0)).toBe(1);
	});
});