import type { Habit, CheckIn } from './types'
import { dateStr, getWeekRange, getMonthRange, getYearRange, dateRange } from './dateUtils'

export type HabitType = import('./types').HabitType

/** 活跃习惯（未归档） */
export function activeHabits(habits: Habit[]): Habit[] {
  return habits.filter(h => !h.archived)
}

/** 每日打卡类习惯（基础+进阶，未归档） */
export function dailyHabits(habits: Habit[]): Habit[] {
  return habits.filter(h => !h.archived && (h.type === 'basic' || h.type === 'advanced'))
}

export function basicHabits(habits: Habit[]): Habit[] {
  return habits.filter(h => !h.archived && h.type === 'basic')
}

export function advancedHabits(habits: Habit[]): Habit[] {
  return habits.filter(h => !h.archived && h.type === 'advanced')
}

/** 特殊习惯（按次数统计，未归档） */
export function specialHabits(habits: Habit[]): Habit[] {
  return habits.filter(h => !h.archived && h.type === 'special')
}

/** 按习惯类型统计单日完成情况 */
export function getDayStatsByType(
  habits: Habit[],
  checkIns: CheckIn[],
  dayStr: string,
  type: import('./types').HabitType
): PeriodStats {
  const filtered = habits.filter(h => h.type === type)
  const total = filtered.length
  if (total === 0) return { total: 0, completed: 0, percent: 0 }
  const completed = filtered.filter(h =>
    checkIns.some(c => c.habitId === h.id && c.date === dayStr)
  ).length
  return { total, completed, percent: Math.round((completed / total) * 100) }
}

/** 按习惯类型统计周期内完成情况 */
export function getPeriodStatsByType(
  habits: Habit[],
  checkIns: CheckIn[],
  dates: string[],
  type: import('./types').HabitType
): PeriodStats {
  const filtered = habits.filter(h => h.type === type)
  const total = filtered.length * dates.length
  if (total === 0) return { total: 0, completed: 0, percent: 0 }
  let completed = 0
  for (const h of filtered) {
    completed += completedDatesForHabitInRange(h.id, checkIns, dates)
  }
  return { total, completed, percent: Math.round((completed / total) * 100) }
}

export interface PeriodStats {
  total: number
  completed: number
  percent: number
}

/**
 * 统计某段时间内，某习惯在哪些日期有打卡（每日类：每个日期至多算一天）
 */
function completedDatesForHabitInRange(
  habitId: string,
  checkIns: CheckIn[],
  dates: string[]
): number {
  const dateSet = new Set(dates)
  const seen = new Set<string>()
  for (const c of checkIns) {
    if (c.habitId === habitId && dateSet.has(c.date)) seen.add(c.date)
  }
  return seen.size
}

/**
 * 今日：仅统计每日类习惯，今天完成数/总数（完成 = 至少打卡一次）
 */
export function getDayStats(
  habits: Habit[],
  checkIns: CheckIn[],
  dayStr: string
): PeriodStats {
  const daily = dailyHabits(habits)
  const total = daily.length
  if (total === 0) return { total: 0, completed: 0, percent: 0 }
  const completed = daily.filter(h =>
    checkIns.some(c => c.habitId === h.id && c.date === dayStr)
  ).length
  return { total, completed, percent: Math.round((completed / total) * 100) }
}

/**
 * 全勤判定专用：仅统计基础习惯的单日完成情况
 */
export function getBasicDayStats(
  habits: Habit[],
  checkIns: CheckIn[],
  dayStr: string
): PeriodStats {
  const basics = basicHabits(habits)
  const total = basics.length
  if (total === 0) return { total: 0, completed: 0, percent: 0 }
  const completed = basics.filter(h =>
    checkIns.some(c => c.habitId === h.id && c.date === dayStr)
  ).length
  return { total, completed, percent: Math.round((completed / total) * 100) }
}

/**
 * 本周/本月/本年：仅统计每日类习惯，完成人天/总人天
 */
