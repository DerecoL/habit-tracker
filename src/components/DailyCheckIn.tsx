import { useState, useMemo } from 'react'
import { todayStr, dateRange, getWeekRange, getMonthRange, getYearRange, formatTodayWithWeekday, formatDateRange, parseDate } from '../dateUtils'
import type { Habit, CheckIn } from '../types'
import { MOOD_LABELS, MOOD_EMOJIS, isHabitDueOn } from '../types'
import { getDayStats, getWeekStats, getMonthStats, getYearStats, dailyHabits, specialHabits, getHabitPeriodStats, getSpecialCountStats, type PeriodStats } from '../stats'
import { HabitTimer } from './HabitTimer'

function PeriodTable({ title, dateRange: rangeStr, stat, habits, checkIns, dates }: {
  title: string; dateRange: string; stat: PeriodStats; habits: Habit[]; checkIns: CheckIn[]; dates: string[]
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
              <span className="habit-period-name" style={{ color: h.color }}>{h.icon ? `${h.icon} ` : ''}{h.name}</span>
              <div className="habit-period-bar-wrap">
                <div className="habit-period-bar" style={{ width: `${s.percent}%`, background: h.color }} />
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
  title: string; dateRange: string
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
  skipCheckIn: (habitId: string, date: string) => void
  getCheckInStatus: (habitId: string, date: string) => 'done' | 'skip' | 'none'
  getCheckInNote: (habitId: string, date: string) => string
  setCheckInNote: (habitId: string, date: string, note: string) => void
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
  habits, checkIns, toggleCheckIn, skipCheckIn,
  getCheckInStatus, getCheckInNote, setCheckInNote,
  addSpecialCheckIn, removeOneSpecialCheckIn, getSpecialCount,
  getMemo, setMemo, getMood, setMood, onGoManage,
}: DailyCheckInProps) {
  const today = todayStr()
  const todayDate = new Date()
  const [reviewDate, setReviewDate] = useState<string>(() => todayStr())
  const [noteExpanded, setNoteExpanded] = useState<string | null>(null)
  const [showTimer, setShowTimer] = useState(false)

  const daily = useMemo(() => dailyHabits(habits), [habits])
  const special = useMemo(() => specialHabits(habits), [habits])

  // Filter by frequency: only show habits due today
  const dailyDueToday = useMemo(() => daily.filter(h => isHabitDueOn(h, today)), [daily, today])

  // Group habits by group
  const groupedDaily = useMemo(() => {
    const groups: Record<string, Habit[]> = {}
    for (const h of dailyDueToday) {
      const g = h.group || '未分组'
      if (!groups[g]) groups[g] = []
      groups[g].push(h)
    }
    return groups
  }, [dailyDueToday])

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
    const { start: ws, end: we } = getWeekRange(now)
    const weekDates = dateRange(ws, we)
    const { start: ms, end: me } = getMonthRange(now)
    const monthDates = dateRange(ms, me)
    const { start: ys, end: ye } = getYearRange(now)
    const yearDates = dateRange(ys, ye)
    return {
      dayStat, weekStat, monthStat, yearStat,
      weekDates, monthDates, yearDates,
      specialWeek: getSpecialCountStats(habits, checkIns, weekDates),
      specialMonth: getSpecialCountStats(habits, checkIns, monthDates),
      specialYear: getSpecialCountStats(habits, checkIns, yearDates),
      weekRangeStr: formatDateRange(ws, we),
      monthRangeStr: formatDateRange(ms, me),
      yearRangeStr: `${ys.getFullYear()}年1月1日 - 12月31日`,
    }
  }, [habits, checkIns, today])

  const renderHabitItem = (h: Habit, date: string) => {
    const status = getCheckInStatus(h.id, date)
    const note = getCheckInNote(h.id, date)
    const isNoteOpen = noteExpanded === `${h.id}-${date}`
    return (
      <div key={h.id} className={`habit-today-item-wrap`}>
        <div className="habit-today-item-row">
          <button
            type="button"
            className={`habit-today-item ${status === 'done' ? 'done' : ''} ${status === 'skip' ? 'skipped' : ''}`}
            style={{ '--habit-color': h.color } as React.CSSProperties}
            onClick={() => toggleCheckIn(h.id, date)}
          >
            {h.icon && <span className="habit-today-icon">{h.icon}</span>}
            <span className="habit-today-dot" />
            <span className="habit-today-name">{h.name}</span>
            {status === 'done' && <span className="habit-today-check">DONE</span>}
            {status === 'skip' && <span className="habit-today-check habit-today-skip">SKIP</span>}
          </button>
          <button type="button" className="habit-action-btn habit-skip-btn" title="标记跳过" onClick={() => skipCheckIn(h.id, date)}>⊘</button>
          <button type="button" className="habit-action-btn habit-note-btn" title="备注" onClick={() => setNoteExpanded(isNoteOpen ? null : `${h.id}-${date}`)}>
            {note ? '📝' : '✎'}
          </button>
        </div>
        {isNoteOpen && (
          <input
            type="text"
            className="habit-note-input"
            placeholder="添加打卡备注…"
            value={note}
            onChange={e => setCheckInNote(h.id, date, e.target.value)}
          />
        )}
      </div>
    )
  }

  return (
    <section className="panel daily">
      <h2 className="panel-title">DAILY_CHECK // 今日打卡</h2>
      <p className="panel-desc panel-desc-date">{formatTodayWithWeekday(todayDate)}</p>
      {habits.length > 0 ? (
        <p className="panel-desc">
          {dailyDueToday.length > 0 && <>今日应打 {dayStat.total} 项 · 已完成 {dayStat.completed} · {dayStat.percent}%</>}
          {dailyDueToday.length > 0 && special.length > 0 && ' · '}
          {special.length > 0 && <>特殊习惯：{special.reduce((s, h) => s + getSpecialCount(h.id, today), 0)} 次</>}
        </p>
      ) : (
        <div className="empty-state">
          <span className="empty-state-icon">▣</span>
          <p className="empty-state-text">还没有添加任何习惯</p>
          {onGoManage && <button type="button" className="empty-state-btn" onClick={onGoManage}>⚙ 去添加习惯</button>}
        </div>
      )}

      {dailyDueToday.length > 0 && (
        <div className="habit-today-block">
          <h3 className="habit-block-title">今日习惯</h3>
          <p className="memo-hint">点击切换完成 · ⊘ 跳过 · ✎ 备注</p>
          {Object.entries(groupedDaily).map(([group, hs]) => (
            <div key={group} className="habit-group-section">
              {Object.keys(groupedDaily).length > 1 && (
                <div className="habit-group-header">{group}</div>
              )}
              <div className="habit-today-list">
                {hs.map(h => renderHabitItem(h, today))}
              </div>
            </div>
          ))}
        </div>
      )}

      {special.length > 0 && (
        <div className="habit-today-block habit-special-block">
          <h3 className="habit-block-title">特殊习惯</h3>
          <div className="habit-today-list habit-special-list">
            {special.map(h => {
              const count = getSpecialCount(h.id, today)
              return (
                <div key={h.id} className="habit-special-item">
                  {h.icon && <span className="habit-today-icon">{h.icon}</span>}
                  <span className="habit-today-dot" style={{ background: h.color }} />
                  <span className="habit-today-name" style={{ color: h.color }}>{h.name}</span>
                  <span className="habit-special-count">今日 {count} 次</span>
                  <button type="button" className="btn btn-sm btn-primary" onClick={() => addSpecialCheckIn(h.id, today)}>＋</button>
                  {count > 0 && <button type="button" className="btn btn-sm btn-ghost" onClick={() => removeOneSpecialCheckIn(h.id, today)}>－</button>}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Timer */}
      <div className="timer-toggle-block">
        <button type="button" className="btn btn-sm btn-ghost" onClick={() => setShowTimer(!showTimer)}>
          {showTimer ? '▼ 隐藏计时器' : '▶ 专注计时器'}
        </button>
        {showTimer && <HabitTimer />}
      </div>

      {/* Mood */}
      <div className="mood-block">
        <h3 className="habit-block-title">今日心情</h3>
        <div className="mood-options">
          {([1, 2, 3, 4, 5] as const).map(v => (
            <button key={v} type="button" className={`mood-option ${getMood(today) === v ? 'active' : ''}`}
              onClick={() => setMood(today, getMood(today) === v ? 0 : v)} title={MOOD_LABELS[v]}>
              <span className="mood-option-value">{MOOD_EMOJIS[v]}</span>
              <span className="mood-option-label">{MOOD_LABELS[v]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Memo */}
      <div className="memo-block">
        <h3 className="habit-block-title">今日备忘</h3>
        <textarea className="memo-textarea" placeholder="记录今天的特别事…" value={getMemo(today)} onChange={e => setMemo(today, e.target.value)} rows={3} />
      </div>

      {/* Period tables */}
      {habits.length > 0 && (
        <div className="period-tables">
          {daily.length > 0 && (
            <>
              <PeriodTable title="本周进度" dateRange={weekRangeStr} stat={weekStat} habits={daily} checkIns={checkIns} dates={weekDates} />
              <PeriodTable title="本月进度" dateRange={monthRangeStr} stat={monthStat} habits={daily} checkIns={checkIns} dates={monthDates} />
              <PeriodTable title="本年进度" dateRange={yearRangeStr} stat={yearStat} habits={daily} checkIns={checkIns} dates={yearDates} />
            </>
          )}
          {special.length > 0 && (
            <>
              <SpecialPeriodTable title="特殊 · 本周" dateRange={weekRangeStr} stats={specialWeek} />
              <SpecialPeriodTable title="特殊 · 本月" dateRange={monthRangeStr} stats={specialMonth} />
              <SpecialPeriodTable title="特殊 · 本年" dateRange={yearRangeStr} stats={specialYear} />
            </>
          )}
        </div>
      )}

      {/* Date review */}
      <div className="review-day-block">
        <h3 className="habit-block-title">日期回顾</h3>
        <div className="review-day-picker">
          <input id="review-date" type="date" className="review-date-input" value={reviewDate} min={(() => { const d = new Date(); d.setFullYear(d.getFullYear() - 1); return d.toISOString().slice(0, 10) })()} max={today} onChange={e => setReviewDate(e.target.value)} />
        </div>
        {reviewDate && (() => {
          const d = parseDate(reviewDate)
          const isToday = reviewDate === today
          const thatDayStat = getDayStats(habits, checkIns, reviewDate)
          const dailyDueThat = daily.filter(h => isHabitDueOn(h, reviewDate))
          return (
            <div className="review-day-card">
              <p className="review-day-date">{formatTodayWithWeekday(d)}{isToday && <span className="review-today-badge">今天</span>}</p>
              <p className="review-day-summary">应打 {thatDayStat.total} · 完成 {thatDayStat.completed}</p>
              {dailyDueThat.length > 0 && (
                <div className="review-checkin-block">
                  <div className="review-checkin-list">
                    {dailyDueThat.map(h => renderHabitItem(h, reviewDate))}
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
                          <span style={{ color: h.color }}>{h.icon ? `${h.icon} ` : ''}{h.name}</span>
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
                <label>当天心情</label>
                <div className="mood-options mood-options-inline">
                  {([1, 2, 3, 4, 5] as const).map(v => (
                    <button key={v} type="button" className={`mood-option ${getMood(reviewDate) === v ? 'active' : ''}`}
                      onClick={() => setMood(reviewDate, getMood(reviewDate) === v ? 0 : v)} title={MOOD_LABELS[v]}>
                      <span className="mood-option-value">{MOOD_EMOJIS[v]}</span>
                      <span className="mood-option-label">{MOOD_LABELS[v]}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="review-day-memo">
                <label>当天备忘</label>
                <textarea className="memo-textarea" value={getMemo(reviewDate)} onChange={e => setMemo(reviewDate, e.target.value)} rows={2} />
              </div>
            </div>
          )
        })()}
      </div>
    </section>
  )
}
