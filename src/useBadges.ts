import { useState, useEffect, useCallback, useRef } from 'react'
import { BADGE_DEFS, STORAGE_BADGES } from './types'
import { useSync } from './SyncContext'

function loadBadges(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_BADGES)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.every((x): x is string => typeof x === 'string')) {
        return parsed
      }
    }
  } catch (_) {}
  return []
}

export function useBadges() {
  const { syncToCloud, subscribe } = useSync()
  const isFromCloud = useRef(false)

  const [unlockedIds, setUnlockedIds] = useState<string[]>(() => loadBadges())

  useEffect(() => {
    return subscribe('badges', (value: string[]) => {
      isFromCloud.current = true
      setUnlockedIds(value)
    })
  }, [subscribe])

  useEffect(() => {
    localStorage.setItem(STORAGE_BADGES, JSON.stringify(unlockedIds))
    if (isFromCloud.current) {
      isFromCloud.current = false
    } else {
      syncToCloud('badges', unlockedIds)
    }
  }, [unlockedIds, syncToCloud])

  const checkAndUnlock = useCallback(
    (stats: { totalCheckins: number; longestStreak: number; totalDays: number; habits: number }) => {
      setUnlockedIds(prev => {
        const next = new Set(prev)
        for (const badge of BADGE_DEFS) {
          if (!next.has(badge.id) && badge.check(stats)) {
            next.add(badge.id)
          }
        }
        return [...next]
      })
    },
    []
  )

  const refresh = useCallback(() => {
    setUnlockedIds(loadBadges())
  }, [])

  return { unlockedIds, checkAndUnlock, refresh }
}