export function getWeekStats(
  habits: Habit[],
  checkIns: CheckIn[],
  refDate: Date
): PeriodStats {
  const daily = dailyHabits(habits)
  const { start, end } = getWeekRange(refDate)
  const dates = dateRange(start, end)
  const total = daily.length * dates.length
  if (total === 0) return { total: 0, completed: 0, percent: 0 }
  let completed = 0
  for (const h of daily) {
    completed += completedDatesForHabitInRange(h.id, checkIns, dates)
  }
  return { total, completed, percent: Math.round((completed / total) * 100) }
}

export function getMonthStats(
  habits: Habit[],
  checkIns: CheckIn[],
  refDate: Date
): PeriodStats {
  const daily = dailyHabits(habits)
  const { start, end } = getMonthRange(refDate)
  const dates = dateRange(start, end)
  const total = daily.length * dates.length
  if (total === 0) return { total: 0, completed: 0, percent: 0 }
  let completed = 0
  for (const h of daily) {
    completed += completedDatesForHabitInRange(h.id, checkIns, dates)
  }
  return { total, completed, percent: Math.round((completed / total) * 100) }
}

export function getYearStats(
  habits: Habit[],
  checkIns: CheckIn[],
  refDate: Date
): PeriodStats {
  const daily = dailyHabits(habits)
  const { start, end } = getYearRange(refDate)
  const dates = dateRange(start, end)
  const total = daily.length * dates.length
  if (total === 0) return { total: 0, completed: 0, percent: 0 }
  let completed = 0
  for (const h of daily) {
    completed += completedDatesForHabitInRange(h.id, checkIns, dates)
  }
  return { total, completed, percent: Math.round((completed / total) * 100) }
}

/** 特殊习惯在时间段内的执行次数 */
export function getSpecialCountInRange(
  habitId: string,
  checkIns: CheckIn[],
  dates: string[]
): number {
  const set = new Set(dates)
  return checkIns.filter(c => c.habitId === habitId && set.has(c.date)).length
}

export interface SpecialCountItem {
  habitId: string
  name: string
  color: string
  count: number
}

/** 特殊习惯在时间段内的执行次数（按习惯） */
export function getSpecialCountStats(
  habits: Habit[],
  checkIns: CheckIn[],
  dates: string[]
): { byHabit: SpecialCountItem[]; totalCount: number } {
  const special = specialHabits(habits)
  const byHabit = special.map(h => ({
    habitId: h.id,
    name: h.name,
    color: h.color,
    count: getSpecialCountInRange(h.id, checkIns, dates),
  }))
  const totalCount = byHabit.reduce((s, x) => s + x.count, 0)
  return { byHabit, totalCount }
}

/**
 * 趋势图：最近 N 天每日完成率（仅每日类习惯）
 */
export interface TrendPoint {
  date: string
  percent: number
  completed: number
  total: number
}

export function getTrendData(
  habits: Habit[],
  checkIns: CheckIn[],
  days: number = 30
): TrendPoint[] {
  const now = new Date()
  const start = new Date(now)
  start.setDate(start.getDate() - days + 1)
  start.setHours(0, 0, 0, 0)
  const dates = dateRange(start, now)
  return dates.map(date => {
    const s = getDayStats(habits, checkIns, date)
    return { date, percent: s.percent, completed: s.completed, total: s.total }
  })
}

/** 趋势图多系列：每条系列一个 dataKey，对应每日的完成率 0-100 */
export interface TrendSeriesItem {
  dataKey: string
  name: string
  color: string
}

export type TrendViewMode = 'overall' | 'byType' | 'byHabit'

/** 根据视图模式与选中习惯，返回要展示的系列配置 */
export function getTrendSeriesConfig(
  habits: Habit[],
  mode: TrendViewMode,
  selectedHabitIds: string[] = []
): TrendSeriesItem[] {
  const daily = dailyHabits(habits)
  if (mode === 'overall') {
    if (daily.length === 0) return []
    return [{ dataKey: 'overall', name: '整体完成率', color: '#38bdf8' }]
  }
  if (mode === 'byType') {
    const basic = habits.filter(h => h.type === 'basic')
    const advanced = habits.filter(h => h.type === 'advanced')
    const items: TrendSeriesItem[] = []
    if (basic.length > 0) items.push({ dataKey: 'basic', name: '基础习惯', color: '#10b981' })
    if (advanced.length > 0) items.push({ dataKey: 'advanced', name: '进阶习惯', color: '#8b5cf6' })
    return items
  }
  // byHabit: 选中的每日类习惯，用习惯颜色
  return daily
    .filter(h => selectedHabitIds.length === 0 || selectedHabitIds.includes(h.id))
    .map(h => ({ dataKey: h.id, name: h.name, color: h.color }))
}

