import { useState, useEffect, useRef } from 'react'
import type { Habit, HabitType, HabitFrequency, FrequencyType } from '../types'
import { DEFAULT_COLORS, HABIT_ICONS, HABIT_GROUPS } from '../types'

const WEEKDAY_SHORT = ['日', '一', '二', '三', '四', '五', '六']
const FREQ_TYPES: { value: FrequencyType; label: string }[] = [
  { value: 'daily', label: '每天' },
  { value: 'weekdays', label: '指定周几' },
  { value: 'interval', label: '每N天' },
]

const HABIT_TYPES: { value: HabitType; label: string }[] = [
  { value: 'basic', label: '基础' },
  { value: 'advanced', label: '进阶' },
  { value: 'special', label: '特殊' },
]

const TEMPLATES: { name: string; type: HabitType; color: string }[] = [
  { name: '晨跑', type: 'basic', color: '#10b981' },
  { name: '阅读 30 分钟', type: 'basic', color: '#0ea5e9' },
  { name: '早睡（23:00前）', type: 'basic', color: '#8b5cf6' },
  { name: '喝 8 杯水', type: 'basic', color: '#06b6d4' },
  { name: '冥想', type: 'advanced', color: '#ec4899' },
  { name: '写日记', type: 'advanced', color: '#f59e0b' },
  { name: '健身', type: 'special', color: '#ef4444' },
  { name: '学英语', type: 'special', color: '#84cc16' },
]

interface HabitManageProps {
  habits: Habit[]
  addHabit: (name: string, color: string, type: HabitType) => void
  updateHabit: (id: string, updates: Partial<Pick<Habit, 'name' | 'color' | 'type' | 'icon' | 'group' | 'frequency' | 'goalPerWeek' | 'goalPerMonth'>>) => void
  removeHabit: (id: string) => void
  moveHabit: (id: string, direction: 'up' | 'down') => void
  archiveHabit: (id: string) => void
  unarchiveHabit: (id: string) => void
}

