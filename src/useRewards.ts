import { useState, useEffect, useCallback, useRef } from 'react'
import type { Reward } from './types'
import { STORAGE_REWARDS } from './types'
import { useSync } from './SyncContext'

function loadRewards(): Reward[] {
  try {
    const raw = localStorage.getItem(STORAGE_REWARDS)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) {
        return parsed.filter(
          (r): r is Reward =>
            r && typeof r.id === 'string' && typeof r.name === 'string' && typeof r.cost === 'number' && typeof r.redeemed === 'boolean'
        )
      }
    }
  } catch (_) {}
  return []
}

export function useRewards() {
  const { syncToCloud, subscribe } = useSync()
  const isFromCloud = useRef(false)

  const [rewards, setRewards] = useState<Reward[]>(() => loadRewards())

  useEffect(() => {
    return subscribe('rewards', (value: Reward[]) => {
      isFromCloud.current = true
      setRewards(value)
    })
  }, [subscribe])

  useEffect(() => {
    localStorage.setItem(STORAGE_REWARDS, JSON.stringify(rewards))
    if (isFromCloud.current) {
      isFromCloud.current = false
    } else {
      syncToCloud('rewards', rewards)
    }
  }, [rewards, syncToCloud])

  const addReward = useCallback((name: string, cost: number) => {
    const reward: Reward = {
      id: crypto.randomUUID(),
      name,
      cost,
      redeemed: false,
    }
    setRewards(prev => [...prev, reward])
  }, [])

  const redeemReward = useCallback((id: string) => {
    setRewards(prev => prev.map(r => (r.id === id ? { ...r, redeemed: true } : r)))
  }, [])

  const removeReward = useCallback((id: string) => {
    setRewards(prev => prev.filter(r => r.id !== id))
  }, [])

  const refresh = useCallback(() => {
    setRewards(loadRewards())
  }, [])

  return { rewards, addReward, redeemReward, removeReward, refresh }
}
