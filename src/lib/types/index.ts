// Core data types for StackFlow

export interface Stack {
	id: string;
	user_id: string;
	name: string;
	trigger: string; // "after I make coffee"
	color: string; // tailwind color class or hex
	icon: string; // emoji
	sort_order: number;
	created_at: string;
	updated_at: string;
}

export interface Habit {
	id: string;
	stack_id: string;
	user_id: string;
	name: string;
	description?: string;
	sort_order: number;
	created_at: string;
	updated_at: string;
}

export interface Completion {
	id: string;
	habit_id: string;
	user_id: string;
	completed_at: string; // ISO date string YYYY-MM-DD
	created_at: string;
}

export interface Profile {
	id: string; // same as auth user id
	xp: number;
	level: number;
	streak_days: number;
	longest_streak: number;
	total_completions: number;
	theme: string;
	created_at: string;
	updated_at: string;
}

export interface Achievement {
	id: string;
	user_id: string;
	badge_key: string;
	unlocked_at: string;
}

export interface BadgeDefinition {
	key: string;
	name: string;
	description: string;
	icon: string;
	category: 'streak' | 'completion' | 'level' | 'stack' | 'special';
}

export interface StackWithHabits extends Stack {
	habits: Habit[];
}

export interface HabitWithCompletions extends Habit {
	completions: Completion[];
	streak: number;
}

export interface StackChecklist extends StackWithHabits {
	habits: HabitWithCompletions[];
	completedCount: number;
	totalCount: number;
	allComplete: boolean;
}

export interface HeatmapData {
	date: string;
	count: number;
	level: 0 | 1 | 2 | 3 | 4; // intensity level for color
}

// XP & Level types
export interface XPGain {
	base: number;
	streakBonus: number;
	stackBonus: number;
	total: number;
}

export interface LevelUp {
	newLevel: number;
	xpGained: number;
	previousLevel: number;
}

// Sync types
export interface SyncQueueItem {
	id: string;
	table: string;
	action: 'insert' | 'update' | 'delete';
	data: Record<string, unknown>;
	created_at: string;
	retries: number;
}