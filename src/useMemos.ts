import { useState, useEffect, useCallback, useRef } from 'react'
import type { MemosState } from './types'
import * as storage from './storage'
import { useSync } from './SyncContext'

export function useMemos() {
  const { syncToCloud, subscribe } = useSync()
  const isFromCloud = useRef(false)

  const [memos, setMemos] = useState<MemosState>(() => storage.loadMemos())

  useEffect(() => {
    return subscribe('memos', (value: MemosState) => {
      isFromCloud.current = true
      setMemos(value)
    })
  }, [subscribe])

  useEffect(() => {
    storage.saveMemos(memos)
    if (isFromCloud.current) {
      isFromCloud.current = false
    } else {
      syncToCloud('memos', memos)
    }
  }, [memos, syncToCloud])

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
