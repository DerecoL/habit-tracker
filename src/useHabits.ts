import { useState, useEffect, useCallback, useRef } from 'react'
import type { Habit, CheckIn, HabitType, CheckInStatus } from './types'
import * as storage from './storage'
import { useSync } from './SyncContext'

function ensureHabitType(habits: Habit[]): Habit[] {
  return habits.map(h =>
    'type' in h && h.type ? h : { ...h, type: 'basic' as HabitType }
  )
}

export function useHabits() {
  const { syncToCloud, subscribe } = useSync()
  const habitsFromCloud = useRef(false)
  const checkInsFromCloud = useRef(false)

  const [habits, setHabits] = useState<Habit[]>(() =>
    ensureHabitType(storage.loadHabits())
  )
  const [checkIns, setCheckIns] = useState<CheckIn[]>(() => storage.loadCheckIns())

  useEffect(() => {
    const unsub1 = subscribe('habits', (value: Habit[]) => {
      habitsFromCloud.current = true
      setHabits(ensureHabitType(value))
    })
    const unsub2 = subscribe('checkins', (value: CheckIn[]) => {
      checkInsFromCloud.current = true
      setCheckIns(value)
    })
    return () => { unsub1(); unsub2() }
  }, [subscribe])

  const refresh = useCallback(() => {
    setHabits(ensureHabitType(storage.loadHabits()))
    setCheckIns(storage.loadCheckIns())
  }, [])

  useEffect(() => {
    storage.saveHabits(habits)
    if (habitsFromCloud.current) {
      habitsFromCloud.current = false
    } else {
      syncToCloud('habits', habits)
    }
  }, [habits, syncToCloud])

  useEffect(() => {
    storage.saveCheckIns(checkIns)
    if (checkInsFromCloud.current) {
      checkInsFromCloud.current = false
    } else {
      syncToCloud('checkins', checkIns)
    }
  }, [checkIns, syncToCloud])

  const addHabit = useCallback((name: string, color: string, type: HabitType = 'basic') => {
    const id = crypto.randomUUID()
    const habit: Habit = { id, name, color, type, createdAt: new Date().toISOString() }
    setHabits(prev => [...prev, habit])
  }, [])

  const updateHabit = useCallback((id: string, updates: Partial<Pick<Habit, 'name' | 'color' | 'type' | 'icon' | 'group' | 'frequency' | 'goalPerWeek' | 'goalPerMonth'>>) => {
    setHabits(prev => prev.map(h => (h.id === id ? { ...h, ...updates } : h)))
  }, [])

  const removeHabit = useCallback((id: string) => {
    setHabits(prev => prev.filter(h => h.id !== id))
    setCheckIns(prev => prev.filter(c => c.habitId !== id))
  }, [])

  const toggleCheckIn = useCallback((habitId: string, date: string) => {
    setCheckIns(prev => {
      const existing = prev.find(c => c.habitId === habitId && c.date === date && c.status !== 'skip')
      if (existing) {
        return prev.filter(c => !(c.habitId === habitId && c.date === date && c.status !== 'skip'))
      }
      return [...prev, { habitId, date, status: 'done' as CheckInStatus }]
    })
  }, [])

  const skipCheckIn = useCallback((habitId: string, date: string) => {
    setCheckIns(prev => {
      const filtered = prev.filter(c => !(c.habitId === habitId && c.date === date))
      return [...filtered, { habitId, date, status: 'skip' as CheckInStatus }]
    })
  }, [])

  const setCheckInNote = useCallback((habitId: string, date: string, note: string) => {
    setCheckIns(prev => {
      const idx = prev.findIndex(c => c.habitId === habitId && c.date === date)
      if (idx < 0) return prev
      const next = [...prev]
      next[idx] = { ...next[idx], note }
      return next
    })
  }, [])

  const getCheckInStatus = useCallback(
    (habitId: string, date: string): 'done' | 'skip' | 'none' => {
      const c = checkIns.find(ci => ci.habitId === habitId && ci.date === date)
      if (!c) return 'none'
      return c.status === 'skip' ? 'skip' : 'done'
    },
    [checkIns]
  )

  const getCheckInNote = useCallback(
    (habitId: string, date: string): string => {
      const c = checkIns.find(ci => ci.habitId === habitId && ci.date === date && ci.status !== 'skip')
      return c?.note ?? ''
    },
    [checkIns]
  )

  const addSpecialCheckIn = useCallback((habitId: string, date: string) => {
    setCheckIns(prev => [...prev, { habitId, date, status: 'done' as CheckInStatus }])
  }, [])

  const removeOneSpecialCheckIn = useCallback((habitId: string, date: string) => {
    setCheckIns(prev => {
      const i = prev.findIndex(c => c.habitId === habitId && c.date === date)
      if (i < 0) return prev
      return prev.slice(0, i).concat(prev.slice(i + 1))
    })
  }, [])

  const isCheckedIn = useCallback(
    (habitId: string, date: string) =>
      checkIns.some(c => c.habitId === habitId && c.date === date && c.status !== 'skip'),
    [checkIns]
  )

  const getSpecialCount = useCallback(
    (habitId: string, date: string) =>
      checkIns.filter(c => c.habitId === habitId && c.date === date && c.status !== 'skip').length,
    [checkIns]
  )

  const moveHabit = useCallback((id: string, direction: 'up' | 'down') => {
    setHabits(prev => {
      const idx = prev.findIndex(h => h.id === id)
      if (idx < 0) return prev
      const target = direction === 'up' ? idx - 1 : idx + 1
      if (target < 0 || target >= prev.length) return prev
      const next = [...prev]
      ;[next[idx], next[target]] = [next[target], next[idx]]
      return next
    })
  }, [])

  const archiveHabit = useCallback((id: string) => {
    setHabits(prev => prev.map(h => h.id === id ? { ...h, archived: true } : h))
  }, [])

  const unarchiveHabit = useCallback((id: string) => {
    setHabits(prev => prev.map(h => h.id === id ? { ...h, archived: false } : h))
  }, [])

  return {
    habits, checkIns, refresh,
    addHabit, updateHabit, removeHabit,
    moveHabit, archiveHabit, unarchiveHabit,
    toggleCheckIn, skipCheckIn,
    setCheckInNote, getCheckInStatus, getCheckInNote,
    addSpecialCheckIn, removeOneSpecialCheckIn,
    isCheckedIn, getSpecialCount,
  }
}
