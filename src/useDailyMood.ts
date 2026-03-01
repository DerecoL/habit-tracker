import { useState, useEffect, useCallback, useRef } from 'react'
import type { DailyMoodState } from './types'
import * as storage from './storage'
import { useSync } from './SyncContext'

const MOOD_MIN = 1
const MOOD_MAX = 5

export function useDailyMood() {
  const { syncToCloud, subscribe } = useSync()
  const isFromCloud = useRef(false)

  const [mood, setMoodState] = useState<DailyMoodState>(() => storage.loadDailyMood())

  useEffect(() => {
    return subscribe('dailyMood', (value: DailyMoodState) => {
      isFromCloud.current = true
      setMoodState(value)
    })
  }, [subscribe])

  useEffect(() => {
    storage.saveDailyMood(mood)
    if (isFromCloud.current) {
      isFromCloud.current = false
    } else {
      syncToCloud('dailyMood', mood)
    }
  }, [mood, syncToCloud])

  const getMood = useCallback(
    (date: string) => {
      const v = mood[date]
      return typeof v === 'number' && v >= MOOD_MIN && v <= MOOD_MAX ? v : 0
    },
    [mood]
  )

  const setMood = useCallback((date: string, value: number) => {
    setMoodState(prev => {
      const next = { ...prev }
      if (value >= MOOD_MIN && value <= MOOD_MAX) {
        next[date] = value
      } else {
        delete next[date]
      }
      return next
    })
  }, [])

  const refresh = useCallback(() => {
    setMoodState(storage.loadDailyMood())
  }, [])

  return { getMood, setMood, refresh }
}
