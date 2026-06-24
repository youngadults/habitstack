import { describe, it, expect } from 'vitest';
import { checkIfFullStackToday } from './profile';
import type { Stack, Habit, Completion } from '$lib/types';

describe('checkIfFullStackToday', () => {
	const today = new Date().toISOString().split('T')[0];

	it('returns false when stacks have no habits', () => {
		const stacks: Stack[] = [
			{ id: 's1', user_id: 'u1', name: 'Test', trigger: 'After coffee', color: 'indigo', icon: '☕', sort_order: 0, created_at: '', updated_at: '' }
		];
		expect(checkIfFullStackToday(stacks, [], [])).toBe(false);
	});

	it('returns false when habits are not all completed today', () => {
		const stacks: Stack[] = [
			{ id: 's1', user_id: 'u1', name: 'Test', trigger: 'After coffee', color: 'indigo', icon: '☕', sort_order: 0, created_at: '', updated_at: '' }
		];
		const habits: Habit[] = [
			{ id: 'h1', stack_id: 's1', user_id: 'u1', name: 'Brush teeth', sort_order: 0, created_at: '', updated_at: '' },
			{ id: 'h2', stack_id: 's1', user_id: 'u1', name: 'Meditate', sort_order: 1, created_at: '', updated_at: '' }
		];
		const completions: Completion[] = [
			{ id: 'c1', habit_id: 'h1', user_id: 'u1', completed_at: today, created_at: '' }
		];
		expect(checkIfFullStackToday(stacks, habits, completions)).toBe(false);
	});

	it('returns true when all habits in a stack are completed today', () => {
		const stacks: Stack[] = [
			{ id: 's1', user_id: 'u1', name: 'Test', trigger: 'After coffee', color: 'indigo', icon: '☕', sort_order: 0, created_at: '', updated_at: '' }
		];
		const habits: Habit[] = [
			{ id: 'h1', stack_id: 's1', user_id: 'u1', name: 'Brush teeth', sort_order: 0, created_at: '', updated_at: '' },
			{ id: 'h2', stack_id: 's1', user_id: 'u1', name: 'Meditate', sort_order: 1, created_at: '', updated_at: '' }
		];
		const completions: Completion[] = [
			{ id: 'c1', habit_id: 'h1', user_id: 'u1', completed_at: today, created_at: '' },
			{ id: 'c2', habit_id: 'h2', user_id: 'u1', completed_at: today, created_at: '' }
		];
		expect(checkIfFullStackToday(stacks, habits, completions)).toBe(true);
	});

	it('returns true when any stack is fully completed', () => {
		const stacks: Stack[] = [
			{ id: 's1', user_id: 'u1', name: 'Morning', trigger: 'Wake up', color: 'indigo', icon: '☀️', sort_order: 0, created_at: '', updated_at: '' },
			{ id: 's2', user_id: 'u1', name: 'Evening', trigger: 'After dinner', color: 'violet', icon: '🌙', sort_order: 1, created_at: '', updated_at: '' }
		];
		const habits: Habit[] = [
			{ id: 'h1', stack_id: 's1', user_id: 'u1', name: 'Brush', sort_order: 0, created_at: '', updated_at: '' },
			{ id: 'h2', stack_id: 's2', user_id: 'u1', name: 'Read', sort_order: 0, created_at: '', updated_at: '' },
			{ id: 'h3', stack_id: 's2', user_id: 'u1', name: 'Stretch', sort_order: 1, created_at: '', updated_at: '' }
		];
		// Only stack s2 is fully completed
		const completions: Completion[] = [
			{ id: 'c1', habit_id: 'h2', user_id: 'u1', completed_at: today, created_at: '' },
			{ id: 'c2', habit_id: 'h3', user_id: 'u1', completed_at: today, created_at: '' }
		];
		expect(checkIfFullStackToday(stacks, habits, completions)).toBe(true);
	});

	it('ignores completions from other days', () => {
		const stacks: Stack[] = [
			{ id: 's1', user_id: 'u1', name: 'Test', trigger: 'After coffee', color: 'indigo', icon: '☕', sort_order: 0, created_at: '', updated_at: '' }
		];
		const habits: Habit[] = [
			{ id: 'h1', stack_id: 's1', user_id: 'u1', name: 'Brush', sort_order: 0, created_at: '', updated_at: '' },
		];
		const completions: Completion[] = [
			{ id: 'c1', habit_id: 'h1', user_id: 'u1', completed_at: '2020-01-01', created_at: '' }
		];
		expect(checkIfFullStackToday(stacks, habits, completions)).toBe(false);
	});
});