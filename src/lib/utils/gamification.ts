// XP, leveling, and gamification math

import type { XPGain, LevelUp } from '$lib/types';

// XP rewards
const XP_PER_HABIT = 10;
const XP_STACK_BONUS = 25;
const XP_STREAK_BONUS_PER_DAY = 5;
const MAX_STREAK_BONUS = 50;

// Level thresholds: level N requires total XP of 25 * N * (N + 1)
// Level 1: 50, Level 2: 150, Level 3: 300, Level 5: 750, Level 10: 2750
export function xpForLevel(level: number): number {
	return 25 * level * (level + 1);
}

export function levelFromXp(xp: number): number {
	if (xp < 50) return 0;
	let level = 0;
	while (xpForLevel(level + 1) <= xp) {
		level++;
	}
	return level;
}

export function xpProgressInLevel(xp: number): { current: number; needed: number; percent: number } {
	const lvl = levelFromXp(xp);
	const currentLevelXp = xpForLevel(lvl);
	const nextLevelXp = xpForLevel(lvl + 1);
	const current = xp - currentLevelXp;
	const needed = nextLevelXp - currentLevelXp;
	return {
		current,
		needed,
		percent: Math.min(100, Math.round((current / needed) * 100))
	};
}

export function calculateXPGain(habitsCompleted: number, streakDays: number, stackComplete: boolean): XPGain {
	const base = habitsCompleted * XP_PER_HABIT;
	const streakBonus = Math.min(streakDays * XP_STREAK_BONUS_PER_DAY, MAX_STREAK_BONUS);
	const stackBonus = stackComplete ? XP_STACK_BONUS : 0;
	return {
		base,
		streakBonus,
		stackBonus,
		total: base + streakBonus + stackBonus
	};
}

export function checkLevelUp(oldXp: number, newXp: number): LevelUp | null {
	const oldLevel = levelFromXp(oldXp);
	const newLevel = levelFromXp(newXp);
	if (newLevel > oldLevel) {
		return {
			previousLevel: oldLevel,
			newLevel,
			xpGained: newXp - oldXp
		};
	}
	return null;
}

// Streak calculation
export function calculateStreak(completedDates: string[]): number {
	if (completedDates.length === 0) return 0;

	const today = new Date();
	today.setHours(0, 0, 0, 0);

	const sorted = [...new Set(completedDates)].sort().reverse();

	// Parse YYYY-MM-DD as local date (not UTC) to avoid timezone shifts
	const parseLocal = (dateStr: string): Date => {
		const [y, m, d] = dateStr.slice(0, 10).split('-').map(Number);
		return new Date(y, m - 1, d);
	};

	const mostRecent = parseLocal(sorted[0]);

	// If most recent is more than 1 day ago, streak is broken
	const diffDays = Math.floor((today.getTime() - mostRecent.getTime()) / (1000 * 60 * 60 * 24));
	if (diffDays > 1) return 0;

	let streak = 1;
	for (let i = 1; i < sorted.length; i++) {
		const curr = parseLocal(sorted[i]);
		const prev = parseLocal(sorted[i - 1]);

		const dayDiff = Math.floor((prev.getTime() - curr.getTime()) / (1000 * 60 * 60 * 24));
		if (dayDiff === 1) {
			streak++;
		} else {
			break;
		}
	}
	return streak;
}

// Heatmap data
export function completionHeatmapData(completions: { completed_at: string }[], days = 365): Map<string, number> {
	const data = new Map<string, number>();
	for (const c of completions) {
		const date = c.completed_at.slice(0, 10);
		data.set(date, (data.get(date) ?? 0) + 1);
	}
	return data;
}

export function heatmapLevel(count: number, max: number): 0 | 1 | 2 | 3 | 4 {
	if (count === 0) return 0;
	if (max === 0) return 1;
	const ratio = count / max;
	if (ratio <= 0.25) return 1;
	if (ratio <= 0.5) return 2;
	if (ratio <= 0.75) return 3;
	return 4;
}