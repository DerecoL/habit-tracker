import { useState, useRef } from 'react'
import { STORAGE_HABITS, STORAGE_CHECKINS, STORAGE_MEMOS, STORAGE_DAILY_MOOD, STORAGE_XP, STORAGE_BADGES, STORAGE_REWARDS, STORAGE_FREEZES } from '../types'

const ALL_KEYS = [STORAGE_HABITS, STORAGE_CHECKINS, STORAGE_MEMOS, STORAGE_DAILY_MOOD, STORAGE_XP, STORAGE_BADGES, STORAGE_REWARDS, STORAGE_FREEZES] as const

interface DataManagerProps {
  onImported: () => void
  habits?: { id: string; name: string; type: string }[]
  checkIns?: { habitId: string; date: string; status?: string; note?: string }[]
}

export function DataManager({ onImported, habits, checkIns }: DataManagerProps) {
  const [importStatus, setImportStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [statusMsg, setStatusMsg] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const handleExport = () => {
    const data: Record<string, unknown> = {}
    for (const key of ALL_KEYS) {
      const raw = localStorage.getItem(key)
      if (raw) {
        try { data[key] = JSON.parse(raw) } catch { data[key] = raw }
      }
    }
    data._exportedAt = new Date().toISOString()
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `habit-tracker-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!window.confirm('导入将覆盖当前所有数据（包括已同步的数据），确定继续吗？')) {
      if (fileRef.current) fileRef.current.value = ''
      return
    }
    setImportStatus('loading')
    setStatusMsg('正在导入…')
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result as string)
        if (typeof data !== 'object' || data === null) throw new Error('格式错误')
        const validators: Record<string, (v: unknown) => boolean> = {
          [STORAGE_HABITS]: v => Array.isArray(v),
          [STORAGE_CHECKINS]: v => Array.isArray(v),
          [STORAGE_MEMOS]: v => typeof v === 'object' && v !== null && !Array.isArray(v),
          [STORAGE_DAILY_MOOD]: v => typeof v === 'object' && v !== null && !Array.isArray(v),
          [STORAGE_XP]: v => typeof v === 'object' && v !== null,
          [STORAGE_BADGES]: v => Array.isArray(v),
          [STORAGE_REWARDS]: v => Array.isArray(v),
          [STORAGE_FREEZES]: v => typeof v === 'object' && v !== null,
        }
        let restored = 0
        for (const key of ALL_KEYS) {
          if (key in data) {
            const validate = validators[key]
            if (validate && !validate(data[key])) {
              throw new Error(`数据项 "${key}" 格式不合法`)
            }
            localStorage.setItem(key, JSON.stringify(data[key]))
            restored++
          }
        }
        if (restored === 0) throw new Error('文件中未找到有效数据')
        setImportStatus('success')
        setStatusMsg(`成功导入 ${restored} 项数据`)
        onImported()
      } catch (err) {
        setImportStatus('error')
        setStatusMsg(err instanceof Error ? err.message : '导入失败')
      }
    }
    reader.readAsText(file)
    if (fileRef.current) fileRef.current.value = ''
  }

  return (
    <div className="data-manager">
      <h3 className="habit-block-title">数据管理</h3>
      <p className="memo-hint">导出数据作为备份，或从备份文件恢复数据（导入会覆盖当前数据）</p>
      <div className="data-manager-actions">
        <button type="button" className="btn btn-primary btn-sm" onClick={handleExport}>
          导出 JSON
        </button>
        {habits && checkIns && (
          <button type="button" className="btn btn-sm btn-ghost" onClick={() => {
            const nameMap = new Map(habits.map(h => [h.id, h.name]))
            const rows = [['日期', '习惯', '类型', '状态', '备注'].join(',')]
            for (const c of checkIns) {
              rows.push([c.date, nameMap.get(c.habitId) ?? c.habitId, habits.find(h => h.id === c.habitId)?.type ?? '', c.status ?? 'done', `"${(c.note ?? '').replace(/\r?\n/g, ' ').replace(/"/g, '""')}"`].join(','))
            }
            const bom = '\uFEFF'
            const blob = new Blob([bom + rows.join('\n')], { type: 'text/csv;charset=utf-8' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url; a.download = `habit-tracker-${new Date().toISOString().slice(0, 10)}.csv`; a.click()
            URL.revokeObjectURL(url)
          }}>导出 CSV</button>
        )}
        <label className={`btn btn-sm btn-ghost data-import-btn ${importStatus === 'loading' ? 'disabled' : ''}`}>
          {importStatus === 'loading' ? '导入中…' : '导入数据'}
          <input
            ref={fileRef}
            type="file"
            accept=".json"
            onChange={handleImport}
            hidden
            disabled={importStatus === 'loading'}
          />
        </label>
      </div>
      {importStatus !== 'idle' && (
        <p className={`data-manager-status ${importStatus}`}>{statusMsg}</p>
      )}
    </div>
  )
}
