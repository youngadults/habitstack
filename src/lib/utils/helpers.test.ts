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
	colorBg,
	formatDate,
	formatDateLong,
	getWeekDays,
	getMonthDays,
	randomColor,
	randomIcon,
	STACK_COLORS,
	STACK_ICONS
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

		it('today - 7 days is a week ago', () => {
			const weekAgo = daysAgo(7);
			const diff = daysBetween(weekAgo, today());
			expect(diff).toBe(7);
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

		it('returns 0 for same date', () => {
			expect(daysBetween('2024-06-15', '2024-06-15')).toBe(0);
		});
	});

	describe('isToday', () => {
		it('returns true for today', () => {
			expect(isToday(today())).toBe(true);
		});

		it('returns false for yesterday', () => {
			expect(isToday(daysAgo(1))).toBe(false);
		});

		it('returns false for future date', () => {
			expect(isToday('2099-01-01')).toBe(false);
		});
	});

	describe('isYesterday', () => {
		it('returns true for yesterday', () => {
			expect(isYesterday(daysAgo(1))).toBe(true);
		});

		it('returns false for today', () => {
			expect(isYesterday(today())).toBe(false);
		});

		it('returns false for two days ago', () => {
			expect(isYesterday(daysAgo(2))).toBe(false);
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

		it('each date is one day apart', () => {
			const range = generateDateRange(14);
			for (let i = 1; i < range.length; i++) {
				expect(daysBetween(range[i - 1], range[i])).toBe(1);
			}
		});

		it('single day range returns just today', () => {
			const range = generateDateRange(1);
			expect(range).toHaveLength(1);
			expect(range[0]).toBe(today());
		});
	});

	describe('formatDate', () => {
		it('formats a date string', () => {
			const result = formatDate('2024-06-15');
			expect(result).toContain('Jun');
			expect(result).toContain('15');
		});

		it('handles January', () => {
			const result = formatDate('2024-01-01');
			expect(result).toContain('Jan');
		});
	});

	describe('formatDateLong', () => {
		it('formats with weekday and full month', () => {
			const result = formatDateLong('2024-06-15');
			expect(result).toContain('June');
			expect(result).toContain('15');
		});
	});

	describe('getWeekDays', () => {
		it('returns 7 day names', () => {
			const days = getWeekDays();
			expect(days).toHaveLength(7);
			expect(days[0]).toBe('Sun');
			expect(days[6]).toBe('Sat');
		});
	});

	describe('getMonthDays', () => {
		it('returns correct days for months', () => {
			expect(getMonthDays(2024, 0)).toBe(31);  // January
			expect(getMonthDays(2024, 1)).toBe(29);   // February (leap year)
			expect(getMonthDays(2023, 1)).toBe(28);   // February (non-leap)
			expect(getMonthDays(2024, 3)).toBe(30);   // April
			expect(getMonthDays(2024, 6)).toBe(31);    // July
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

describe('Color utilities', () => {
	describe('colorClasses', () => {
		it('returns correct classes for known colors', () => {
			expect(colorClasses('indigo')).toContain('bg-indigo-500/20');
			expect(colorClasses('indigo')).toContain('border-indigo-500/30');
			expect(colorClasses('indigo')).toContain('text-indigo-400');
			expect(colorClasses('emerald')).toContain('bg-emerald-500/20');
		});

		it('falls back to indigo for unknown colors', () => {
			expect(colorClasses('nonexistent')).toContain('bg-indigo-500/20');
		});

		it('falls back to indigo for empty string', () => {
			expect(colorClasses('')).toContain('bg-indigo-500/20');
		});

		it('returns all three class groups for every STACK_COLOR', () => {
			for (const color of STACK_COLORS) {
				const classes = colorClasses(color);
				expect(classes).toContain('bg-');
				expect(classes).toContain('border-');
				expect(classes).toContain('text-');
			}
		});
	});

	describe('completedBg', () => {
		it('returns correct class for known colors', () => {
			expect(completedBg('indigo')).toBe('bg-indigo-600');
			expect(completedBg('violet')).toBe('bg-violet-600');
			expect(completedBg('blue')).toBe('bg-blue-600');
		});

		it('falls back to indigo for unknown colors', () => {
			expect(completedBg('nonexistent')).toBe('bg-indigo-600');
		});

		it('returns bg-*-600 for every STACK_COLOR', () => {
			for (const color of STACK_COLORS) {
				expect(completedBg(color)).toContain('600');
			}
		});
	});

	describe('colorBg', () => {
		it('returns solid background class for known colors', () => {
			expect(colorBg('indigo')).toBe('bg-indigo-500');
			expect(colorBg('sky')).toBe('bg-sky-500');
		});

		it('falls back to indigo for unknown colors', () => {
			expect(colorBg('nonexistent')).toBe('bg-indigo-500');
		});

		it('returns bg-*-500 for every STACK_COLOR', () => {
			for (const color of STACK_COLORS) {
				expect(colorBg(color)).toContain('500');
			}
		});
	});
});

describe('Random generators', () => {
	describe('randomColor', () => {
		it('returns a valid stack color', () => {
			for (let i = 0; i < 50; i++) {
				const c = randomColor();
				expect(STACK_COLORS).toContain(c);
			}
		});
	});

	describe('randomIcon', () => {
		it('returns a valid stack icon', () => {
			for (let i = 0; i < 50; i++) {
				const icon = randomIcon();
				expect(STACK_ICONS).toContain(icon);
			}
		});
	});
});