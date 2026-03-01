import { useState, useEffect, useCallback, useRef } from 'react'
import type { FreezeState } from './types'
import { STORAGE_FREEZES } from './types'
import { useSync } from './SyncContext'

const DEFAULT_FREEZE: FreezeState = { remaining: 2, usedDates: [] }

function loadFreezes(): FreezeState {
  try {
    const raw = localStorage.getItem(STORAGE_FREEZES)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (
        parsed &&
        typeof parsed.remaining === 'number' &&
        Array.isArray(parsed.usedDates) &&
        parsed.usedDates.every((x: unknown): x is string => typeof x === 'string')
      ) {
        return parsed
      }
    }
  } catch (_) {}
  return { ...DEFAULT_FREEZE }
}

export function useFreezes() {
  const { syncToCloud, subscribe } = useSync()
  const isFromCloud = useRef(false)

  const [freezes, setFreezes] = useState<FreezeState>(() => loadFreezes())

  useEffect(() => {
    return subscribe('freezes', (value: FreezeState) => {
      isFromCloud.current = true
      setFreezes(value)
    })
  }, [subscribe])

  useEffect(() => {
    localStorage.setItem(STORAGE_FREEZES, JSON.stringify(freezes))
    if (isFromCloud.current) {
      isFromCloud.current = false
    } else {
      syncToCloud('freezes', freezes)
    }
  }, [freezes, syncToCloud])

  const useFreeze = useCallback((date: string) => {
    setFreezes(prev => {
      if (prev.remaining <= 0) return prev
      return {
        remaining: prev.remaining - 1,
        usedDates: prev.usedDates.includes(date) ? prev.usedDates : [...prev.usedDates, date],
      }
    })
  }, [])

  const resetMonthly = useCallback(() => {
    setFreezes({ remaining: 2, usedDates: [] })
  }, [])

  const isFrozen = useCallback(
    (date: string) => freezes.usedDates.includes(date),
    [freezes.usedDates]
  )

  const refresh = useCallback(() => {
    setFreezes(loadFreezes())
  }, [])

  return { freezes, useFreeze, resetMonthly, isFrozen, refresh }
}
