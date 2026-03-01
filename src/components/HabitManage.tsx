import { useState, useEffect, useRef } from 'react'
import type { Habit, HabitType } from '../types'
import { DEFAULT_COLORS } from '../types'

const HABIT_TYPES: { value: HabitType; label: string }[] = [
  { value: 'basic', label: '基础' },
  { value: 'advanced', label: '进阶' },
  { value: 'special', label: '特殊' },
]

interface HabitManageProps {
  habits: Habit[]
  addHabit: (name: string, color: string, type: HabitType) => void
  updateHabit: (id: string, updates: { name?: string; color?: string; type?: HabitType }) => void
  removeHabit: (id: string) => void
}

export function HabitManage({
  habits,
  addHabit,
  updateHabit,
  removeHabit,
}: HabitManageProps) {
  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState(DEFAULT_COLORS[0])
  const [newType, setNewType] = useState<HabitType>('basic')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editColor, setEditColor] = useState('')
  const [editType, setEditType] = useState<HabitType>('basic')
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const deleteTimerRef = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => {
    return () => { clearTimeout(deleteTimerRef.current) }
  }, [])

  const handleAdd = () => {
    const name = newName.trim()
    if (!name) return
    addHabit(name, newColor, newType)
    setNewName('')
    setNewColor(DEFAULT_COLORS[(DEFAULT_COLORS.indexOf(newColor) + 1) % DEFAULT_COLORS.length])
  }

  const startEdit = (h: Habit) => {
    setEditingId(h.id)
    setEditName(h.name)
    setEditColor(h.color)
    setEditType(h.type)
  }

  const saveEdit = () => {
    if (editingId && editName.trim()) {
      updateHabit(editingId, { name: editName.trim(), color: editColor, type: editType })
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
        <button type="button" className="btn btn-primary" onClick={handleAdd}>
          添加习惯
        </button>
      </div>

      <ul className="habit-list">
        {habits.map(h => (
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
                <span className="habit-list-dot" style={{ background: h.color }} />
                <span className="habit-list-name" onClick={() => startEdit(h)}>{h.name}</span>
                <span className={`habit-list-type habit-list-type-${h.type}`}>
                  {HABIT_TYPES.find(t => t.value === h.type)?.label ?? h.type}
                </span>
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
        ))}
      </ul>
      {habits.length === 0 && (
        <p className="empty-hint">暂无习惯，请在上方添加</p>
      )}
    </section>
  )
}
