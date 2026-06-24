// IndexedDB service for offline-first data storage
// Uses idb library for clean async API

import { openDB, type IDBPDatabase } from 'idb';
import type { Stack, Habit, Completion, Achievement, Profile, SyncQueueItem } from '$lib/types';

const DB_NAME = 'stackflow';
const DB_VERSION = 2;

interface StackFlowDB {
	stacks: Stack;
	habits: Habit;
	completions: Completion;
	achievements: Achievement;
	profile: Profile;
	syncQueue: SyncQueueItem;
}

let dbInstance: IDBPDatabase<StackFlowDB> | null = null;

async function getDB(): Promise<IDBPDatabase<StackFlowDB>> {
	if (dbInstance) return dbInstance;

	dbInstance = await openDB<StackFlowDB>(DB_NAME, DB_VERSION, {
		upgrade(db, oldVersion) {
			if (oldVersion < 1) {
				// Stacks store
				const stackStore = db.createObjectStore('stacks', { keyPath: 'id' });
				stackStore.createIndex('user_id', 'user_id');
				stackStore.createIndex('sort_order', 'sort_order');

				// Habits store
				const habitStore = db.createObjectStore('habits', { keyPath: 'id' });
				habitStore.createIndex('stack_id', 'stack_id');
				habitStore.createIndex('user_id', 'user_id');

				// Completions store
				const completionStore = db.createObjectStore('completions', { keyPath: 'id' });
				completionStore.createIndex('habit_id', 'habit_id');
				completionStore.createIndex('completed_at', 'completed_at');
				completionStore.createIndex('user_id', 'user_id');
				completionStore.createIndex('habit_date', ['habit_id', 'completed_at'], { unique: true });

				// Profile store
				db.createObjectStore('profile', { keyPath: 'id' });

				// Sync queue
				const syncStore = db.createObjectStore('syncQueue', { keyPath: 'id' });
				syncStore.createIndex('table', 'table');
			}

			if (oldVersion < 2) {
				// Achievements store
				if (!db.objectStoreNames.contains('achievements')) {
					const achievementStore = db.createObjectStore('achievements', { keyPath: 'id' });
					achievementStore.createIndex('user_id', 'user_id');
					achievementStore.createIndex('badge_key', 'badge_key');
					achievementStore.createIndex('user_badge', ['user_id', 'badge_key'], { unique: true });
				}
			}
		}
	});

	return dbInstance;
}

// Reset DB instance (useful after logout)
export function resetDB(): void {
	dbInstance = null;
}

// ============ STACKS ============

export async function getAllStacks(userId: string): Promise<Stack[]> {
	const db = await getDB();
	const all = await db.getAllFromIndex('stacks', 'user_id', userId);
	return all.sort((a, b) => a.sort_order - b.sort_order);
}

export async function getStack(id: string): Promise<Stack | undefined> {
	const db = await getDB();
	return db.get('stacks', id);
}

export async function saveStack(stack: Stack): Promise<void> {
	const db = await getDB();
	await db.put('stacks', stack);
}

export async function deleteStack(id: string): Promise<void> {
	const db = await getDB();
	await db.delete('stacks', id);
	const habits = await getHabitsByStack(id);
	const tx = db.transaction('habits', 'readwrite');
	for (const habit of habits) {
		await tx.store.delete(habit.id);
	}
	await tx.done;
}

// ============ HABITS ============

export async function getHabitsByStack(stackId: string): Promise<Habit[]> {
	const db = await getDB();
	const all = await db.getAllFromIndex('habits', 'stack_id', stackId);
	return all.sort((a, b) => a.sort_order - b.sort_order);
}

export async function getHabit(id: string): Promise<Habit | undefined> {
	const db = await getDB();
	return db.get('habits', id);
}

export async function saveHabit(habit: Habit): Promise<void> {
	const db = await getDB();
	await db.put('habits', habit);
}

export async function getAllHabitsByUser(userId: string): Promise<Habit[]> {
	const db = await getDB();
	return db.getAllFromIndex('habits', 'user_id', userId);
}

export async function deleteHabit(id: string): Promise<void> {
	const db = await getDB();
	const completions = await getCompletionsByHabit(id);
	const tx = db.transaction(['habits', 'completions'], 'readwrite');
	await tx.objectStore('habits').delete(id);
	for (const c of completions) {
		await tx.objectStore('completions').delete(c.id);
	}
	await tx.done;
}

// ============ COMPLETIONS ============

export async function getCompletionsByHabit(habitId: string): Promise<Completion[]> {
	const db = await getDB();
	return db.getAllFromIndex('completions', 'habit_id', habitId);
}

export async function getCompletionsByDate(userId: string, date: string): Promise<Completion[]> {
	const db = await getDB();
	const all = await db.getAllFromIndex('completions', 'user_id', userId);
	return all.filter(c => c.completed_at === date);
}

export async function getCompletionsByUser(userId: string): Promise<Completion[]> {
	const db = await getDB();
	return db.getAllFromIndex('completions', 'user_id', userId);
}

export async function saveCompletion(completion: Completion): Promise<void> {
	const db = await getDB();
	await db.put('completions', completion);
}

export async function deleteCompletion(id: string): Promise<void> {
	const db = await getDB();
	await db.delete('completions', id);
}

export async function getCompletionForHabitDate(habitId: string, date: string): Promise<Completion | undefined> {
	const db = await getDB();
	const index = db.transaction('completions').store.index('habit_date');
	return index.get([habitId, date]);
}

// ============ PROFILE ============

export async function getProfile(userId: string): Promise<Profile | undefined> {
	const db = await getDB();
	return db.get('profile', userId);
}

export async function saveProfile(profile: Profile): Promise<void> {
	const db = await getDB();
	await db.put('profile', profile);
}

// ============ ACHIEVEMENTS ============

export async function getAchievementsByUser(userId: string): Promise<Achievement[]> {
	const db = await getDB();
	return db.getAllFromIndex('achievements', 'user_id', userId);
}

export async function saveAchievement(achievement: Achievement): Promise<void> {
	const db = await getDB();
	await db.put('achievements', achievement);
}

// ============ SYNC QUEUE ============

export async function addToSyncQueue(item: SyncQueueItem): Promise<void> {
	const db = await getDB();
	await db.put('syncQueue', item);
}

export async function getSyncQueue(): Promise<SyncQueueItem[]> {
	const db = await getDB();
	return db.getAll('syncQueue');
}

export async function removeFromSyncQueue(id: string): Promise<void> {
	const db = await getDB();
	await db.delete('syncQueue', id);
}

export async function clearSyncQueue(): Promise<void> {
	const db = await getDB();
	await db.clear('syncQueue');
}