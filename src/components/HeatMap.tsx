import { useMemo } from 'react'
import { dateRange, todayStr, parseDate, formatNaturalShort, formatWeekday } from '../dateUtils'
import { getDayStats, dailyHabits } from '../stats'
import type { Habit, CheckIn } from '../types'

const WEEKDAY_SHORT = ['一', '', '三', '', '五', '', '日']
const WEEKS = 16
const CELL_SIZE = 13
const GAP = 3
const COL_STEP = CELL_SIZE + GAP

function getCellColor(pct: number): { bg: string; glow: string } {
  if (pct === 0) return { bg: 'rgba(0, 240, 255, 0.04)', glow: 'transparent' }
  if (pct < 30) return { bg: 'rgba(0, 200, 220, 0.18)', glow: 'rgba(0, 240, 255, 0.1)' }
  if (pct < 60) return { bg: 'rgba(0, 220, 240, 0.35)', glow: 'rgba(0, 240, 255, 0.2)' }
  if (pct < 100) return { bg: 'rgba(0, 240, 255, 0.55)', glow: 'rgba(0, 240, 255, 0.3)' }
  return { bg: 'rgba(0, 240, 255, 0.80)', glow: 'rgba(0, 240, 255, 0.5)' }
}

interface HeatMapProps {
  habits: Habit[]
  checkIns: CheckIn[]
}

export function HeatMap({ habits, checkIns }: HeatMapProps) {
  const today = todayStr()
  const hasDailyHabits = dailyHabits(habits).length > 0

  const { cells, monthLabels, totalCols } = useMemo(() => {
    const end = new Date()
    const todayDay = end.getDay()
    const daysBack = (WEEKS - 1) * 7 + (todayDay === 0 ? 6 : todayDay - 1)
    const start = new Date(end)
    start.setDate(end.getDate() - daysBack)
    start.setHours(0, 0, 0, 0)

    const dates = dateRange(start, end)

    const startDow = start.getDay()
    const paddingBefore = startDow === 0 ? 6 : startDow - 1
    const padded: (string | null)[] = Array(paddingBefore).fill(null).concat(dates)

    const cells = padded.map(date => {
      if (!date) return { date: null, pct: -1, label: '' }
      const stat = getDayStats(habits, checkIns, date)
      const d = parseDate(date)
      const label = `${formatNaturalShort(d)} ${formatWeekday(d)} · ${stat.total > 0 ? `${stat.percent}%` : '无习惯'}`
      return { date, pct: stat.total > 0 ? stat.percent : -1, label }
    })

    const monthLabels: { label: string; col: number }[] = []
    let lastMonth = -1
    for (let i = 0; i < cells.length; i++) {
      const c = cells[i]
      if (!c.date) continue
      const d = parseDate(c.date)
      const m = d.getMonth()
      if (m !== lastMonth) {
        const col = Math.floor(i / 7)
        monthLabels.push({ label: `${m + 1}月`, col })
        lastMonth = m
      }
    }

    const totalCols = Math.ceil(cells.length / 7)
    return { cells, monthLabels, totalCols }
  }, [habits, checkIns])

  if (!hasDailyHabits) return null

  return (
    <div className="heatmap-section">
      <h3 className="dashboard-section-title">打卡热力图</h3>

      {/* month labels row */}
      <div className="heatmap-months-row">
        <div className="heatmap-weekday-spacer" />
        <div className="heatmap-months-track">
          {monthLabels.map((m, i) => (
            <span key={i} className="heatmap-month-label" style={{ left: m.col * COL_STEP }}>{m.label}</span>
          ))}
        </div>
      </div>

      {/* grid */}
      <div className="heatmap-body">
        <div className="heatmap-weekdays">
          {WEEKDAY_SHORT.map((d, i) => <span key={i}>{d}</span>)}
        </div>
        <div className="heatmap-grid-wrap">
          <div
            className="heatmap-grid"
            style={{ gridTemplateColumns: `repeat(${totalCols}, ${CELL_SIZE}px)` }}
          >
            {cells.map((c, i) => {
              if (!c.date) return <div key={i} className="heatmap-cell-empty" />
              const { bg, glow } = c.pct >= 0 ? getCellColor(c.pct) : { bg: 'rgba(0,240,255,0.04)', glow: 'transparent' }
              return (
                <div
                  key={i}
                  className="heatmap-cell"
                  data-today={c.date === today ? 'true' : undefined}
                  style={{ '--cell-bg': bg, '--cell-glow': glow } as React.CSSProperties}
                  title={c.label}
                />
              )
            })}
          </div>
        </div>
      </div>

      {/* legend */}
      <div className="heatmap-legend">
        <span>少</span>
        {[0, 25, 50, 80, 100].map(p => {
          const { bg } = getCellColor(p)
          return <div key={p} className="heatmap-legend-cell" style={{ background: bg }} />
        })}
        <span>多</span>
      </div>
    </div>
  )
}
