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

// Color utility maps for stack UI
const COLOR_CLASSES: Record<string, string> = {
	indigo: 'bg-indigo-500/20 border-indigo-500/30 text-indigo-400',
	violet: 'bg-violet-500/20 border-violet-500/30 text-violet-400',
	fuchsia: 'bg-fuchsia-500/20 border-fuchsia-500/30 text-fuchsia-400',
	pink: 'bg-pink-500/20 border-pink-500/30 text-pink-400',
	rose: 'bg-rose-500/20 border-rose-500/30 text-rose-400',
	red: 'bg-red-500/20 border-red-500/30 text-red-400',
	orange: 'bg-orange-500/20 border-orange-500/30 text-orange-400',
	amber: 'bg-amber-500/20 border-amber-500/30 text-amber-400',
	yellow: 'bg-yellow-500/20 border-yellow-500/30 text-yellow-400',
	lime: 'bg-lime-500/20 border-lime-500/30 text-lime-400',
	green: 'bg-green-500/20 border-green-500/30 text-green-400',
	emerald: 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400',
	teal: 'bg-teal-500/20 border-teal-500/30 text-teal-400',
	cyan: 'bg-cyan-500/20 border-cyan-500/30 text-cyan-400',
	sky: 'bg-sky-500/20 border-sky-500/30 text-sky-400',
	blue: 'bg-blue-500/20 border-blue-500/30 text-blue-400',
};

const COMPLETED_BG: Record<string, string> = {
	indigo: 'bg-indigo-600', violet: 'bg-violet-600', fuchsia: 'bg-fuchsia-600',
	pink: 'bg-pink-600', rose: 'bg-rose-600', red: 'bg-red-600',
	orange: 'bg-orange-600', amber: 'bg-amber-600', yellow: 'bg-yellow-600',
	lime: 'bg-lime-600', green: 'bg-green-600', emerald: 'bg-emerald-600',
	teal: 'bg-teal-600', cyan: 'bg-cyan-600', sky: 'bg-sky-600', blue: 'bg-blue-600',
};

export function colorClasses(color: string): string {
	return COLOR_CLASSES[color] ?? COLOR_CLASSES.indigo;
}

export function completedBg(color: string): string {
	return COMPLETED_BG[color] ?? COMPLETED_BG.indigo;
}

// Solid background colors for color picker buttons and dots
const COLOR_BG: Record<string, string> = {
	indigo: 'bg-indigo-500', violet: 'bg-violet-500', fuchsia: 'bg-fuchsia-500',
	pink: 'bg-pink-500', rose: 'bg-rose-500', red: 'bg-red-500',
	orange: 'bg-orange-500', amber: 'bg-amber-500', yellow: 'bg-yellow-500',
	lime: 'bg-lime-500', green: 'bg-green-500', emerald: 'bg-emerald-500',
	teal: 'bg-teal-500', cyan: 'bg-cyan-500', sky: 'bg-sky-500', blue: 'bg-blue-500',
};

export function colorBg(color: string): string {
	return COLOR_BG[color] ?? COLOR_BG.indigo;
}

// ID generation (for offline-first)
export function generateId(): string {
	return crypto.randomUUID();
}