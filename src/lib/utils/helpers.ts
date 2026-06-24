// Date and time utilities

export function today(): string {
	return new Date().toISOString().slice(0, 10);
}

export function formatDate(date: string): string {
	const d = new Date(date + 'T12:00:00');
	return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function formatDateLong(date: string): string {
	const d = new Date(date + 'T12:00:00');
	return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

export function daysAgo(n: number): string {
	const d = new Date();
	d.setDate(d.getDate() - n);
	return d.toISOString().slice(0, 10);
}

export function daysBetween(a: string, b: string): number {
	const da = new Date(a + 'T12:00:00');
	const db = new Date(b + 'T12:00:00');
	return Math.floor((db.getTime() - da.getTime()) / (1000 * 60 * 60 * 24));
}

export function isToday(date: string): boolean {
	return date === today();
}

export function isYesterday(date: string): boolean {
	return date === daysAgo(1);
}

export function getWeekDays(): string[] {
	const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
	return days;
}

export function getMonthDays(year: number, month: number): number {
	return new Date(year, month + 1, 0).getDate();
}

export function generateDateRange(days: number): string[] {
	const result: string[] = [];
	for (let i = days - 1; i >= 0; i--) {
		result.push(daysAgo(i));
	}
	return result;
}

// Color utilities
export const STACK_COLORS = [
	'indigo', 'violet', 'fuchsia', 'pink', 'rose',
	'red', 'orange', 'amber', 'yellow', 'lime',
	'green', 'emerald', 'teal', 'cyan', 'sky', 'blue'
] as const;

export type StackColor = typeof STACK_COLORS[number];

export const STACK_ICONS = [
	'☕', '🏃', '📚', '🧘', '💪', '🎯', '🌅', '🌙',
	'🚿', '🪥', '📧', '🍳', '🎵', '✍️', '🧹', '💤'
] as const;

export function randomColor(): StackColor {
	return STACK_COLORS[Math.floor(Math.random() * STACK_COLORS.length)];
}

export function randomIcon(): string {
	return STACK_ICONS[Math.floor(Math.random() * STACK_ICONS.length)];
}

// ID generation (for offline-first)
export function generateId(): string {
	return crypto.randomUUID();
}