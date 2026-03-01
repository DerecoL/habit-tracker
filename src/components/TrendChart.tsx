import { useState, useMemo, useEffect } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import {
  getTrendDataMulti,
  getTrendSeriesConfig,
  dailyHabits,
  type TrendViewMode,
} from '../stats'
import { parseDate, formatNaturalDate, formatWeekday } from '../dateUtils'
import type { Habit, CheckIn } from '../types'

interface TrendChartProps {
  habits: Habit[]
  checkIns: CheckIn[]
  days?: number
}

export function TrendChart({ habits, checkIns, days = 30 }: TrendChartProps) {
  const [viewMode, setViewMode] = useState<TrendViewMode>('overall')
  const [selectedHabitIds, setSelectedHabitIds] = useState<string[]>(() =>
    dailyHabits(habits).map(h => h.id)
  )

  const daily = useMemo(() => dailyHabits(habits), [habits])

  useEffect(() => {
    setSelectedHabitIds(prev => {
      const currentIds = new Set(prev)
      const allIds = daily.map(h => h.id)
      const newIds = allIds.filter(id => !currentIds.has(id))
      return newIds.length > 0 ? [...prev, ...newIds] : prev
    })
  }, [daily])

  const series = useMemo(
    () => getTrendSeriesConfig(habits, viewMode, selectedHabitIds),
    [habits, viewMode, selectedHabitIds]
  )
  const data = useMemo(
    () => getTrendDataMulti(habits, checkIns, days, series),
    [habits, checkIns, days, series]
  )

  const hasAnyData = data.length > 0 && series.some(s => data.some(d => Number(d[s.dataKey]) > 0))
  const isEmpty = habits.length === 0 || series.length === 0

  const toggleHabit = (id: string) => {
    setSelectedHabitIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }
  const selectAllHabits = () => setSelectedHabitIds(daily.map(h => h.id))
  const clearAllHabits = () => setSelectedHabitIds([])

  return (
    <section className="panel trend">
      <h2 className="panel-title">ANALYTICS // 趋势曲线</h2>
      <p className="panel-desc">
        最近 {days} 天完成率变化，可切换「整体 / 按类型 / 按习惯」查看不同维度的曲线
      </p>

      {daily.length > 0 && (
        <div className="trend-filters">
          <div className="trend-filter-tabs">
            {(
              [
                { mode: 'overall' as const, label: '整体' },
                { mode: 'byType' as const, label: '按类型' },
                { mode: 'byHabit' as const, label: '按习惯' },
              ] as const
            ).map(({ mode, label }) => (
              <button
                key={mode}
                type="button"
                className={`trend-filter-tab ${viewMode === mode ? 'active' : ''}`}
                onClick={() => setViewMode(mode)}
              >
                {label}
              </button>
            ))}
          </div>
          {viewMode === 'byHabit' && (
            <div className="trend-habit-checkboxes">
              <span className="trend-habit-actions">
                <button type="button" className="trend-habit-btn" onClick={selectAllHabits}>
                  全选
                </button>
                <button type="button" className="trend-habit-btn" onClick={clearAllHabits}>
                  清空
                </button>
              </span>
              {daily.map(h => (
                <label key={h.id} className="trend-habit-chip">
                  <input
                    type="checkbox"
                    checked={selectedHabitIds.includes(h.id)}
                    onChange={() => toggleHabit(h.id)}
                  />
                  <span className="trend-habit-chip-color" style={{ background: h.color }} />
                  <span>{h.name}</span>
                </label>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="chart-wrap">
        {habits.length === 0 ? (
          <p className="empty-hint">添加习惯并打卡后即可看到趋势</p>
        ) : isEmpty ? (
          <p className="empty-hint">
            {viewMode === 'byHabit' && selectedHabitIds.length === 0
              ? '请至少勾选一个习惯'
              : '暂无每日习惯，仅基础/进阶习惯参与趋势'}
          </p>
        ) : !hasAnyData ? (
          <p className="empty-hint">暂无打卡数据，完成打卡后曲线会显示在这里</p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--grid-stroke, #334155)" />
              <XAxis
                dataKey="date"
                stroke="var(--chart-muted, #94a3b8)"
                tick={{ fill: 'var(--chart-muted)', fontSize: 11 }}
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
                tick={{ fill: 'var(--chart-muted)', fontSize: 11 }}
                domain={[0, 100]}
                tickFormatter={v => `${v}%`}
              />
              <Tooltip
                contentStyle={{
                  background: 'var(--tooltip-bg, #1e293b)',
                  border: '1px solid var(--border, #334155)',
                  borderRadius: '8px',
                }}
                labelStyle={{ color: 'var(--text, #f1f5f9)' }}
                formatter={(value: number, name: string) => [
                  `${value}%`,
                  series.find(s => s.dataKey === name)?.name ?? name,
                ]}
                labelFormatter={label => {
                  try {
                    const d = parseDate(String(label))
                    return `${formatNaturalDate(d)} ${formatWeekday(d)}`
                  } catch {
                    return `日期: ${label}`
                  }
                }}
              />
              <Legend
                wrapperStyle={{ paddingTop: 8 }}
                formatter={(value) => series.find(s => s.dataKey === value)?.name ?? value}
                iconType="line"
                iconSize={10}
              />
              {series.map(s => (
                <Line
                  key={s.dataKey}
                  type="monotone"
                  dataKey={s.dataKey}
                  name={s.dataKey}
                  stroke={s.color}
                  strokeWidth={2}
                  dot={{ fill: s.color, r: 3 }}
                  activeDot={{ r: 5 }}
                  connectNulls
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </section>
  )
}
