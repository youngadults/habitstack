import { describe, it, expect } from 'vitest';
import {
	xpForLevel,
	levelFromXp,
	xpProgressInLevel,
	calculateXPGain,
	checkLevelUp,
	calculateStreak,
	completionHeatmapData,
	heatmapLevel
} from '$lib/utils/gamification';
import { today, daysAgo } from '$lib/utils/helpers';

describe('XP & Leveling', () => {
	describe('xpForLevel', () => {
		it('returns 0 for level 0', () => {
			expect(xpForLevel(0)).toBe(0);
		});

		it('returns correct XP for known levels', () => {
			// Formula: 25 * N * (N + 1)
			expect(xpForLevel(1)).toBe(50);    // 25 * 1 * 2
			expect(xpForLevel(2)).toBe(150);   // 25 * 2 * 3
			expect(xpForLevel(3)).toBe(300);   // 25 * 3 * 4
			expect(xpForLevel(5)).toBe(750);   // 25 * 5 * 6
			expect(xpForLevel(10)).toBe(2750); // 25 * 10 * 11
			expect(xpForLevel(25)).toBe(16250); // 25 * 25 * 26
		});
	});

	describe('levelFromXp', () => {
		it('returns 0 for XP below 50', () => {
			expect(levelFromXp(0)).toBe(0);
			expect(levelFromXp(25)).toBe(0);
			expect(levelFromXp(49)).toBe(0);
		});

		it('returns 1 for 50 XP', () => {
			expect(levelFromXp(50)).toBe(1);
		});

		it('returns correct levels at thresholds', () => {
			expect(levelFromXp(150)).toBe(2);   // exactly level 2
			expect(levelFromXp(300)).toBe(3);   // exactly level 3
			expect(levelFromXp(750)).toBe(5);   // exactly level 5
		});

		it('returns correct levels between thresholds', () => {
			expect(levelFromXp(100)).toBe(1);   // between level 1 (50) and level 2 (150)
			expect(levelFromXp(200)).toBe(2);   // between level 2 (150) and level 3 (300)
			expect(levelFromXp(500)).toBe(4);   // exactly at level 4 threshold (25*4*5=500)
		});

		it('handles large XP values', () => {
			expect(levelFromXp(2750)).toBe(10);
			expect(levelFromXp(10000)).toBe(19); // verified: levelFromXp(10000) should be 19 (xpForLevel(19)=9500, xpForLevel(20)=10500)
		});
	});

	describe('xpProgressInLevel', () => {
		it('returns progress at level 0 start', () => {
			const progress = xpProgressInLevel(25);
			expect(progress.current).toBe(25);
			expect(progress.needed).toBe(50); // level 0 -> 1 needs 50 XP
			expect(progress.percent).toBe(50);
		});

		it('returns 0% at exact level threshold', () => {
			const progress = xpProgressInLevel(50);
			expect(progress.current).toBe(0);
			expect(progress.percent).toBe(0);
		});

		it('calculates progress correctly mid-level', () => {
			const progress = xpProgressInLevel(100);
			// Level 1 (50 XP), need 100 more for level 2 (150 total)
			expect(progress.current).toBe(50);
			expect(progress.needed).toBe(100);
			expect(progress.percent).toBe(50);
		});

		it('caps percent at 100', () => {
			// Even at high XP, percent should max at 100
			const progress = xpProgressInLevel(99999);
			expect(progress.percent).toBeLessThanOrEqual(100);
		});
	});
});

describe('calculateXPGain', () => {
	it('calculates base XP only', () => {
		const result = calculateXPGain(1, 0, false);
		expect(result.base).toBe(10);
		expect(result.streakBonus).toBe(0);
		expect(result.stackBonus).toBe(0);
		expect(result.total).toBe(10);
	});

	it('adds streak bonus', () => {
		const result = calculateXPGain(1, 5, false);
		expect(result.base).toBe(10);
		expect(result.streakBonus).toBe(25); // 5 days * 5 XP/day
		expect(result.total).toBe(35);
	});

	it('caps streak bonus at MAX_STREAK_BONUS (50)', () => {
		const result = calculateXPGain(1, 20, false);
		expect(result.streakBonus).toBe(50); // capped
	});

	it('adds stack completion bonus', () => {
		const result = calculateXPGain(1, 0, true);
		expect(result.stackBonus).toBe(25);
		expect(result.total).toBe(35); // 10 base + 25 stack
	});

	it('combines all bonuses', () => {
		const result = calculateXPGain(3, 4, true);
		expect(result.base).toBe(30);        // 3 * 10
		expect(result.streakBonus).toBe(20);  // 4 * 5
		expect(result.stackBonus).toBe(25);
		expect(result.total).toBe(75);
	});

	it('handles zero habits completed', () => {
		const result = calculateXPGain(0, 0, false);
		expect(result.total).toBe(0);
	});
});

