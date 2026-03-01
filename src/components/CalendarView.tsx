import { useMemo, useState } from 'react'
import type { Habit, CheckIn } from '../types'
import { getBasicDayStats } from '../stats'
import { parseDate, getMonthRange, dateRange, dateStr } from '../dateUtils'

interface CalendarViewProps {
  habits: Habit[]
  checkIns: CheckIn[]
}

const WEEKDAYS = ['一', '二', '三', '四', '五', '六', '日']

export function CalendarView({ habits, checkIns }: CalendarViewProps) {
  const [month, setMonth] = useState(() => new Date())
  const todayStr = useMemo(() => dateStr(new Date()), [])

  const { grid, completedHabitsByDay, fullAttendanceDays } = useMemo(() => {
    const { start, end } = getMonthRange(month)
    const dates = dateRange(start, end)
    let firstDay = start.getDay()
    // Mon=0, Tue=1, ... Sun=6
    firstDay = firstDay === 0 ? 6 : firstDay - 1
    const pad: null[] = Array(firstDay).fill(null)
    const cells: (string | null)[] = [...pad, ...dates]

    const completedHabitsByDay: Record<string, string[]> = {}
    for (const d of dates) {
      const done: string[] = []
      for (const h of habits) {
        if (!h.archived && checkIns.some(c => c.habitId === h.id && c.date === d && c.status !== 'skip')) {
          done.push(h.color)
        }
      }
      completedHabitsByDay[d] = done
    }

    const fullAttendanceDays = new Set<string>()
    for (const d of dates) {
      const s = getBasicDayStats(habits, checkIns, d)
      if (s.total > 0 && s.completed === s.total) fullAttendanceDays.add(d)
    }

    return { grid: cells, completedHabitsByDay, fullAttendanceDays }
  }, [month, habits, checkIns])

  const prevMonth = () => setMonth(m => { const n = new Date(m); n.setMonth(n.getMonth() - 1); return n })
  const nextMonth = () => setMonth(m => { const n = new Date(m); n.setMonth(n.getMonth() + 1); return n })

  return (
    <div className="calendar-view">
      <h3 className="panel-title">日历视图</h3>
      <div className="cal-nav">
        <button type="button" onClick={prevMonth}>←</button>
        <span>{month.getFullYear()}年{month.getMonth() + 1}月</span>
        <button type="button" onClick={nextMonth}>→</button>
      </div>
      <div className="cal-weekdays">
        {WEEKDAYS.map(w => <div key={w} className="cal-weekday">{w}</div>)}
      </div>
      <div className="cal-grid">
        {grid.map((d, i) => {
          if (!d) return <div key={`p${i}`} className="cal-day cal-day-empty" />
          const dots = completedHabitsByDay[d] ?? []
          const isFull = fullAttendanceDays.has(d)
          const isToday = d === todayStr
          return (
            <div key={d} className={`cal-day${isFull ? ' cal-day-full' : ''}${isToday ? ' cal-day-today' : ''}`}>
              <span className="cal-day-num">{parseDate(d).getDate()}</span>
              <div className="cal-day-dots">
                {dots.slice(0, 5).map((c, j) => <span key={j} className="cal-day-dot" style={{ background: c }} />)}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
