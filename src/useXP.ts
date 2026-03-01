import { useState, useEffect, useCallback } from 'react'
import type { XPState } from './types'
import { STORAGE_XP } from './types'

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
  const [xp, setXp] = useState<XPState>(() => loadXP())

  useEffect(() => {
    localStorage.setItem(STORAGE_XP, JSON.stringify(xp))
  }, [xp])

  const addXP = useCallback((amount: number) => {
    setXp(prev => ({ total: prev.total + amount }))
  }, [])

  const refresh = useCallback(() => {
    setXp(loadXP())
  }, [])

  return { xp, addXP, refresh }
}
