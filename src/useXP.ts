import { useState, useEffect, useCallback, useRef } from 'react'
import type { XPState } from './types'
import { STORAGE_XP } from './types'
import { useSync } from './SyncContext'

function loadXP(): XPState {
  try {
    const raw = localStorage.getItem(STORAGE_XP)
    if (raw) {
      const parsed = JSON.parse(raw) as XPState
      if (typeof parsed.total === 'number') return parsed
    }
  } catch (_) {}
  return { total: 0 }
}

export function useXP() {
  const { syncToCloud, subscribe } = useSync()
  const isFromCloud = useRef(false)

  const [xp, setXp] = useState<XPState>(() => loadXP())

  useEffect(() => {
    return subscribe('xp', (value: XPState) => {
      isFromCloud.current = true
      setXp(value)
    })
  }, [subscribe])

  useEffect(() => {
    localStorage.setItem(STORAGE_XP, JSON.stringify(xp))
    if (isFromCloud.current) {
      isFromCloud.current = false
    } else {
      syncToCloud('xp', xp)
    }
  }, [xp, syncToCloud])

  const addXP = useCallback((amount: number) => {
    setXp(prev => ({ total: Math.max(0, prev.total + amount) }))
  }, [])

  const refresh = useCallback(() => {
    setXp(loadXP())
  }, [])

  return { xp, addXP, refresh }
}
