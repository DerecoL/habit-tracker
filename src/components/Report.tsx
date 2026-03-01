import { useMemo, useState, useRef } from 'react'
import type { Habit, CheckIn } from '../types'
import { dateRange, getMonthRange, getYearRange } from '../dateUtils'
import { dailyHabits, specialHabits, getDayStats, getBasicDayStats, getSpecialCountInRange, getOverallStreak, getHabitStreak } from '../stats'

type ReportType = 'month' | 'year'

const WEEKDAY_NAMES = ['日', '一', '二', '三', '四', '五', '六']

interface ReportProps {
  habits: Habit[]
  checkIns: CheckIn[]
  getMood: (date: string) => number
}

export function Report({ habits, checkIns, getMood }: ReportProps) {
  const [type, setType] = useState<ReportType>('month')
  const cardRef = useRef<HTMLDivElement>(null)

  const data = useMemo(() => {
    const now = new Date()
    const range = type === 'month' ? getMonthRange(now) : getYearRange(now)
    const dates = dateRange(range.start, range.end)
    const daily = dailyHabits(habits)
    const special = specialHabits(habits)

    let totalDone = 0, totalPossible = 0, perfectDays = 0
    const weekdayDone = Array(7).fill(0)
    const weekdayTotal = Array(7).fill(0)
    let moodSum = 0, moodCount = 0

    for (const date of dates) {
      const stat = getDayStats(habits, checkIns, date)
      totalDone += stat.completed
      totalPossible += stat.total
      const bStat = getBasicDayStats(habits, checkIns, date)
      if (bStat.total > 0 && bStat.completed === bStat.total) perfectDays++
      const wd = new Date(date + 'T00:00:00').getDay()
      weekdayDone[wd] += stat.completed
      weekdayTotal[wd] += stat.total
      const m = getMood(date)
      if (m >= 1 && m <= 5) { moodSum += m; moodCount++ }
    }

    const overallRate = totalPossible > 0 ? Math.round((totalDone / totalPossible) * 100) : 0
    const avgMood = moodCount > 0 ? (moodSum / moodCount).toFixed(1) : '--'

    const bestWeekday = weekdayTotal.reduce((best, _, i) => {
      const rate = weekdayTotal[i] > 0 ? weekdayDone[i] / weekdayTotal[i] : 0
      const bestRate = weekdayTotal[best] > 0 ? weekdayDone[best] / weekdayTotal[best] : 0
      return rate > bestRate ? i : best
    }, 0)

    const topHabits = daily.map(h => ({
      id: h.id, name: h.name, color: h.color, icon: h.icon,
      streak: getHabitStreak(h.id, checkIns),
    })).sort((a, b) => b.streak - a.streak).slice(0, 3)

    const specialTotals = special.map(h => ({
      id: h.id, name: h.name, color: h.color, icon: h.icon,
      count: getSpecialCountInRange(h.id, checkIns, dates),
    }))

    const skipCount = checkIns.filter(c => c.status === 'skip' && dates.includes(c.date)).length

    const label = type === 'month'
      ? `${now.getFullYear()}年${now.getMonth() + 1}月`
      : `${now.getFullYear()}年度`

    return {
      label, dates: dates.length, overallRate, perfectDays,
      totalDone, skipCount, avgMood, bestWeekday: WEEKDAY_NAMES[bestWeekday],
      topHabits, specialTotals,
      overallStreak: getOverallStreak(habits, checkIns),
    }
  }, [habits, checkIns, getMood, type])

  if (dailyHabits(habits).length === 0 && specialHabits(habits).length === 0) return null

  return (
    <div className="report-section">
      <h3 className="dashboard-section-title">周期报告</h3>
      <div className="report-type-tabs">
        <button type="button" className={`trend-filter-tab ${type === 'month' ? 'active' : ''}`}
          onClick={() => setType('month')}>本月</button>
        <button type="button" className={`trend-filter-tab ${type === 'year' ? 'active' : ''}`}
          onClick={() => setType('year')}>本年</button>
      </div>

      <div className="report-card" ref={cardRef}>
        <div className="report-header">
          <h4>{data.label} 习惯报告</h4>
          <span className="report-sub">HABIT_TRACKER</span>
        </div>

        <div className="report-stats-grid">
          <div className="report-stat">
            <span className="report-stat-value">{data.overallRate}%</span>
            <span className="report-stat-label">总完成率</span>
          </div>
          <div className="report-stat">
            <span className="report-stat-value">{data.perfectDays}</span>
            <span className="report-stat-label">全勤天数</span>
          </div>
          <div className="report-stat">
            <span className="report-stat-value">{data.overallStreak}</span>
            <span className="report-stat-label">当前连续</span>
          </div>
          <div className="report-stat">
            <span className="report-stat-value">{data.avgMood}</span>
            <span className="report-stat-label">平均心情</span>
          </div>
          <div className="report-stat">
            <span className="report-stat-value">周{data.bestWeekday}</span>
            <span className="report-stat-label">最佳打卡日</span>
          </div>
          <div className="report-stat">
            <span className="report-stat-value">{data.totalDone}</span>
            <span className="report-stat-label">总打卡次数</span>
          </div>
          {data.skipCount > 0 && (
            <div className="report-stat">
              <span className="report-stat-value">{data.skipCount}</span>
              <span className="report-stat-label">跳过次数</span>
            </div>
          )}
        </div>

        {data.topHabits.length > 0 && (
          <div className="report-top-habits">
            <h5>坚持最久的习惯</h5>
            <div className="report-habit-chips">
              {data.topHabits.map(h => (
                <span key={h.id} className="report-habit-chip" style={{ borderColor: h.color }}>
                  <span className="report-habit-dot" style={{ background: h.color }} />
                  {h.icon ? `${h.icon} ` : ''}{h.name} · {h.streak}天
                </span>
              ))}
            </div>
          </div>
        )}

        {data.specialTotals.length > 0 && (
          <div className="report-top-habits">
            <h5>特殊习惯执行</h5>
            <div className="report-habit-chips">
              {data.specialTotals.map(h => (
                <span key={h.id} className="report-habit-chip" style={{ borderColor: h.color }}>
                  <span className="report-habit-dot" style={{ background: h.color }} />
                  {h.icon ? `${h.icon} ` : ''}{h.name} · {h.count}次
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
