import { useMemo } from 'react'
import {
  getDayStats,
  getBasicDayStats,
  getWeekStats,
  getMonthStats,
  getYearStats,
  getDayStatsByType,
  getPeriodStatsByType,
  dailyHabits,
  basicHabits,
  advancedHabits,
  getSpecialCountStats,
  getOverallStreak,
  getHabitStreak,
  type PeriodStats,
} from '../stats'
import { todayStr } from '../dateUtils'
import { dateRange, getWeekRange, getMonthRange, getYearRange } from '../dateUtils'
import { formatNaturalShort, formatWeekday, formatDateRange } from '../dateUtils'
import type { Habit, CheckIn } from '../types'
import { MoodTrendChart } from './MoodTrendChart'
import { HeatMap } from './HeatMap'
import { InsightCards } from './InsightCards'
import { Report } from './Report'

interface DashboardProps {
  habits: Habit[]
  checkIns: CheckIn[]
  getMood: (date: string) => number
  isCheckedIn: (habitId: string, date: string) => boolean
  toggleCheckIn: (habitId: string, date: string) => void
  onGoManage?: () => void
}

function TypeBar({ label, stat, variant }: {
  label: string
  stat: PeriodStats
  variant: 'basic' | 'advanced'
}) {
  if (stat.total === 0) return null
  return (
    <div className={`type-bar type-bar-${variant}`}>
      <div className="type-bar-header">
        <span className={`type-bar-badge type-bar-badge-${variant}`}>{label}</span>
        <span className="type-bar-nums">{stat.completed}/{stat.total}</span>
        <span className="type-bar-pct">{stat.percent}%</span>
      </div>
      <div className="type-bar-track">
        <div
          className={`type-bar-fill type-bar-fill-${variant}`}
          style={{ width: `${Math.min(100, stat.percent)}%` }}
        />
      </div>
    </div>
  )
}

