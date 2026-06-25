import { describe, it, expect } from 'vitest';
import type { Stack, Habit, Completion, Profile, Achievement, XPGain, LevelUp, SyncQueueItem, BadgeDefinition, StackChecklist, HeatmapData } from '$lib/types';

describe('Type interfaces', () => {
	it('Stack type accepts valid data', () => {
		const stack: Stack = {
			id: '123',
			user_id: 'user1',
			name: 'Morning Routine',
			trigger: 'After I wake up',
			color: 'indigo',
			icon: '☕',
			sort_order: 0,
			created_at: '2024-01-01T00:00:00Z',
			updated_at: '2024-01-01T00:00:00Z'
		};
		expect(stack.id).toBe('123');
		expect(stack.name).toBe('Morning Routine');
	});

	it('Habit type accepts valid data', () => {
		const habit: Habit = {
			id: 'h1',
			stack_id: 's1',
			user_id: 'user1',
			name: 'Drink water',
			sort_order: 0,
			created_at: '2024-01-01T00:00:00Z',
			updated_at: '2024-01-01T00:00:00Z'
		};
		expect(habit.id).toBe('h1');
	});

	it('Habit type allows optional description', () => {
		const habit: Habit = {
			id: 'h1',
			stack_id: 's1',
			user_id: 'user1',
			name: 'Drink water',
			description: '8 glasses a day',
			sort_order: 0,
			created_at: '2024-01-01T00:00:00Z',
			updated_at: '2024-01-01T00:00:00Z'
		};
		expect(habit.description).toBe('8 glasses a day');
	});

	it('Completion type accepts valid data', () => {
		const completion: Completion = {
			id: 'c1',
			habit_id: 'h1',
			user_id: 'user1',
			completed_at: '2024-06-15',
			created_at: '2024-06-15T10:00:00Z'
		};
		expect(completion.completed_at).toBe('2024-06-15');
	});

	it('Profile type accepts valid data', () => {
		const profile: Profile = {
			id: 'user1',
			xp: 150,
			level: 2,
			streak_days: 5,
			longest_streak: 10,
			total_completions: 42,
			theme: 'default',
			created_at: '2024-01-01T00:00:00Z',
			updated_at: '2024-01-01T00:00:00Z'
		};
		expect(profile.level).toBe(2);
	});

	it('Achievement type accepts valid data', () => {
		const achievement: Achievement = {
			id: 'a1',
			user_id: 'user1',
			badge_key: 'streak_3',
			unlocked_at: '2024-06-15T10:00:00Z'
		};
		expect(achievement.badge_key).toBe('streak_3');
	});

	it('XPGain type accepts valid data', () => {
		const xpGain: XPGain = {
			base: 10,
			streakBonus: 5,
			stackBonus: 25,
			total: 40
		};
		expect(xpGain.total).toBe(40);
	});

	it('LevelUp type accepts valid data', () => {
		const levelUp: LevelUp = {
			newLevel: 3,
			xpGained: 150,
			previousLevel: 2
		};
		expect(levelUp.newLevel).toBe(3);
	});

	it('SyncQueueItem type accepts valid data', () => {
		const item: SyncQueueItem = {
			id: 'sq1',
			table: 'stacks',
			action: 'insert',
			data: { name: 'Test' },
			created_at: '2024-01-01T00:00:00Z',
			retries: 0
		};
		expect(item.action).toBe('insert');
	});

	it('SyncQueueItem accepts all action types', () => {
		const actions: SyncQueueItem['action'][] = ['insert', 'update', 'delete'];
		expect(actions).toHaveLength(3);
	});

	it('BadgeDefinition type accepts valid data', () => {
		const badge: BadgeDefinition = {
			key: 'streak_3',
			name: 'Getting Started',
			description: '3-day streak',
			icon: '🔥',
			category: 'streak'
		};
		expect(badge.category).toBe('streak');
	});

	it('BadgeDefinition accepts all categories', () => {
		const categories: BadgeDefinition['category'][] = ['streak', 'completion', 'level', 'stack', 'special'];
		expect(categories).toHaveLength(5);
	});

	it('HeatmapData type accepts valid data', () => {
		const data: HeatmapData = {
			date: '2024-06-15',
			count: 3,
			level: 2
		};
		expect(data.level).toBe(2);
	});

	it('HeatmapData level is constrained to 0-4', () => {
		const levels: HeatmapData['level'][] = [0, 1, 2, 3, 4];
		expect(levels).toHaveLength(5);
	});
});