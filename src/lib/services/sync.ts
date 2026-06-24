// Offline-first sync service
// Manages data flow between IndexedDB (local) and Supabase (remote)
// Falls back to local-only mode when Supabase is not configured

import { getSupabase } from './auth';
import * as db from './db';
import type { Stack, Habit, Completion, Achievement, Profile, SyncQueueItem } from '$lib/types';
import { generateId } from '$lib/utils/helpers';

const SUPABASE_URL = typeof window !== 'undefined'
	? (import.meta as any).env?.VITE_SUPABASE_URL ?? ''
	: '';
const hasSupabase = SUPABASE_URL && SUPABASE_URL !== '';

let isSyncing = false;

export async function pushToSyncQueue(
	table: string,
	action: SyncQueueItem['action'],
	data: Record<string, unknown>
): Promise<void> {
	if (!hasSupabase) return; // No-op in local mode

	const item: SyncQueueItem = {
		id: generateId(),
		table,
		action,
		data,
		created_at: new Date().toISOString(),
		retries: 0
	};
	await db.addToSyncQueue(item);
}

async function processSyncQueue(): Promise<void> {
	if (!hasSupabase || isSyncing) return;
	isSyncing = true;

	try {
		const queue = await db.getSyncQueue();
		if (queue.length === 0) return;

		const supabase = getSupabase();
		const sorted = queue.sort((a, b) => a.created_at.localeCompare(b.created_at));

		for (const item of sorted) {
			try {
				const { table, action, data } = item;

				if (action === 'insert' || action === 'update') {
					const { error } = await supabase
						.from(table)
						.upsert(data, { onConflict: 'id' });
					if (error) throw error;
				} else if (action === 'delete') {
					const { error } = await supabase
						.from(table)
						.delete()
						.eq('id', data.id);
					if (error) throw error;
				}

				await db.removeFromSyncQueue(item.id);
			} catch (err) {
				// Increment retry count
				const updated = { ...item, retries: item.retries + 1 };
				if (updated.retries >= 5) {
					// Drop items that fail 5 times
					await db.removeFromSyncQueue(item.id);
				}
				// Keep in queue for next sync attempt
			}
		}
	} finally {
		isSyncing = false;
	}
}

// Pull from Supabase to update local DB
export async function pullFromRemote(userId: string): Promise<void> {
	if (!hasSupabase) return;

	const supabase = getSupabase();

	// Pull stacks
	const { data: remoteStacks } = await supabase
		.from('stacks')
		.select('*')
		.eq('user_id', userId);

	if (remoteStacks) {
		for (const stack of remoteStacks as Stack[]) {
			await db.saveStack(stack);
		}
	}

	// Pull habits
	const { data: remoteHabits } = await supabase
		.from('habits')
		.select('*')
		.eq('user_id', userId);

	if (remoteHabits) {
		for (const habit of remoteHabits as Habit[]) {
			await db.saveHabit(habit);
		}
	}

	// Pull completions
	const { data: remoteCompletions } = await supabase
		.from('completions')
		.select('*')
		.eq('user_id', userId);

	if (remoteCompletions) {
		for (const completion of remoteCompletions as Completion[]) {
			await db.saveCompletion(completion);
		}
	}

	// Pull profile
	const { data: remoteProfile } = await supabase
		.from('profiles')
		.select('*')
		.eq('id', userId)
		.single();

	if (remoteProfile) {
		await db.saveProfile(remoteProfile as Profile);
	}

	// Pull achievements
	const { data: remoteAchievements } = await supabase
		.from('achievements')
		.select('*')
		.eq('user_id', userId);

	if (remoteAchievements) {
		for (const achievement of remoteAchievements as Achievement[]) {
			await db.saveAchievement(achievement);
		}
	}
}

// Full sync: push local changes, then pull remote
export async function fullSync(userId: string): Promise<void> {
	if (!hasSupabase || !navigator.onLine) return;

	try {
		await processSyncQueue();
		await pullFromRemote(userId);
	} catch (err) {
		console.error('Sync failed:', err);
	}
}

// Auto-sync when coming back online
export function setupAutoSync(userId: () => string | null): () => void {
	if (!hasSupabase) return () => {};

	const handleOnline = () => {
		const uid = userId();
		if (uid) fullSync(uid);
	};

	window.addEventListener('online', handleOnline);
	return () => window.removeEventListener('online', handleOnline);
}