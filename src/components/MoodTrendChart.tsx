import { useMemo } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { dateRange, parseDate, formatNaturalDate, formatWeekday } from '../dateUtils'
import { MOOD_LABELS } from '../types'

interface MoodTrendChartProps {
  getMood: (date: string) => number
  days?: number
}

export function MoodTrendChart({ getMood, days = 14 }: MoodTrendChartProps) {
  const { data, hasAny } = useMemo(() => {
    const end = new Date()
    const start = new Date(end)
    start.setDate(start.getDate() - (days - 1))
    start.setHours(0, 0, 0, 0)
    end.setHours(23, 59, 59, 999)
    const dates = dateRange(start, end)
    const data = dates.map(date => {
      const v = getMood(date)
      return { date, mood: v >= 1 && v <= 5 ? v : null }
    })
    const hasAny = data.some(d => d.mood != null)
    return { data, hasAny }
  }, [getMood, days])

  return (
    <div className="mood-trend-wrap">
      <h3 className="dashboard-section-title">心情变化</h3>
      <div className="chart-wrap chart-wrap-mood">
        {!hasAny ? (
          <p className="empty-hint">在「今日打卡」或日期回顾中记录开心程度后，这里会显示最近 {days} 天的变化曲线</p>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--grid-stroke, #334155)" />
              <XAxis
                dataKey="date"
                stroke="var(--chart-muted, #94a3b8)"
                tick={{ fill: 'var(--chart-muted, #94a3b8)', fontSize: 11 }}
                tickFormatter={v => {
                  try {
                    const d = parseDate(String(v))
                    return `${d.getMonth() + 1}/${d.getDate()}`
                  } catch {
                    return String(v).slice(5)
                  }
                }}
              />
              <YAxis
                stroke="var(--chart-muted, #94a3b8)"
                tick={{ fill: 'var(--chart-muted, #94a3b8)', fontSize: 11 }}
                domain={[1, 5]}
                ticks={[1, 2, 3, 4, 5]}
                tickFormatter={v => MOOD_LABELS[v] ?? String(v)}
                width={48}
              />
              <Tooltip
                contentStyle={{
                  background: 'var(--tooltip-bg, #1e293b)',
                  border: '1px solid var(--border, #334155)',
                  borderRadius: '8px',
                }}
                labelStyle={{ color: 'var(--text, #f1f5f9)' }}
                formatter={(value) => [value != null ? MOOD_LABELS[value as number] ?? value : '未记录', '开心程度']}
                labelFormatter={label => {
                  try {
                    const d = parseDate(String(label))
                    return `${formatNaturalDate(d)} ${formatWeekday(d)}`
                  } catch {
                    return `日期: ${label}`
                  }
                }}
              />
              <Line
                type="monotone"
                dataKey="mood"
                stroke="var(--mood-line, #a78bfa)"
                strokeWidth={2}
                dot={{ fill: 'var(--mood-line, #a78bfa)', r: 3 }}
                activeDot={{ r: 5 }}
                connectNulls={false}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}
