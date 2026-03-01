import { useState, useMemo } from 'react'
import { todayStr } from '../dateUtils'
import { dateRange, getWeekRange, getMonthRange, getYearRange } from '../dateUtils'
import { formatTodayWithWeekday, formatDateRange } from '../dateUtils'
import { parseDate } from '../dateUtils'
import type { Habit, CheckIn } from '../types'
import { MOOD_LABELS } from '../types'
import { getDayStats, getWeekStats, getMonthStats, getYearStats, dailyHabits, specialHabits, getHabitPeriodStats, getSpecialCountStats, type PeriodStats } from '../stats'

function PeriodTable({ title, dateRange: rangeStr, stat, habits, checkIns, dates }: {
  title: string
  dateRange: string
  stat: PeriodStats
  habits: Habit[]
  checkIns: CheckIn[]
  dates: string[]
}) {
  return (
    <div className="period-table">
      <h3>{title}</h3>
      <p className="period-summary period-summary-date">{rangeStr}</p>
      <p className="period-summary">{stat.completed}/{stat.total} · {stat.percent}%</p>
      <ul className="habit-period-list">
        {habits.map(h => {
          const s = getHabitPeriodStats(h.id, checkIns, dates)
          return (
            <li key={h.id} className="habit-period-row">
              <span className="habit-period-name" style={{ color: h.color }}>{h.name}</span>
              <div className="habit-period-bar-wrap">
                <div
                  className="habit-period-bar"
                  style={{ width: `${s.percent}%`, background: h.color }}
                />
              </div>
              <span className="habit-period-value">{s.completed}/{s.total}</span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

function SpecialPeriodTable({ title, dateRange: rangeStr, stats }: {
  title: string
  dateRange: string
  stats: { totalCount: number; byHabit: { habitId: string; name: string; color: string; count: number }[] }
}) {
  return (
    <div className="period-table period-table-special">
      <h3>{title}</h3>
      <p className="period-summary period-summary-date">{rangeStr}</p>
      <p className="period-summary">共 {stats.totalCount} 次</p>
      <ul className="habit-period-list">
        {stats.byHabit.map(x => (
          <li key={x.habitId} className="habit-period-row habit-period-row-special">
            <span className="habit-period-name" style={{ color: x.color }}>{x.name}</span>
            <span className="habit-period-value">{x.count} 次</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

interface DailyCheckInProps {
  habits: Habit[]
  checkIns: CheckIn[]
  isCheckedIn: (habitId: string, date: string) => boolean
  toggleCheckIn: (habitId: string, date: string) => void
  addSpecialCheckIn: (habitId: string, date: string) => void
  removeOneSpecialCheckIn: (habitId: string, date: string) => void
  getSpecialCount: (habitId: string, date: string) => number
  getMemo: (date: string) => string
  setMemo: (date: string, content: string) => void
  getMood: (date: string) => number
  setMood: (date: string, value: number) => void
  onGoManage?: () => void
}

export function DailyCheckIn({
  habits,
  checkIns,
  isCheckedIn,
  toggleCheckIn,
  addSpecialCheckIn,
  removeOneSpecialCheckIn,
  getSpecialCount,
  getMemo,
  setMemo,
  getMood,
  setMood,
  onGoManage,
}: DailyCheckInProps) {
  const today = todayStr()
  const todayDate = new Date()
  const [reviewDate, setReviewDate] = useState<string>(() => todayStr())

  const daily = useMemo(() => dailyHabits(habits), [habits])
  const special = useMemo(() => specialHabits(habits), [habits])

  const {
    dayStat, weekStat, monthStat, yearStat,
    weekDates, monthDates, yearDates,
    specialWeek, specialMonth, specialYear,
    weekRangeStr, monthRangeStr, yearRangeStr,
  } = useMemo(() => {
    const now = new Date()
    const dayStat = getDayStats(habits, checkIns, today)
    const weekStat = getWeekStats(habits, checkIns, now)
    const monthStat = getMonthStats(habits, checkIns, now)
    const yearStat = getYearStats(habits, checkIns, now)

    const { start: weekStart, end: weekEnd } = getWeekRange(now)
    const weekDates = dateRange(weekStart, weekEnd)
    const { start: monthStart, end: monthEnd } = getMonthRange(now)
    const monthDates = dateRange(monthStart, monthEnd)
    const { start: yearStart, end: yearEnd } = getYearRange(now)
    const yearDates = dateRange(yearStart, yearEnd)

    const specialWeek = getSpecialCountStats(habits, checkIns, weekDates)
    const specialMonth = getSpecialCountStats(habits, checkIns, monthDates)
    const specialYear = getSpecialCountStats(habits, checkIns, yearDates)

    const weekRangeStr = formatDateRange(weekStart, weekEnd)
    const monthRangeStr = formatDateRange(monthStart, monthEnd)
    const yearRangeStr = `${yearStart.getFullYear()}年1月1日 - 12月31日`

    return {
      dayStat, weekStat, monthStat, yearStat,
      weekDates, monthDates, yearDates,
      specialWeek, specialMonth, specialYear,
      weekRangeStr, monthRangeStr, yearRangeStr,
    }
  }, [habits, checkIns, today])

  return (
    <section className="panel daily">
      <h2 className="panel-title">DAILY_CHECK // 今日打卡</h2>
      <p className="panel-desc panel-desc-date">{formatTodayWithWeekday(todayDate)}</p>
      {habits.length > 0 ? (
        <p className="panel-desc">
          {daily.length > 0 && (
            <>基础+进阶：今天已完成 {dayStat.completed}/{dayStat.total} 项 · {dayStat.percent}%</>
          )}
          {daily.length > 0 && special.length > 0 && ' · '}
          {special.length > 0 && (
            <>特殊习惯：今日共执行 {special.reduce((s, h) => s + getSpecialCount(h.id, today), 0)} 次</>
          )}
        </p>
      ) : (
        <div className="empty-state">
          <span className="empty-state-icon">▣</span>
          <p className="empty-state-text">还没有添加任何习惯，无法打卡</p>
          {onGoManage && <button type="button" className="empty-state-btn" onClick={onGoManage}>⚙ 去添加习惯</button>}
        </div>
      )}

      {daily.length > 0 && (
        <div className="habit-today-block">
          <h3 className="habit-block-title">基础 + 进阶习惯（点击切换今日是否完成）</h3>
          <div className="habit-today-list">
            {daily.map(h => (
              <button
                key={h.id}
                type="button"
                className={`habit-today-item ${isCheckedIn(h.id, today) ? 'done' : ''}`}
                style={{ '--habit-color': h.color } as React.CSSProperties}
                onClick={() => toggleCheckIn(h.id, today)}
              >
                <span className="habit-today-dot" />
                <span className="habit-today-name">{h.name}</span>
                {isCheckedIn(h.id, today) && <span className="habit-today-check">DONE</span>}
              </button>
            ))}
          </div>
        </div>
      )}

      {special.length > 0 && (
        <div className="habit-today-block habit-special-block">
          <h3 className="habit-block-title">特殊习惯（不固定某天，记录执行次数）</h3>
          <div className="habit-today-list habit-special-list">
            {special.map(h => {
              const count = getSpecialCount(h.id, today)
              return (
                <div key={h.id} className="habit-special-item">
                  <span className="habit-today-dot" style={{ background: h.color }} />
                  <span className="habit-today-name" style={{ color: h.color }}>{h.name}</span>
                  <span className="habit-special-count">今日 {count} 次</span>
                  <button
                    type="button"
                    className="btn btn-sm btn-primary"
                    onClick={() => addSpecialCheckIn(h.id, today)}
                  >
                    ＋ 打卡
                  </button>
                  {count > 0 && (
                    <button
                      type="button"
                      className="btn btn-sm btn-ghost"
                      onClick={() => removeOneSpecialCheckIn(h.id, today)}
                    >
                      － 减一次
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div className="mood-block">
        <h3 className="habit-block-title">今日开心程度</h3>
        <p className="memo-hint">每天记录一下当天的心情，方便回看（再次点击可取消选择）</p>
        <div className="mood-options">
          {([1, 2, 3, 4, 5] as const).map(v => (
            <button
              key={v}
              type="button"
              className={`mood-option ${getMood(today) === v ? 'active' : ''}`}
              onClick={() => setMood(today, getMood(today) === v ? 0 : v)}
              title={MOOD_LABELS[v]}
            >
              <span className="mood-option-value">{v}</span>
              <span className="mood-option-label">{MOOD_LABELS[v]}</span>
            </button>
          ))}
        </div>
        {getMood(today) > 0 && (
          <p className="mood-today-summary">今天：{MOOD_LABELS[getMood(today)]}</p>
        )}
      </div>

      <div className="memo-block">
        <h3 className="habit-block-title">今日备忘</h3>
        <p className="memo-hint">记录今天发生的特殊事情，回看时一目了然</p>
        <textarea
          className="memo-textarea"
          placeholder="例如：今天加班到很晚、和朋友聚餐、完成了一个重要项目..."
          value={getMemo(today)}
          onChange={e => setMemo(today, e.target.value)}
          rows={3}
        />
      </div>

      {habits.length > 0 && (
        <div className="period-tables">
            {daily.length > 0 && (
              <>
                <PeriodTable title="本周进度（基础+进阶）" dateRange={weekRangeStr} stat={weekStat} habits={daily} checkIns={checkIns} dates={weekDates} />
                <PeriodTable title="本月进度（基础+进阶）" dateRange={monthRangeStr} stat={monthStat} habits={daily} checkIns={checkIns} dates={monthDates} />
                <PeriodTable title="本年进度（基础+进阶）" dateRange={yearRangeStr} stat={yearStat} habits={daily} checkIns={checkIns} dates={yearDates} />
              </>
            )}
            {special.length > 0 && (
              <>
                <SpecialPeriodTable title="特殊习惯 · 本周执行次数" dateRange={weekRangeStr} stats={specialWeek} />
                <SpecialPeriodTable title="特殊习惯 · 本月执行次数" dateRange={monthRangeStr} stats={specialMonth} />
                <SpecialPeriodTable title="特殊习惯 · 本年执行次数" dateRange={yearRangeStr} stats={specialYear} />
              </>
            )}
          </div>
      )}

      <div className="review-day-block">
            <h3 className="habit-block-title">日期回顾</h3>
            <p className="memo-hint">选择日期查看并补打该天的习惯，也可修改心情和备忘</p>
            <div className="review-day-picker">
              <label htmlFor="review-date">查看日期</label>
              <input
                id="review-date"
                type="date"
                className="review-date-input"
                value={reviewDate}
                max={today}
                onChange={e => setReviewDate(e.target.value)}
              />
            </div>
            {reviewDate && (() => {
              const d = parseDate(reviewDate)
              const dayLabel = formatTodayWithWeekday(d)
              const thatDayStat = getDayStats(habits, checkIns, reviewDate)
              const specialThatDay = special.reduce((s, h) => s + getSpecialCount(h.id, reviewDate), 0)
              const isToday = reviewDate === today
              return (
                <div className="review-day-card">
                  <p className="review-day-date">{dayLabel}{isToday && <span className="review-today-badge">今天</span>}</p>
                  {habits.length > 0 && (
                    <p className="review-day-summary">
                      {daily.length > 0 && <>基础+进阶：完成 {thatDayStat.completed}/{thatDayStat.total} 项</>}
                      {daily.length > 0 && special.length > 0 && ' · '}
                      {special.length > 0 && <>特殊习惯：共 {specialThatDay} 次</>}
                    </p>
                  )}
                  {daily.length > 0 && (
                    <div className="review-checkin-block">
                      <label>习惯打卡{!isToday && '（点击可补打/取消）'}</label>
                      <div className="review-checkin-list">
                        {daily.map(h => (
                          <button
                            key={h.id}
                            type="button"
                            className={`review-checkin-chip ${isCheckedIn(h.id, reviewDate) ? 'done' : ''}`}
                            style={{ '--habit-color': h.color } as React.CSSProperties}
                            onClick={() => toggleCheckIn(h.id, reviewDate)}
                          >
                            <span className="review-checkin-dot" />
                            <span>{h.name}</span>
                            {isCheckedIn(h.id, reviewDate) && <span className="review-checkin-mark">DONE</span>}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {special.length > 0 && (
                    <div className="review-checkin-block">
                      <label>特殊习惯</label>
                      <div className="review-special-list">
                        {special.map(h => {
                          const cnt = getSpecialCount(h.id, reviewDate)
                          return (
                            <div key={h.id} className="review-special-row">
                              <span className="review-checkin-dot" style={{ background: h.color }} />
                              <span style={{ color: h.color }}>{h.name}</span>
                              <span className="review-special-cnt">{cnt} 次</span>
                              <button type="button" className="btn btn-sm btn-primary" onClick={() => addSpecialCheckIn(h.id, reviewDate)}>＋</button>
                              {cnt > 0 && <button type="button" className="btn btn-sm btn-ghost" onClick={() => removeOneSpecialCheckIn(h.id, reviewDate)}>－</button>}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                  <div className="review-day-mood">
                    <label>当天开心程度</label>
                    <div className="mood-options mood-options-inline">
                      {([1, 2, 3, 4, 5] as const).map(v => (
                        <button
                          key={v}
                          type="button"
                          className={`mood-option ${getMood(reviewDate) === v ? 'active' : ''}`}
                          onClick={() => setMood(reviewDate, getMood(reviewDate) === v ? 0 : v)}
                          title={MOOD_LABELS[v]}
                        >
                          <span className="mood-option-value">{v}</span>
                          <span className="mood-option-label">{MOOD_LABELS[v]}</span>
                        </button>
                      ))}
                    </div>
                    {getMood(reviewDate) > 0 && (
                      <p className="mood-today-summary">{MOOD_LABELS[getMood(reviewDate)]}</p>
                    )}
                  </div>
                  <div className="review-day-memo">
                    <label>当天备忘</label>
                    <textarea
                      className="memo-textarea"
                      placeholder="可补写或修改这一天的备忘"
                      value={getMemo(reviewDate)}
                      onChange={e => setMemo(reviewDate, e.target.value)}
                      rows={3}
                    />
                  </div>
                </div>
              )
            })()}
      </div>
    </section>
  )
}
