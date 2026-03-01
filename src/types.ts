// 习惯类型：基础/进阶 = 每日打卡（看完成率）；特殊 = 不固定日期，看周期内执行次数
export type HabitType = 'basic' | 'advanced' | 'special'

// 频率设定
export type FrequencyType = 'daily' | 'weekdays' | 'interval'
export interface HabitFrequency {
  type: FrequencyType
  weekdays?: number[]    // 0=Sun..6=Sat
  intervalDays?: number  // every N days
}

// 习惯项
export interface Habit {
  id: string
  name: string
  color: string
  icon?: string
  type: HabitType
  group?: string
  frequency?: HabitFrequency
  createdAt: string // ISO date
  archived?: boolean
  goalPerWeek?: number
  goalPerMonth?: number
}

// 打卡状态
export type CheckInStatus = 'done' | 'skip'

// 一次打卡记录
export interface CheckIn {
  habitId: string
  date: string
  status?: CheckInStatus
  note?: string
}

export type HabitsState = Habit[]
export type CheckInsState = CheckIn[]

export const STORAGE_HABITS = 'habit-tracker-habits'
export const STORAGE_CHECKINS = 'habit-tracker-checkins'
export const STORAGE_MEMOS = 'habit-tracker-memos'
export const STORAGE_DAILY_MOOD = 'habit-tracker-daily-mood'
export const STORAGE_XP = 'habit-tracker-xp'
export const STORAGE_BADGES = 'habit-tracker-badges'
export const STORAGE_REWARDS = 'habit-tracker-rewards'
export const STORAGE_FREEZES = 'habit-tracker-freezes'

/** 某天的备忘，key 为 YYYY-MM-DD */
export type MemosState = Record<string, string>

/** 某天的开心程度 1–5，key 为 YYYY-MM-DD */
export type DailyMoodState = Record<string, number>

export const MOOD_LABELS: Record<number, string> = {
  1: '很差', 2: '一般', 3: '还行', 4: '开心', 5: '很开心',
}

export const MOOD_EMOJIS: Record<number, string> = {
  1: '😔', 2: '😐', 3: '🙂', 4: '😊', 5: '🥳',
}

export const DEFAULT_COLORS = [
  '#0ea5e9', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4', '#84cc16'
]

export const HABIT_ICONS = [
  '🏃', '📖', '💪', '🧘', '💧', '🌙', '✍️', '🎯',
  '🍎', '🎵', '💻', '🌿', '🧠', '⏰', '🚶', '🎨',
]

export const HABIT_GROUPS = ['健康', '学习', '工作', '生活', '运动', '兴趣']

// XP & Level
export interface XPState { total: number }
export const XP_PER_BASIC = 10
export const XP_PER_ADVANCED = 20
export const XP_PER_SPECIAL = 5

export const LEVELS: { name: string; xp: number }[] = [
  { name: 'Rookie', xp: 0 },
  { name: 'Runner', xp: 100 },
  { name: 'Hacker', xp: 300 },
  { name: 'Netrunner', xp: 600 },
  { name: 'Operative', xp: 1000 },
  { name: 'Ghost', xp: 2000 },
  { name: 'Legend', xp: 5000 },
]

export function getLevelInfo(totalXp: number) {
  let lvl = LEVELS[0]
  let nextLvl = LEVELS[1] || LEVELS[0]
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (totalXp >= LEVELS[i].xp) {
      lvl = LEVELS[i]
      nextLvl = LEVELS[i + 1] || LEVELS[i]
      break
    }
  }
  const inLevel = totalXp - lvl.xp
  const needed = nextLvl.xp - lvl.xp
  return {
    level: LEVELS.indexOf(lvl) + 1,
    name: lvl.name,
    nextName: nextLvl.name,
    progress: needed > 0 ? Math.min(100, Math.round((inLevel / needed) * 100)) : 100,
    totalXp,
  }
}

// Badge definitions
export interface Badge {
  id: string; name: string; icon: string; desc: string
  check: (s: { totalCheckins: number; longestStreak: number; totalDays: number; habits: number }) => boolean
}

export const BADGE_DEFS: Badge[] = [
  { id: 'first', name: '启程', icon: '🌟', desc: '完成首次打卡', check: s => s.totalCheckins >= 1 },
  { id: 'streak7', name: '周冠', icon: '🔥', desc: '连续打卡7天', check: s => s.longestStreak >= 7 },
  { id: 'streak30', name: '月将', icon: '⚡', desc: '连续打卡30天', check: s => s.longestStreak >= 30 },
  { id: 'streak100', name: '百日传奇', icon: '💎', desc: '连续打卡100天', check: s => s.longestStreak >= 100 },
  { id: 'habits5', name: '多面手', icon: '🎯', desc: '同时追踪5个习惯', check: s => s.habits >= 5 },
  { id: 'checkin50', name: '半百', icon: '🏅', desc: '累计打卡50次', check: s => s.totalCheckins >= 50 },
  { id: 'checkin200', name: '铁杵', icon: '🏆', desc: '累计打卡200次', check: s => s.totalCheckins >= 200 },
  { id: 'days30', name: '老手', icon: '📆', desc: '使用超过30天', check: s => s.totalDays >= 30 },
]

// Reward system
export interface Reward { id: string; name: string; cost: number; redeemed: boolean }

// Streak freeze
export interface FreezeState { remaining: number; usedDates: string[] }

// Frequency helper: is a habit "due" on a given date?
export function isHabitDueOn(habit: Habit, dateStr: string): boolean {
  if (!habit.frequency || habit.frequency.type === 'daily') return true
  if (habit.frequency.type === 'weekdays') {
    const d = new Date(dateStr + 'T00:00:00')
    return (habit.frequency.weekdays ?? []).includes(d.getDay())
  }
  if (habit.frequency.type === 'interval') {
    const created = new Date(habit.createdAt)
    created.setHours(0, 0, 0, 0)
    const target = new Date(dateStr + 'T00:00:00')
    const diffDays = Math.round((target.getTime() - created.getTime()) / 86400000)
    return diffDays >= 0 && diffDays % (habit.frequency.intervalDays ?? 1) === 0
  }
  return true
}
