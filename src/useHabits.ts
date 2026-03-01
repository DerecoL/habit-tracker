import { useState, useEffect, useCallback } from 'react'
import type { Habit, CheckIn, HabitType } from './types'
import * as storage from './storage'

function ensureHabitType(habits: Habit[]): Habit[] {
  return habits.map(h =>
    'type' in h && h.type ? h : { ...h, type: 'basic' as HabitType }
  )
}

export function useHabits() {
  const [habits, setHabits] = useState<Habit[]>(() =>
    ensureHabitType(storage.loadHabits())
  )
  const [checkIns, setCheckIns] = useState<CheckIn[]>(() => storage.loadCheckIns())

  const refresh = useCallback(() => {
    setHabits(ensureHabitType(storage.loadHabits()))
    setCheckIns(storage.loadCheckIns())
  }, [])

  useEffect(() => {
    storage.saveHabits(habits)
  }, [habits])

  useEffect(() => {
    storage.saveCheckIns(checkIns)
  }, [checkIns])

  const addHabit = useCallback((name: string, color: string, type: HabitType = 'basic') => {
    const id = crypto.randomUUID()
    const habit: Habit = {
      id,
      name,
      color,
      type,
      createdAt: new Date().toISOString(),
    }
    setHabits(prev => [...prev, habit])
  }, [])

  const updateHabit = useCallback((id: string, updates: Partial<Pick<Habit, 'name' | 'color' | 'type'>>) => {
    setHabits(prev => prev.map(h => (h.id === id ? { ...h, ...updates } : h)))
  }, [])

  const removeHabit = useCallback((id: string) => {
    setHabits(prev => prev.filter(h => h.id !== id))
    setCheckIns(prev => prev.filter(c => c.habitId !== id))
  }, [])

  const toggleCheckIn = useCallback((habitId: string, date: string) => {
    setCheckIns(prev => {
      const hasAny = prev.some(c => c.habitId === habitId && c.date === date)
      if (hasAny) {
        return prev.filter(c => !(c.habitId === habitId && c.date === date))
      }
      return [...prev, { habitId, date }]
    })
  }, [])

  const addSpecialCheckIn = useCallback((habitId: string, date: string) => {
    setCheckIns(prev => [...prev, { habitId, date }])
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
      checkIns.some(c => c.habitId === habitId && c.date === date),
    [checkIns]
  )

  const getSpecialCount = useCallback(
    (habitId: string, date: string) =>
      checkIns.filter(c => c.habitId === habitId && c.date === date).length,
    [checkIns]
  )

  return {
    habits,
    checkIns,
    refresh,
    addHabit,
    updateHabit,
    removeHabit,
    toggleCheckIn,
    addSpecialCheckIn,
    removeOneSpecialCheckIn,
    isCheckedIn,
    getSpecialCount,
  }
}
