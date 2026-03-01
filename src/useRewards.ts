import { useState, useEffect, useCallback } from 'react'
import type { Reward } from './types'
import { STORAGE_REWARDS } from './types'

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
  const [rewards, setRewards] = useState<Reward[]>(() => loadRewards())

  useEffect(() => {
    localStorage.setItem(STORAGE_REWARDS, JSON.stringify(rewards))
  }, [rewards])

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
