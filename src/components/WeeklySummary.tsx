import { useMemo } from 'react'
import type { Habit, CheckIn } from '../types'
import { dateRange, getWeekRange } from '../dateUtils'
import { getDayStats, basicHabits } from '../stats'

interface WeeklySummaryProps {
  habits: Habit[]
  checkIns: CheckIn[]
  getMood: (date: string) => number
}

export function WeeklySummary({ habits, checkIns, getMood }: WeeklySummaryProps) {
  const data = useMemo(() => {
    const now = new Date()
    const lastWeekRef = new Date(now)
    lastWeekRef.setDate(lastWeekRef.getDate() - 7)
    const { start, end } = getWeekRange(lastWeekRef)
    const dates = dateRange(start, end)

    const basics = basicHabits(habits)
    if (basics.length === 0) return null

    let totalSlots = 0
    let completed = 0
    const moodSum: number[] = []
    let perfectDays = 0
    let bestDay = ''
    let worstDay = ''
    let bestPercent = 0
    let worstPercent = 100

    dates.forEach((d) => {
      const s = getDayStats(habits, checkIns, d)
      totalSlots += s.total
      completed += s.completed
      if (s.total > 0) {
        const m = getMood(d)
        if (m >= 1 && m <= 5) moodSum.push(m)
        if (s.completed === s.total) perfectDays++
        if (s.percent > bestPercent) {
          bestPercent = s.percent
          bestDay = d
        }
        if (s.percent < worstPercent) {
          worstPercent = s.percent
          worstDay = d
        }
      }
    })

    if (totalSlots === 0) return null

    const completionRate = Math.round((completed / totalSlots) * 100)
    const moodAvg =
      moodSum.length > 0
        ? Math.round(
            (moodSum.reduce((a, b) => a + b, 0) / moodSum.length) * 10
          ) / 10
        : null

    return {
      completionRate,
      perfectDays,
      moodAvg,
      bestDay,
      worstDay,
      dateRange: { start, end },
    }
  }, [habits, checkIns, getMood])

  if (!data) return null

  return (
    <div className="weekly-summary">
      <h3>上周回顾</h3>
      <div className="ws-stats-grid">
        <div className="ws-stat">
          <span className="ws-stat-label">完成率</span>
          <span className="ws-stat-value">{data.completionRate}%</span>
        </div>
        <div className="ws-stat">
          <span className="ws-stat-label">全勤天数</span>
          <span className="ws-stat-value">{data.perfectDays}</span>
        </div>
        {data.moodAvg != null && (
          <div className="ws-stat">
            <span className="ws-stat-label">心情均分</span>
            <span className="ws-stat-value">{data.moodAvg}</span>
          </div>
        )}
        {data.bestDay && (
          <div className="ws-stat">
            <span className="ws-stat-label">最佳日</span>
            <span className="ws-stat-value">{data.bestDay}</span>
          </div>
        )}
        {data.worstDay && (
          <div className="ws-stat">
            <span className="ws-stat-label">待改进日</span>
            <span className="ws-stat-value">{data.worstDay}</span>
          </div>
        )}
      </div>
    </div>
  )
}
