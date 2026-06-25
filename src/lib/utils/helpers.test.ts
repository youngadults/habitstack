import { describe, it, expect } from 'vitest';
import {
	today,
	daysAgo,
	daysBetween,
	isToday,
	isYesterday,
	generateDateRange,
	generateId,
	colorClasses,
	completedBg,
	colorBg
} from '$lib/utils/helpers';

describe('Date utilities', () => {
	describe('today', () => {
		it('returns a date string in YYYY-MM-DD format', () => {
			const result = today();
			expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
		});
	});

	describe('daysAgo', () => {
		it('returns a date string for N days ago', () => {
			const result = daysAgo(1);
			expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
		});

		it('today - 0 days is today', () => {
			expect(daysAgo(0)).toBe(today());
		});
	});

	describe('daysBetween', () => {
		it('calculates days between two dates', () => {
			expect(daysBetween('2024-01-01', '2024-01-02')).toBe(1);
			expect(daysBetween('2024-01-01', '2024-01-10')).toBe(9);
		});

		it('returns negative for reversed dates', () => {
			expect(daysBetween('2024-01-10', '2024-01-01')).toBe(-9);
		});
	});

	describe('isToday', () => {
		it('returns true for today', () => {
			expect(isToday(today())).toBe(true);
		});

		it('returns false for yesterday', () => {
			expect(isToday(daysAgo(1))).toBe(false);
		});
	});

	describe('isYesterday', () => {
		it('returns true for yesterday', () => {
			expect(isYesterday(daysAgo(1))).toBe(true);
		});

		it('returns false for today', () => {
			expect(isYesterday(today())).toBe(false);
		});
	});

	describe('generateDateRange', () => {
		it('generates correct number of dates', () => {
			const range = generateDateRange(7);
			expect(range.length).toBe(7);
		});

		it('includes today as last date', () => {
			const range = generateDateRange(7);
			expect(range[range.length - 1]).toBe(today());
		});

		it('dates are in ascending order', () => {
			const range = generateDateRange(7);
			for (let i = 1; i < range.length; i++) {
				expect(range[i] > range[i - 1]).toBe(true);
			}
		});
	});
});

describe('generateId', () => {
	it('generates a valid UUID', () => {
		const id = generateId();
		expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
	});

	it('generates unique IDs', () => {
		const ids = new Set(Array.from({ length: 100 }, () => generateId()));
		expect(ids.size).toBe(100);
	});
});

describe('color utilities', () => {
	it('colorClasses returns correct classes for known colors', () => {
		expect(colorClasses('indigo')).toContain('bg-indigo-500/20');
		expect(colorClasses('emerald')).toContain('bg-emerald-500/20');
	});

	it('colorClasses falls back to indigo for unknown colors', () => {
		expect(colorClasses('nonexistent')).toContain('bg-indigo-500/20');
	});

	it('completedBg returns correct class for known colors', () => {
		expect(completedBg('indigo')).toBe('bg-indigo-600');
		expect(completedBg('violet')).toBe('bg-violet-600');
	});

	it('completedBg falls back to indigo for unknown colors', () => {
		expect(completedBg('nonexistent')).toBe('bg-indigo-600');
	});

	it('colorBg returns solid background class for known colors', () => {
		expect(colorBg('indigo')).toBe('bg-indigo-500');
		expect(colorBg('sky')).toBe('bg-sky-500');
	});

	it('colorBg falls back to indigo for unknown colors', () => {
		expect(colorBg('nonexistent')).toBe('bg-indigo-500');
	});
});