/** 某天某习惯是否打卡 */
function isCheckedInOn(habitId: string, checkIns: CheckIn[], date: string): boolean {
  return checkIns.some(c => c.habitId === habitId && c.date === date)
}

/** 多系列趋势数据：data 中每个点含 date 与各 series 的完成率 */
export function getTrendDataMulti(
  habits: Habit[],
  checkIns: CheckIn[],
  days: number,
  series: TrendSeriesItem[]
): Array<Record<string, string | number>> {
  if (series.length === 0) return []
  const now = new Date()
  const start = new Date(now)
  start.setDate(start.getDate() - days + 1)
  start.setHours(0, 0, 0, 0)
  const dates = dateRange(start, now)
  return dates.map(date => {
    const point: Record<string, string | number> = { date }
    for (const s of series) {
      if (s.dataKey === 'overall') {
        const stat = getDayStats(habits, checkIns, date)
        point.overall = stat.total > 0 ? stat.percent : 0
      } else if (s.dataKey === 'basic') {
        const basic = habits.filter(h => h.type === 'basic')
        const total = basic.length
        const completed = total === 0 ? 0 : basic.filter(h => isCheckedInOn(h.id, checkIns, date)).length
        point.basic = total > 0 ? Math.round((completed / total) * 100) : 0
      } else if (s.dataKey === 'advanced') {
        const advanced = habits.filter(h => h.type === 'advanced')
        const total = advanced.length
        const completed = total === 0 ? 0 : advanced.filter(h => isCheckedInOn(h.id, checkIns, date)).length
        point.advanced = total > 0 ? Math.round((completed / total) * 100) : 0
      } else {
        const h = habits.find(x => x.id === s.dataKey)
        point[s.dataKey] = h && isCheckedInOn(h.id, checkIns, date) ? 100 : 0
      }
    }
    return point
  })
}

/**
 * 计算某个每日类习惯的连续打卡天数（从今天或最近打卡日往前数）
 */
export function getHabitStreak(habitId: string, checkIns: CheckIn[]): number {
  const checkedDates = new Set(
    checkIns.filter(c => c.habitId === habitId).map(c => c.date)
  )
  if (checkedDates.size === 0) return 0
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  let cur = new Date(today)
  if (!checkedDates.has(dateStr(cur))) {
    cur.setDate(cur.getDate() - 1)
    if (!checkedDates.has(dateStr(cur))) return 0
  }
  let streak = 0
  while (checkedDates.has(dateStr(cur))) {
    streak++
    cur.setDate(cur.getDate() - 1)
  }
  return streak
}

/**
 * 计算整体连续全勤天数（所有基础习惯都打卡的连续天数，全勤仅看基础习惯）
 */
export function getOverallStreak(habits: Habit[], checkIns: CheckIn[]): number {
  const basics = basicHabits(habits)
  if (basics.length === 0) return 0
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  let cur = new Date(today)

  const allDoneOn = (d: string) =>
    basics.every(h => checkIns.some(c => c.habitId === h.id && c.date === d))

  if (!allDoneOn(dateStr(cur))) {
    cur.setDate(cur.getDate() - 1)
    if (!allDoneOn(dateStr(cur))) return 0
  }
  let streak = 0
  while (allDoneOn(dateStr(cur))) {
    streak++
    cur.setDate(cur.getDate() - 1)
  }
  return streak
}

/**
 * 按习惯统计周期完成情况（仅用于每日类习惯：完成天数/总天数）
 */
export function getHabitPeriodStats(
  habitId: string,
  checkIns: CheckIn[],
  dates: string[]
): PeriodStats {
  const total = dates.length
  if (total === 0) return { total: 0, completed: 0, percent: 0 }
  const completed = completedDatesForHabitInRange(habitId, checkIns, dates)
  return { total, completed, percent: Math.round((completed / total) * 100) }
}
