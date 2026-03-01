import { useState, useEffect, useCallback } from 'react'
import type { DailyMoodState } from './types'
import * as storage from './storage'

const MOOD_MIN = 1
const MOOD_MAX = 5

export function useDailyMood() {
  const [mood, setMoodState] = useState<DailyMoodState>(() => storage.loadDailyMood())

  useEffect(() => {
    storage.saveDailyMood(mood)
  }, [mood])

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
