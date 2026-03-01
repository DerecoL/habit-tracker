import { useState, useEffect, useCallback } from 'react'
import type { MemosState } from './types'
import * as storage from './storage'

export function useMemos() {
  const [memos, setMemos] = useState<MemosState>(() => storage.loadMemos())

  useEffect(() => {
    storage.saveMemos(memos)
  }, [memos])

  const getMemo = useCallback(
    (date: string) => memos[date] ?? '',
    [memos]
  )

  const setMemo = useCallback((date: string, content: string) => {
    setMemos(prev => {
      const next = { ...prev }
      if (content.trim()) {
        next[date] = content
      } else {
        delete next[date]
      }
      return next
    })
  }, [])

  const refresh = useCallback(() => {
    setMemos(storage.loadMemos())
  }, [])

  return { getMemo, setMemo, refresh }
}