describe('checkLevelUp', () => {
	it('returns null when no level up', () => {
		expect(checkLevelUp(25, 45)).toBeNull();
	});

	it('detects a level up', () => {
		const result = checkLevelUp(45, 55);
		expect(result).not.toBeNull();
		expect(result!.previousLevel).toBe(0);
		expect(result!.newLevel).toBe(1);
	});

	it('detects multi-level up', () => {
		const result = checkLevelUp(40, 310);
		expect(result).not.toBeNull();
		expect(result!.previousLevel).toBe(0);
		expect(result!.newLevel).toBe(3);
	});

	it('returns null when XP decreases', () => {
		expect(checkLevelUp(200, 100)).toBeNull();
	});
});

describe('calculateStreak', () => {
	it('returns 0 for empty array', () => {
		expect(calculateStreak([])).toBe(0);
	});

	it('returns 1 for just today', () => {
		const today = new Date().toISOString().slice(0, 10);
		expect(calculateStreak([today])).toBe(1);
	});

	it('calculates consecutive days', () => {
		const today = new Date();
		const dates = [];
		for (let i = 0; i < 5; i++) {
			const d = new Date(today);
			d.setDate(d.getDate() - i);
			dates.push(d.toISOString().slice(0, 10));
		}
		expect(calculateStreak(dates)).toBe(5);
	});

	it('returns 0 if most recent is more than 1 day ago', () => {
		const twoDaysAgo = new Date();
		twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
		const dates = [twoDaysAgo.toISOString().slice(0, 10)];
		expect(calculateStreak(dates)).toBe(0);
	});

	it('counts streak starting from yesterday as valid', () => {
		// Use the app's own helpers so date strings match calculateStreak's internal today()
		const yesterday = daysAgo(1);
		expect(calculateStreak([yesterday])).toBe(1);
	});

	it('handles duplicate dates', () => {
		const today = new Date().toISOString().slice(0, 10);
		expect(calculateStreak([today, today, today])).toBe(1);
	});

	it('stops counting at gap in dates', () => {
		const today = new Date();
		const dates = [];
		// 3 consecutive days, then a gap
		for (let i = 0; i < 3; i++) {
			const d = new Date(today);
			d.setDate(d.getDate() - i);
			dates.push(d.toISOString().slice(0, 10));
		}
		// Add a date 5 days ago (gap)
		const fiveAgo = new Date(today);
		fiveAgo.setDate(fiveAgo.getDate() - 5);
		dates.push(fiveAgo.toISOString().slice(0, 10));

		expect(calculateStreak(dates)).toBe(3);
	});

	it('handles unsorted input dates', () => {
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		const d0 = today.toISOString().slice(0, 10);
		const d1 = new Date(today);
		d1.setDate(d1.getDate() - 1);
		const d1s = d1.toISOString().slice(0, 10);
		const d2 = new Date(today);
		d2.setDate(d2.getDate() - 2);
		const d2s = d2.toISOString().slice(0, 10);

		// Pass in reverse order
		expect(calculateStreak([d2s, d0, d1s])).toBe(3);
	});
});

describe('completionHeatmapData', () => {
	it('returns empty map for no completions', () => {
		const result = completionHeatmapData([]);
		expect(result.size).toBe(0);
	});

	it('counts completions per date', () => {
		const result = completionHeatmapData([
			{ completed_at: '2024-06-15' },
			{ completed_at: '2024-06-15' },
			{ completed_at: '2024-06-16' },
		]);
		expect(result.get('2024-06-15')).toBe(2);
		expect(result.get('2024-06-16')).toBe(1);
	});

	it('handles dates with time components', () => {
		const result = completionHeatmapData([
			{ completed_at: '2024-06-15T10:30:00' },
			{ completed_at: '2024-06-15T14:00:00' },
		]);
		expect(result.get('2024-06-15')).toBe(2);
	});
});

describe('heatmapLevel', () => {
	it('returns 0 for no completions', () => {
		expect(heatmapLevel(0, 10)).toBe(0);
	});

	it('returns 1 for low activity', () => {
		expect(heatmapLevel(1, 10)).toBe(1);
		expect(heatmapLevel(2, 10)).toBe(1);
	});

	it('returns higher levels for higher activity', () => {
		expect(heatmapLevel(3, 10)).toBe(2);  // 3/10 = 0.3 → 2
		expect(heatmapLevel(5, 10)).toBe(2);   // 5/10 = 0.5 → 2 (≤0.5 → 2)
		expect(heatmapLevel(6, 10)).toBe(3);   // 6/10 = 0.6 → 3
		expect(heatmapLevel(8, 10)).toBe(4);   // 8/10 = 0.8 → 4
		expect(heatmapLevel(10, 10)).toBe(4);  // 10/10 = 1.0 → 4
	});

	it('returns 1 when max is 0 but count > 0', () => {
		expect(heatmapLevel(1, 0)).toBe(1);
	});

	it('returns correct levels at exact boundaries', () => {
		expect(heatmapLevel(1, 4)).toBe(1);   // 1/4 = 0.25 → 1
		expect(heatmapLevel(2, 4)).toBe(2);   // 2/4 = 0.5 → 2
		expect(heatmapLevel(3, 4)).toBe(3);   // 3/4 = 0.75 → 3
		expect(heatmapLevel(4, 4)).toBe(4);   // 4/4 = 1.0 → 4
	});
});