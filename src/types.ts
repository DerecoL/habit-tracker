// 习惯类型：基础/进阶 = 每日打卡（看完成率）；特殊 = 不固定日期，看周期内执行次数
export type HabitType = 'basic' | 'advanced' | 'special'

// 习惯项
export interface Habit {
  id: string
  name: string
  color: string
  type: HabitType
  createdAt: string // ISO date
  archived?: boolean
  goalPerWeek?: number
  goalPerMonth?: number
}

// 一次打卡记录。基础/进阶：每天至多一条表示“当天完成”；特殊：可多条表示“当天执行次数”
export interface CheckIn {
  habitId: string
  date: string
}

export type HabitsState = Habit[]
export type CheckInsState = CheckIn[]

export const STORAGE_HABITS = 'habit-tracker-habits'
export const STORAGE_CHECKINS = 'habit-tracker-checkins'
export const STORAGE_MEMOS = 'habit-tracker-memos'
export const STORAGE_DAILY_MOOD = 'habit-tracker-daily-mood'

/** 某天的备忘，key 为 YYYY-MM-DD */
export type MemosState = Record<string, string>

/** 某天的开心程度 1–5，key 为 YYYY-MM-DD */
export type DailyMoodState = Record<string, number>

export const MOOD_LABELS: Record<number, string> = {
  1: '很差',
  2: '一般',
  3: '还行',
  4: '开心',
  5: '很开心',
}

export const DEFAULT_COLORS = [
  '#0ea5e9', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4', '#84cc16'
]
