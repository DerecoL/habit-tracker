import type { HabitsState, CheckInsState, MemosState, DailyMoodState } from './types'
import { STORAGE_HABITS, STORAGE_CHECKINS, STORAGE_MEMOS, STORAGE_DAILY_MOOD } from './types'
import { syncToIDB, migrateToIDB } from './db'

function loadJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (raw) return JSON.parse(raw) as T
  } catch (_) {}
  return fallback
}

function saveJson(key: string, value: unknown): void {
  localStorage.setItem(key, JSON.stringify(value))
  syncToIDB(key, value)
}

migrateToIDB([STORAGE_HABITS, STORAGE_CHECKINS, STORAGE_MEMOS, STORAGE_DAILY_MOOD])

export function loadHabits(): HabitsState {
  return loadJson<HabitsState>(STORAGE_HABITS, [])
}

export function saveHabits(habits: HabitsState): void {
  saveJson(STORAGE_HABITS, habits)
}

export function loadCheckIns(): CheckInsState {
  return loadJson<CheckInsState>(STORAGE_CHECKINS, [])
}

export function saveCheckIns(checkIns: CheckInsState): void {
  saveJson(STORAGE_CHECKINS, checkIns)
}

export function loadMemos(): MemosState {
  return loadJson<MemosState>(STORAGE_MEMOS, {})
}

export function saveMemos(memos: MemosState): void {
  saveJson(STORAGE_MEMOS, memos)
}

export function loadDailyMood(): DailyMoodState {
  return loadJson<DailyMoodState>(STORAGE_DAILY_MOOD, {})
}

export function saveDailyMood(mood: DailyMoodState): void {
  saveJson(STORAGE_DAILY_MOOD, mood)
}
