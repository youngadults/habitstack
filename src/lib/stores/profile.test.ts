import { describe, it, expect } from 'vitest';
import { checkIfFullStackToday } from './profile';
import type { Stack, Habit, Completion } from '$lib/types';

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

		// s2 is fully complete, s1 is not (no completions)
		expect(checkIfFullStackToday([s1, s2], [h1, h2], [c2])).toBe(true);
	});

	it('ignores completions from other habits not in the stack', () => {
		const stack = makeStack('s1');
		const h1 = makeHabit('h1', 's1');
		const today = new Date().toISOString().slice(0, 10);
		// Completion for a different habit not in this stack
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

		// Both stacks fully complete
		expect(checkIfFullStackToday([s1, s2], [h1, h2], [c1, c2])).toBe(true);
	});
});