import { useMemo } from 'react'
import type { Habit, CheckIn } from '../types'
import { dateRange } from '../dateUtils'
import { dailyHabits, getDayStats, specialHabits, getSpecialCountInRange } from '../stats'

const WEEKDAY_NAMES = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

interface InsightCardsProps {
  habits: Habit[]
  checkIns: CheckIn[]
  getMood: (date: string) => number
}

export function InsightCards({ habits, checkIns, getMood }: InsightCardsProps) {
  const { bestDay, worstDay, moodCorrelation, specialGoals } = useMemo(() => {
    const daily = dailyHabits(habits)
    const now = new Date()
    const start = new Date(now)
    start.setDate(start.getDate() - 89)
    start.setHours(0, 0, 0, 0)
    const dates = dateRange(start, now)

    const weekdayStats = Array.from({ length: 7 }, () => ({ total: 0, completed: 0 }))
    for (const date of dates) {
      const stat = getDayStats(habits, checkIns, date)
      if (stat.total === 0) continue
      const d = new Date(date + 'T00:00:00')
      const wd = d.getDay()
      weekdayStats[wd].total += stat.total
      weekdayStats[wd].completed += stat.completed
    }

    const weekdayRates = weekdayStats.map((s, i) => ({
      day: i,
      name: WEEKDAY_NAMES[i],
      rate: s.total > 0 ? Math.round((s.completed / s.total) * 100) : -1,
    })).filter(d => d.rate >= 0)

    const sorted = [...weekdayRates].sort((a, b) => b.rate - a.rate)
    const bestDay = sorted.length > 0 ? sorted[0] : null
    const worstDay = sorted.length > 0 ? sorted[sorted.length - 1] : null

    // mood vs completion correlation
    let moodCorrelation: { hasData: boolean; direction: string; detail: string } = { hasData: false, direction: '', detail: '' }
    if (daily.length > 0) {
      const pairs: { mood: number; rate: number }[] = []
      for (const date of dates) {
        const m = getMood(date)
        if (m < 1 || m > 5) continue
        const stat = getDayStats(habits, checkIns, date)
        if (stat.total === 0) continue
        pairs.push({ mood: m, rate: stat.percent })
      }
      if (pairs.length >= 7) {
        const highMood = pairs.filter(p => p.mood >= 4)
        const lowMood = pairs.filter(p => p.mood <= 2)
        const avgHigh = highMood.length > 0 ? Math.round(highMood.reduce((s, p) => s + p.rate, 0) / highMood.length) : -1
        const avgLow = lowMood.length > 0 ? Math.round(lowMood.reduce((s, p) => s + p.rate, 0) / lowMood.length) : -1
        if (avgHigh >= 0 && avgLow >= 0) {
          const diff = avgHigh - avgLow
          moodCorrelation = {
            hasData: true,
            direction: diff > 10 ? '正相关' : diff < -10 ? '负相关' : '无明显关联',
            detail: `心情好时完成率 ${avgHigh}%，心情差时 ${avgLow}%（差值 ${diff > 0 ? '+' : ''}${diff}%）`,
          }
        } else if (avgHigh >= 0) {
          moodCorrelation = { hasData: true, direction: '数据不足', detail: `心情好时完成率 ${avgHigh}%（心情差的记录太少）` }
        }
      }
    }

    // special habit goals
    const specials = specialHabits(habits)
    const weekStart = new Date(now)
    const dayOfWeek = weekStart.getDay()
    weekStart.setDate(weekStart.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1))
    weekStart.setHours(0, 0, 0, 0)
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 6)
    const weekDates = dateRange(weekStart, weekEnd)

    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    const monthDates = dateRange(monthStart, monthEnd)

    const specialGoals = specials
      .filter(h => h.goalPerWeek || h.goalPerMonth)
      .map(h => {
        const weekCount = getSpecialCountInRange(h.id, checkIns, weekDates)
        const monthCount = getSpecialCountInRange(h.id, checkIns, monthDates)
        return {
          id: h.id, name: h.name, color: h.color,
          goalPerWeek: h.goalPerWeek ?? 0,
          goalPerMonth: h.goalPerMonth ?? 0,
          weekCount, monthCount,
        }
      })

    return { bestDay, worstDay, moodCorrelation, specialGoals }
  }, [habits, checkIns, getMood])

  const daily = dailyHabits(habits)
  if (daily.length === 0 && specialGoals.length === 0) return null

  return (
    <div className="insight-cards">
      <h3 className="dashboard-section-title">数据洞察（近 90 天）</h3>
      <div className="insight-grid">
        {bestDay && worstDay && (
          <div className="insight-card">
            <span className="insight-card-icon">📊</span>
            <h4>最佳 & 最差打卡日</h4>
            <p className="insight-highlight">
              <span className="insight-best">{bestDay.name} {bestDay.rate}%</span>
              {bestDay.day !== worstDay.day && (
                <span className="insight-worst">{worstDay.name} {worstDay.rate}%</span>
              )}
            </p>
          </div>
        )}

        {moodCorrelation.hasData && (
          <div className="insight-card">
            <span className="insight-card-icon">💡</span>
            <h4>心情 × 完成率</h4>
            <p className="insight-tag">{moodCorrelation.direction}</p>
            <p className="insight-detail">{moodCorrelation.detail}</p>
          </div>
        )}

        {specialGoals.map(g => (
          <div key={g.id} className="insight-card insight-card-goal">
            <span className="insight-card-dot" style={{ background: g.color }} />
            <h4>{g.name}</h4>
            <div className="insight-goal-bars">
              {g.goalPerWeek > 0 && (
                <div className="insight-goal-row">
                  <span className="insight-goal-label">本周</span>
                  <div className="insight-goal-track">
                    <div className="insight-goal-fill" style={{
                      width: `${Math.min(100, Math.round((g.weekCount / g.goalPerWeek) * 100))}%`,
                      background: g.color,
                    }} />
                  </div>
                  <span className="insight-goal-nums">{g.weekCount}/{g.goalPerWeek}</span>
                </div>
              )}
              {g.goalPerMonth > 0 && (
                <div className="insight-goal-row">
                  <span className="insight-goal-label">本月</span>
                  <div className="insight-goal-track">
                    <div className="insight-goal-fill" style={{
                      width: `${Math.min(100, Math.round((g.monthCount / g.goalPerMonth) * 100))}%`,
                      background: g.color,
                    }} />
                  </div>
                  <span className="insight-goal-nums">{g.monthCount}/{g.goalPerMonth}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