export function HabitManage({
  habits,
  addHabit,
  updateHabit,
  removeHabit,
  moveHabit,
  archiveHabit,
  unarchiveHabit,
}: HabitManageProps) {
  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState(DEFAULT_COLORS[0])
  const [newType, setNewType] = useState<HabitType>('basic')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editColor, setEditColor] = useState('')
  const [editType, setEditType] = useState<HabitType>('basic')
  const [editGoalWeek, setEditGoalWeek] = useState(0)
  const [editGoalMonth, setEditGoalMonth] = useState(0)
  const [editIcon, setEditIcon] = useState('')
  const [editGroup, setEditGroup] = useState('')
  const [editFreqType, setEditFreqType] = useState<FrequencyType>('daily')
  const [editWeekdays, setEditWeekdays] = useState<number[]>([])
  const [editInterval, setEditInterval] = useState(2)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [showArchived, setShowArchived] = useState(false)
  const [showTemplates, setShowTemplates] = useState(false)
  const deleteTimerRef = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => {
    return () => { clearTimeout(deleteTimerRef.current) }
  }, [])

  const activeHabits = habits.filter(h => !h.archived)
  const archivedHabits = habits.filter(h => h.archived)

  const handleAdd = () => {
    const name = newName.trim()
    if (!name) return
    addHabit(name, newColor, newType)
    setNewName('')
    setNewColor(DEFAULT_COLORS[(DEFAULT_COLORS.indexOf(newColor) + 1) % DEFAULT_COLORS.length])
  }

  const addFromTemplate = (tpl: typeof TEMPLATES[number]) => {
    if (habits.some(h => h.name === tpl.name && !h.archived)) return
    addHabit(tpl.name, tpl.color, tpl.type)
  }

  const startEdit = (h: Habit) => {
    setEditingId(h.id)
    setEditName(h.name)
    setEditColor(h.color)
    setEditType(h.type)
    setEditGoalWeek(h.goalPerWeek ?? 0)
    setEditGoalMonth(h.goalPerMonth ?? 0)
    setEditIcon(h.icon ?? '')
    setEditGroup(h.group ?? '')
    setEditFreqType(h.frequency?.type ?? 'daily')
    setEditWeekdays(h.frequency?.weekdays ?? [])
    setEditInterval(h.frequency?.intervalDays ?? 2)
  }

  const saveEdit = () => {
    if (editingId && editName.trim()) {
      const freq: HabitFrequency | undefined =
        editType !== 'special' && editFreqType !== 'daily'
          ? { type: editFreqType, weekdays: editFreqType === 'weekdays' ? editWeekdays : undefined, intervalDays: editFreqType === 'interval' ? editInterval : undefined }
          : undefined
      updateHabit(editingId, {
        name: editName.trim(),
        color: editColor,
        type: editType,
        icon: editIcon || undefined,
        group: editGroup || undefined,
        frequency: freq,
        goalPerWeek: editType === 'special' && editGoalWeek > 0 ? editGoalWeek : undefined,
        goalPerMonth: editType === 'special' && editGoalMonth > 0 ? editGoalMonth : undefined,
      })
      setEditingId(null)
    }
  }

  const handleDelete = (id: string) => {
    if (confirmDeleteId === id) {
      removeHabit(id)
      setConfirmDeleteId(null)
      clearTimeout(deleteTimerRef.current)
    } else {
      setConfirmDeleteId(id)
      clearTimeout(deleteTimerRef.current)
      deleteTimerRef.current = setTimeout(
        () => setConfirmDeleteId(prev => prev === id ? null : prev),
        3000
      )
    }
  }

  const renderHabitItem = (h: Habit, idx: number, list: Habit[]) => (
    <li key={h.id} className={`habit-list-item ${editingId === h.id ? 'editing' : ''}`}>
      {editingId === h.id ? (
        <div className="habit-edit-form">
          <div className="habit-edit-row">
            <input
              type="text"
              className="habit-edit-input"
              value={editName}
              onChange={e => setEditName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && saveEdit()}
              autoFocus
            />
          </div>
          <div className="habit-edit-row">
            <span className="habit-edit-label">类型</span>
            <div className="habit-type-select">
              {HABIT_TYPES.map(t => (
                <button
                  key={t.value}
                  type="button"
                  className={`habit-type-btn ${editType === t.value ? 'active' : ''}`}
                  onClick={() => setEditType(t.value)}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          <div className="habit-edit-row">
            <span className="habit-edit-label">图标</span>
            <div className="habit-icon-select">
              <button type="button" className={`habit-icon-btn ${!editIcon ? 'active' : ''}`} onClick={() => setEditIcon('')}>无</button>
              {HABIT_ICONS.map(ic => (
                <button key={ic} type="button" className={`habit-icon-btn ${editIcon === ic ? 'active' : ''}`} onClick={() => setEditIcon(ic)}>{ic}</button>
              ))}
            </div>
          </div>
          <div className="habit-edit-row">
            <span className="habit-edit-label">分组</span>
            <div className="habit-group-select">
              <button type="button" className={`habit-type-btn ${!editGroup ? 'active' : ''}`} onClick={() => setEditGroup('')}>无</button>
              {HABIT_GROUPS.map(g => (
                <button key={g} type="button" className={`habit-type-btn ${editGroup === g ? 'active' : ''}`} onClick={() => setEditGroup(g)}>{g}</button>
              ))}
            </div>
          </div>
          {editType !== 'special' && (
            <div className="habit-edit-row">
              <span className="habit-edit-label">频率</span>
              <div className="habit-freq-select">
                {FREQ_TYPES.map(f => (
                  <button key={f.value} type="button" className={`habit-type-btn ${editFreqType === f.value ? 'active' : ''}`} onClick={() => setEditFreqType(f.value)}>{f.label}</button>
                ))}
              </div>
              {editFreqType === 'weekdays' && (
                <div className="habit-weekday-select">
                  {WEEKDAY_SHORT.map((d, i) => (
                    <button key={i} type="button" className={`weekday-btn ${editWeekdays.includes(i) ? 'active' : ''}`}
                      onClick={() => setEditWeekdays(prev => prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i])}>{d}</button>
                  ))}
                </div>
              )}
              {editFreqType === 'interval' && (
                <label className="goal-input-wrap">
                  <span>每</span>
                  <input type="number" min={2} max={30} className="goal-input" value={editInterval} onChange={e => setEditInterval(Math.max(2, parseInt(e.target.value) || 2))} />
                  <span>天</span>
                </label>
              )}
            </div>
          )}
          {editType === 'special' && (
            <div className="habit-edit-row">
              <span className="habit-edit-label">目标</span>
              <div className="habit-goal-inputs">
                <label className="goal-input-wrap">
                  <input type="number" min={0} max={99} className="goal-input" value={editGoalWeek || ''} placeholder="0"
                    onChange={e => setEditGoalWeek(Math.max(0, parseInt(e.target.value) || 0))} />
                  <span>次/周</span>
                </label>
                <label className="goal-input-wrap">
                  <input type="number" min={0} max={999} className="goal-input" value={editGoalMonth || ''} placeholder="0"
                    onChange={e => setEditGoalMonth(Math.max(0, parseInt(e.target.value) || 0))} />
                  <span>次/月</span>
                </label>
              </div>
            </div>
          )}
          <div className="habit-edit-row">
            <span className="habit-edit-label">颜色</span>
            <div className="habit-add-colors">
              {DEFAULT_COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  className={`habit-color-dot ${c === editColor ? 'active' : ''}`}
                  style={{ background: c }}
                  onClick={() => setEditColor(c)}
                  aria-label="选择颜色"
                />
              ))}
            </div>
          </div>
          <div className="habit-edit-actions">
            <button type="button" className="btn btn-sm btn-primary" onClick={saveEdit}>
              保存
            </button>
            <button type="button" className="btn btn-sm btn-ghost" onClick={() => setEditingId(null)}>
              取消
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="habit-list-sort-btns">
            <button type="button" className="sort-btn" disabled={idx === 0}
              onClick={() => moveHabit(h.id, 'up')} title="上移">▲</button>
            <button type="button" className="sort-btn" disabled={idx === list.length - 1}
              onClick={() => moveHabit(h.id, 'down')} title="下移">▼</button>
          </div>
          <span className="habit-list-dot" style={{ background: h.color }}>{h.icon || ''}</span>
          <span className="habit-list-name" onClick={() => startEdit(h)}>{h.name}</span>
          {h.group && <span className="habit-list-group">{h.group}</span>}
          {h.frequency && h.frequency.type !== 'daily' && (
            <span className="habit-list-freq">
              {h.frequency.type === 'weekdays' ? (h.frequency.weekdays ?? []).map(d => WEEKDAY_SHORT[d]).join('') : `每${h.frequency.intervalDays}天`}
            </span>
          )}
          {h.type === 'special' && (h.goalPerWeek || h.goalPerMonth) && (
            <span className="habit-list-goal">
              {h.goalPerWeek ? `${h.goalPerWeek}次/周` : ''}{h.goalPerWeek && h.goalPerMonth ? ' · ' : ''}{h.goalPerMonth ? `${h.goalPerMonth}次/月` : ''}
            </span>
          )}
          <span className={`habit-list-type habit-list-type-${h.type}`}>
            {HABIT_TYPES.find(t => t.value === h.type)?.label ?? h.type}
          </span>
          {!h.archived && (
            <button type="button" className="btn btn-sm btn-ghost" onClick={() => archiveHabit(h.id)} title="归档">
              归档
            </button>
          )}
          {h.archived && (
            <button type="button" className="btn btn-sm btn-primary" onClick={() => unarchiveHabit(h.id)}>
              恢复
            </button>
          )}
          <button
            type="button"
            className={`btn btn-sm btn-ghost danger ${confirmDeleteId === h.id ? 'confirm-danger' : ''}`}
            onClick={() => handleDelete(h.id)}
          >
            {confirmDeleteId === h.id ? '确认删除？' : '删除'}
          </button>
        </>
      )}
    </li>
  )

  return (
    <section className="panel habits">
      <h2 className="panel-title">CONFIG // 习惯管理</h2>
      <p className="panel-desc">添加习惯时可选择类型：基础/进阶为每日打卡，特殊为按周期看执行次数</p>

      <div className="habit-add">
        <input
          type="text"
          className="habit-add-input"
          placeholder="输入习惯名称，如：晨跑、阅读、早睡"
          value={newName}
          onChange={e => setNewName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAdd()}
        />
        <div className="habit-type-select">
          {HABIT_TYPES.map(t => (
            <button
              key={t.value}
              type="button"
              className={`habit-type-btn ${newType === t.value ? 'active' : ''}`}
              onClick={() => setNewType(t.value)}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="habit-add-colors">
          {DEFAULT_COLORS.map(c => (
            <button
              key={c}
              type="button"
              className={`habit-color-dot ${c === newColor ? 'active' : ''}`}
              style={{ background: c }}
              onClick={() => setNewColor(c)}
              aria-label="选择颜色"
            />
          ))}
        </div>
        <details className="habit-add-more">
          <summary className="habit-add-more-toggle">更多选项（图标/分组）</summary>
          <div className="habit-add-more-body">
            <div className="habit-edit-row">
              <span className="habit-edit-label">图标</span>
              <div className="habit-icon-select">
                {HABIT_ICONS.map(ic => (
                  <button key={ic} type="button" className="habit-icon-btn" onClick={() => {
                    const name = newName.trim()
                    if (name) { addHabit(name, newColor, newType); setNewName('') }
                  }}>{ic}</button>
                ))}
              </div>
            </div>
          </div>
        </details>
        <div className="habit-add-actions">
          <button type="button" className="btn btn-primary" onClick={handleAdd}>
            添加习惯
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => setShowTemplates(!showTemplates)}>
            {showTemplates ? '收起模板' : '快捷模板'}
          </button>
        </div>
      </div>

      {showTemplates && (
        <div className="habit-templates">
          <p className="memo-hint">点击即可快速添加预设习惯</p>
          <div className="habit-template-list">
            {TEMPLATES.map(tpl => {
              const exists = habits.some(h => h.name === tpl.name && !h.archived)
              return (
                <button key={tpl.name} type="button"
                  className={`habit-template-chip ${exists ? 'exists' : ''}`}
                  style={{ '--habit-color': tpl.color } as React.CSSProperties}
                  onClick={() => addFromTemplate(tpl)}
                  disabled={exists}
                >
                  <span className="habit-template-dot" style={{ background: tpl.color }} />
                  {tpl.name}
                  <span className="habit-template-type">{HABIT_TYPES.find(t => t.value === tpl.type)?.label}</span>
                  {exists && <span className="habit-template-added">已添加</span>}
                </button>
              )
            })}
          </div>
        </div>
      )}

      <ul className="habit-list">
        {activeHabits.map((h, i) => renderHabitItem(h, i, activeHabits))}
      </ul>
      {activeHabits.length === 0 && (
        <p className="empty-hint">暂无活跃习惯，请在上方添加</p>
      )}

      {archivedHabits.length > 0 && (
        <div className="archived-section">
          <button type="button" className="btn btn-sm btn-ghost archived-toggle"
            onClick={() => setShowArchived(!showArchived)}>
            {showArchived ? '▼' : '▶'} 已归档（{archivedHabits.length}）
          </button>
          {showArchived && (
            <ul className="habit-list habit-list-archived">
              {archivedHabits.map((h, i) => renderHabitItem(h, i, archivedHabits))}
            </ul>
          )}
        </div>
      )}
    </section>
  )
}
