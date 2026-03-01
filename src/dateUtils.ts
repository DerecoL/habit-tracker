/**
 * 获取日期字符串 YYYY-MM-DD
 */
export function dateStr(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/**
 * 今天
 */
export function todayStr(): string {
  return dateStr(new Date())
}

/**
 * 某天的开始与结束（本周/本月/本年）
 */
export function getWeekRange(d: Date): { start: Date; end: Date } {
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  const start = new Date(d)
  start.setDate(d.getDate() + diff)
  start.setHours(0, 0, 0, 0)
  const end = new Date(start)
  end.setDate(start.getDate() + 6)
  end.setHours(23, 59, 59, 999)
  return { start, end }
}

export function getMonthRange(d: Date): { start: Date; end: Date } {
  const start = new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0)
  const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999)
  return { start, end }
}

export function getYearRange(d: Date): { start: Date; end: Date } {
  const start = new Date(d.getFullYear(), 0, 1, 0, 0, 0, 0)
  const end = new Date(d.getFullYear(), 11, 31, 23, 59, 59, 999)
  return { start, end }
}

/**
 * 两个日期之间的所有 YYYY-MM-DD（含首尾）
 */
export function dateRange(start: Date, end: Date): string[] {
  const out: string[] = []
  const cur = new Date(start)
  cur.setHours(0, 0, 0, 0)
  const endTime = end.getTime()
  while (cur.getTime() <= endTime) {
    out.push(dateStr(cur))
    cur.setDate(cur.getDate() + 1)
  }
  return out
}

/**
 * 解析 YYYY-MM-DD 为 Date（本地 0 点）
 */
export function parseDate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d, 0, 0, 0, 0)
}

const WEEKDAY_NAMES = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'] as const

/** 自然日期：2025年2月28日 */
export function formatNaturalDate(d: Date): string {
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`
}

/** 短自然日期：2月28日（同月内用） */
export function formatNaturalShort(d: Date): string {
  return `${d.getMonth() + 1}月${d.getDate()}日`
}

/** 星期几：周六 */
export function formatWeekday(d: Date): string {
  return WEEKDAY_NAMES[d.getDay()]
}

/** 日期范围：2月24日 - 3月2日；同年可省略结束年份 */
export function formatDateRange(start: Date, end: Date): string {
  const sy = start.getFullYear()
  const ey = end.getFullYear()
  const startStr = sy === ey ? formatNaturalShort(start) : formatNaturalDate(start)
  const endStr = sy === ey ? formatNaturalShort(end) : formatNaturalDate(end)
  return `${startStr} - ${endStr}`
}

/** 今日自然日期 + 星期：2025年2月28日 周六 */
export function formatTodayWithWeekday(d: Date): string {
  return `${formatNaturalDate(d)} ${formatWeekday(d)}`
}
