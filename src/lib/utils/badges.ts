// Badge definitions and achievement checking

import type { BadgeDefinition } from '$lib/types';

export const BADGES: BadgeDefinition[] = [
	// Streak badges
	{ key: 'streak_3', name: 'Getting Started', description: '3-day streak on any habit', icon: '🔥', category: 'streak' },
	{ key: 'streak_7', name: 'On Fire', description: '7-day streak on any habit', icon: '🔥', category: 'streak' },
	{ key: 'streak_14', name: 'Unstoppable', description: '14-day streak on any habit', icon: '💪', category: 'streak' },
	{ key: 'streak_30', name: 'Habit Master', description: '30-day streak on any habit', icon: '⚡', category: 'streak' },
	{ key: 'streak_100', name: 'Legendary', description: '100-day streak on any habit', icon: '👑', category: 'streak' },

	// Completion badges
	{ key: 'first_habit', name: 'First Step', description: 'Log your first habit', icon: '👣', category: 'completion' },
	{ key: 'complete_10', name: 'Getting Going', description: 'Complete 10 habits total', icon: '🚶', category: 'completion' },
	{ key: 'complete_50', name: 'Building Momentum', description: 'Complete 50 habits total', icon: '🏃', category: 'completion' },
	{ key: 'complete_100', name: 'Century Club', description: 'Complete 100 habits total', icon: '💯', category: 'completion' },
	{ key: 'complete_500', name: 'Half K', description: 'Complete 500 habits total', icon: '🏅', category: 'completion' },
	{ key: 'complete_1000', name: 'Grand Master', description: 'Complete 1,000 habits total', icon: '🏆', category: 'completion' },

	// Stack badges
	{ key: 'first_stack', name: 'Stack Starter', description: 'Create your first stack', icon: '🏗️', category: 'stack' },
	{ key: 'full_stack', name: 'Full Stack', description: 'Complete all habits in a stack in one day', icon: '✅', category: 'stack' },
	{ key: 'stack_5', name: 'Architect', description: 'Create 5 stacks', icon: '🏛️', category: 'stack' },

	// Level badges
	{ key: 'level_5', name: 'Rising Star', description: 'Reach level 5', icon: '⭐', category: 'level' },
	{ key: 'level_10', name: 'Veteran', description: 'Reach level 10', icon: '🌟', category: 'level' },
	{ key: 'level_25', name: 'Elite', description: 'Reach level 25', icon: '💫', category: 'level' },
	{ key: 'level_50', name: 'Transcendent', description: 'Reach level 50', icon: '✨', category: 'level' },

	// Special
	{ key: 'night_owl', name: 'Night Owl', description: 'Complete a habit after midnight', icon: '🦉', category: 'special' },
	{ key: 'early_bird', name: 'Early Bird', description: 'Complete a habit before 6 AM', icon: '🐦', category: 'special' },
];

export function getBadge(key: string): BadgeDefinition | undefined {
	return BADGES.find(b => b.key === key);
}

export interface AchievementCheck {
	badgeKey: string;
	shouldUnlock: boolean;
}

export function checkStreakBadges(maxStreak: number): AchievementCheck[] {
	return [
		{ badgeKey: 'streak_3', shouldUnlock: maxStreak >= 3 },
		{ badgeKey: 'streak_7', shouldUnlock: maxStreak >= 7 },
		{ badgeKey: 'streak_14', shouldUnlock: maxStreak >= 14 },
		{ badgeKey: 'streak_30', shouldUnlock: maxStreak >= 30 },
		{ badgeKey: 'streak_100', shouldUnlock: maxStreak >= 100 },
	];
}

export function checkCompletionBadges(totalCompletions: number): AchievementCheck[] {
	return [
		{ badgeKey: 'first_habit', shouldUnlock: totalCompletions >= 1 },
		{ badgeKey: 'complete_10', shouldUnlock: totalCompletions >= 10 },
		{ badgeKey: 'complete_50', shouldUnlock: totalCompletions >= 50 },
		{ badgeKey: 'complete_100', shouldUnlock: totalCompletions >= 100 },
		{ badgeKey: 'complete_500', shouldUnlock: totalCompletions >= 500 },
		{ badgeKey: 'complete_1000', shouldUnlock: totalCompletions >= 1000 },
	];
}

export function checkLevelBadges(level: number): AchievementCheck[] {
	return [
		{ badgeKey: 'level_5', shouldUnlock: level >= 5 },
		{ badgeKey: 'level_10', shouldUnlock: level >= 10 },
		{ badgeKey: 'level_25', shouldUnlock: level >= 25 },
		{ badgeKey: 'level_50', shouldUnlock: level >= 50 },
	];
}

export function checkAllAchievements(
	maxStreak: number,
	totalCompletions: number,
	level: number,
	stackCount: number,
	hasFullStack: boolean,
	isNightOwl: boolean = false,
	isEarlyBird: boolean = false
): AchievementCheck[] {
	return [
		...checkStreakBadges(maxStreak),
		...checkCompletionBadges(totalCompletions),
		...checkLevelBadges(level),
		{ badgeKey: 'first_stack', shouldUnlock: stackCount >= 1 },
		{ badgeKey: 'stack_5', shouldUnlock: stackCount >= 5 },
		{ badgeKey: 'full_stack', shouldUnlock: hasFullStack },
		{ badgeKey: 'night_owl', shouldUnlock: isNightOwl },
		{ badgeKey: 'early_bird', shouldUnlock: isEarlyBird },
	];
}