export function Dashboard({ habits, checkIns, getMood, isCheckedIn, toggleCheckIn, onGoManage }: DashboardProps) {
  const today = todayStr()
  const todayDate = new Date()

  const {
    day, basicDay, week, month, year,
    dayBasic, dayAdv,
    weekBasic, weekAdv, monthBasic, monthAdv, yearBasic, yearAdv,
    specialWeek, specialMonth, specialYear,
    dailyCount, hasBasic, hasAdvanced, hasSpecial,
    weekRangeStr, monthRangeStr, yearRangeStr,
    basicStreaks, advStreaks,
  } = useMemo(() => {
    const now = new Date()
    const day = getDayStats(habits, checkIns, today)
    const basicDay = getBasicDayStats(habits, checkIns, today)
    const week = getWeekStats(habits, checkIns, now)
    const month = getMonthStats(habits, checkIns, now)
    const year = getYearStats(habits, checkIns, now)

    const dayBasic = getDayStatsByType(habits, checkIns, today, 'basic')
    const dayAdv = getDayStatsByType(habits, checkIns, today, 'advanced')

    const { start: weekStart, end: weekEnd } = getWeekRange(now)
    const weekDates = dateRange(weekStart, weekEnd)
    const { start: monthStart, end: monthEnd } = getMonthRange(now)
    const monthDates = dateRange(monthStart, monthEnd)
    const { start: yearStart, end: yearEnd } = getYearRange(now)
    const yearDates = dateRange(yearStart, yearEnd)

    const weekBasic = getPeriodStatsByType(habits, checkIns, weekDates, 'basic')
    const weekAdv = getPeriodStatsByType(habits, checkIns, weekDates, 'advanced')
    const monthBasic = getPeriodStatsByType(habits, checkIns, monthDates, 'basic')
    const monthAdv = getPeriodStatsByType(habits, checkIns, monthDates, 'advanced')
    const yearBasic = getPeriodStatsByType(habits, checkIns, yearDates, 'basic')
    const yearAdv = getPeriodStatsByType(habits, checkIns, yearDates, 'advanced')

    const specialWeek = getSpecialCountStats(habits, checkIns, weekDates)
    const specialMonth = getSpecialCountStats(habits, checkIns, monthDates)
    const specialYear = getSpecialCountStats(habits, checkIns, yearDates)

    const dailyCount = dailyHabits(habits).length
    const hasBasic = basicHabits(habits).length > 0
    const hasAdvanced = advancedHabits(habits).length > 0
    const hasSpecial = habits.some(h => h.type === 'special')

    const weekRangeStr = formatDateRange(weekStart, weekEnd)
    const monthRangeStr = formatDateRange(monthStart, monthEnd)
    const yearRangeStr = `${yearStart.getFullYear()}年1月1日 - 12月31日`

    const basicStreaks = basicHabits(habits).map(h => ({
      ...h, streak: getHabitStreak(h.id, checkIns)
    }))
    const advStreaks = advancedHabits(habits).map(h => ({
      ...h, streak: getHabitStreak(h.id, checkIns)
    }))

    return {
      day, basicDay, week, month, year,
      dayBasic, dayAdv,
      weekBasic, weekAdv, monthBasic, monthAdv, yearBasic, yearAdv,
      specialWeek, specialMonth, specialYear,
      dailyCount, hasBasic, hasAdvanced, hasSpecial,
      weekRangeStr, monthRangeStr, yearRangeStr,
      basicStreaks, advStreaks,
    }
  }, [habits, checkIns, today])

  return (
    <section className="panel dashboard">
      <h2 className="panel-title">SYS_OVERVIEW // 完成总览</h2>
      <p className="panel-desc">基础习惯与进阶习惯分别展示完成率，特殊习惯看周期内执行次数</p>

      {dailyCount > 0 && (
        <>
          {/* ── Streak Banner ── */}
          <div className="streak-banner">
            <div className="streak-item streak-item-main">
              <span className="streak-flame">&#x1F525;</span>
              <span className="streak-value">{getOverallStreak(habits, checkIns)}</span>
              <span className="streak-label">天连续全勤</span>
            </div>
            <div className="streak-typed-groups">
              {hasBasic && (
                <div className="streak-typed-group">
                  <span className="streak-group-label streak-group-label-basic">基础</span>
                  <div className="streak-detail">
                    {basicStreaks.map(h => (
                      <span key={h.id} className="streak-chip" style={{ borderColor: h.color }}>
                        <span className="streak-chip-dot" style={{ background: h.color }} />
                        {h.name} <strong>{h.streak}</strong>天
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {hasAdvanced && (
                <div className="streak-typed-group">
                  <span className="streak-group-label streak-group-label-adv">进阶</span>
                  <div className="streak-detail">
                    {advStreaks.map(h => (
                      <span key={h.id} className="streak-chip" style={{ borderColor: h.color }}>
                        <span className="streak-chip-dot" style={{ background: h.color }} />
                        {h.name} <strong>{h.streak}</strong>天
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── Period Cards ── */}
          <h3 className="dashboard-section-title">周期完成率</h3>
          <div className="dashboard-grid">
            {/* 今日 */}
            <div className="dashboard-card">
              <div className="dcard-head">
                <h3>今日</h3>
                <span className="dcard-date">{formatNaturalShort(todayDate)} {formatWeekday(todayDate)}</span>
              </div>
              <div className="dcard-overall">
                <span className="dcard-overall-pct">{day.percent}%</span>
                <span className="dcard-overall-detail">{day.completed}/{day.total}</span>
              </div>
              <div className="dcard-types">
                <TypeBar label="基础" stat={dayBasic} variant="basic" />
                <TypeBar label="进阶" stat={dayAdv} variant="advanced" />
              </div>
              {dailyCount > 0 && (
                <div className="quick-checkin-bar">
                  {dailyHabits(habits).map(h => (
                    <button
                      key={h.id}
                      type="button"
                      className={`quick-checkin-chip ${isCheckedIn(h.id, today) ? 'done' : ''}`}
                      style={{ '--habit-color': h.color } as React.CSSProperties}
                      onClick={() => toggleCheckIn(h.id, today)}
                    >
                      <span className="qc-dot" />
                      <span className="qc-name">{h.name}</span>
                    </button>
                  ))}
                </div>
              )}
              {basicDay.total > 0 && basicDay.completed === basicDay.total && (
                <div className="dcard-allclear">ALL CLEAR // 基础全勤</div>
              )}
            </div>

            {/* 本周 */}
            <div className="dashboard-card">
              <div className="dcard-head">
                <h3>本周</h3>
                <span className="dcard-date">{weekRangeStr}</span>
              </div>
              <div className="dcard-overall">
                <span className="dcard-overall-pct">{week.percent}%</span>
                <span className="dcard-overall-detail">{week.completed}/{week.total}</span>
              </div>
              <div className="dcard-types">
                <TypeBar label="基础" stat={weekBasic} variant="basic" />
                <TypeBar label="进阶" stat={weekAdv} variant="advanced" />
              </div>
            </div>

            {/* 本月 */}
            <div className="dashboard-card">
              <div className="dcard-head">
                <h3>本月</h3>
                <span className="dcard-date">{monthRangeStr}</span>
              </div>
              <div className="dcard-overall">
                <span className="dcard-overall-pct">{month.percent}%</span>
                <span className="dcard-overall-detail">{month.completed}/{month.total}</span>
              </div>
              <div className="dcard-types">
                <TypeBar label="基础" stat={monthBasic} variant="basic" />
                <TypeBar label="进阶" stat={monthAdv} variant="advanced" />
              </div>
            </div>

            {/* 本年 */}
            <div className="dashboard-card">
              <div className="dcard-head">
                <h3>本年</h3>
                <span className="dcard-date">{yearRangeStr}</span>
              </div>
              <div className="dcard-overall">
                <span className="dcard-overall-pct">{year.percent}%</span>
                <span className="dcard-overall-detail">{year.completed}/{year.total}</span>
              </div>
              <div className="dcard-types">
                <TypeBar label="基础" stat={yearBasic} variant="basic" />
                <TypeBar label="进阶" stat={yearAdv} variant="advanced" />
              </div>
            </div>
          </div>
        </>
      )}

      {hasSpecial && (
        <>
          <h3 className="dashboard-section-title">特殊习惯（执行次数）</h3>
          <div className="dashboard-grid dashboard-grid-special">
            {([
              { title: '本周', rangeStr: weekRangeStr, stats: specialWeek, goalKey: 'goalPerWeek' as const },
              { title: '本月', rangeStr: monthRangeStr, stats: specialMonth, goalKey: 'goalPerMonth' as const },
              { title: '本年', rangeStr: yearRangeStr, stats: specialYear, goalKey: null },
            ] as const).map(({ title, rangeStr, stats, goalKey }) => (
              <div key={title} className="dashboard-card dashboard-card-special">
                <div className="dcard-head">
                  <h3>{title}</h3>
                  <span className="dcard-date">{rangeStr}</span>
                </div>
                <p className="dashboard-special-value">共 {stats.totalCount} 次</p>
                <ul className="special-detail-list">
                  {stats.byHabit.map(item => {
                    const habit = habits.find(h => h.id === item.habitId)
                    const goal = goalKey && habit ? (habit[goalKey] ?? 0) : 0
                    const pct = goal > 0 ? Math.min(100, Math.round((item.count / goal) * 100)) : 0
                    return (
                      <li key={item.habitId} className="special-detail-item">
                        <span className="special-detail-dot" style={{ background: item.color }} />
                        <span className="special-detail-name" style={{ color: item.color }}>{item.name}</span>
                        <span className="special-detail-count">{item.count} 次</span>
                        {goal > 0 && (
                          <span className="special-detail-goal">
                            <span className="special-goal-track">
                              <span className="special-goal-fill" style={{ width: `${pct}%`, background: item.color }} />
                            </span>
                            <span className={`special-goal-text ${pct >= 100 ? 'done' : ''}`}>
                              {pct >= 100 ? '达标' : `${item.count}/${goal}`}
                            </span>
                          </span>
                        )}
                      </li>
                    )
                  })}
                </ul>
              </div>
            ))}
          </div>
        </>
      )}

      <InsightCards habits={habits} checkIns={checkIns} getMood={getMood} />

      <HeatMap habits={habits} checkIns={checkIns} />

      <MoodTrendChart getMood={getMood} days={14} />

      <Report habits={habits} checkIns={checkIns} getMood={getMood} />

      {habits.length === 0 && (
        <div className="empty-state">
          <span className="empty-state-icon">◈</span>
          <p className="empty-state-text">还没有添加任何习惯，快去设定你的目标吧</p>
          {onGoManage && <button type="button" className="empty-state-btn" onClick={onGoManage}>⚙ 去添加习惯</button>}
        </div>
      )}
    </section>
  )
}
