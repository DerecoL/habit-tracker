import { createContext, useContext, useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { ref, get, set, onValue, serverTimestamp } from 'firebase/database'
import { rtdb } from './firebase'
import { useAuth } from './AuthContext'
import {
  STORAGE_HABITS, STORAGE_CHECKINS, STORAGE_MEMOS, STORAGE_DAILY_MOOD,
  STORAGE_XP, STORAGE_BADGES, STORAGE_REWARDS, STORAGE_FREEZES,
  type CheckIn,
} from './types'

export type SyncKey = 'habits' | 'checkins' | 'memos' | 'dailyMood' | 'xp' | 'badges' | 'rewards' | 'freezes'

const ALL_KEYS: SyncKey[] = ['habits', 'checkins', 'memos', 'dailyMood', 'xp', 'badges', 'rewards', 'freezes']

const LOCAL_KEY_MAP: Record<SyncKey, string> = {
  habits: STORAGE_HABITS,
  checkins: STORAGE_CHECKINS,
  memos: STORAGE_MEMOS,
  dailyMood: STORAGE_DAILY_MOOD,
  xp: STORAGE_XP,
  badges: STORAGE_BADGES,
  rewards: STORAGE_REWARDS,
  freezes: STORAGE_FREEZES,
}

const DEFAULTS: Record<SyncKey, unknown> = {
  habits: [],
  checkins: [],
  memos: {},
  dailyMood: {},
  xp: { total: 0 },
  badges: [],
  rewards: [],
  freezes: { remaining: 2, usedDates: [] },
}

function loadLocal(key: SyncKey): unknown {
  try {
    const raw = localStorage.getItem(LOCAL_KEY_MAP[key])
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  return DEFAULTS[key]
}

function saveLocal(key: SyncKey, value: unknown): void {
  localStorage.setItem(LOCAL_KEY_MAP[key], JSON.stringify(value))
}

/* --------------- merge strategies --------------- */

function mergeArrayById<T extends { id: string }>(local: T[], cloud: T[]): T[] {
  const map = new Map<string, T>()
  for (const item of local) map.set(item.id, item)
  for (const item of cloud) map.set(item.id, item)
  return [...map.values()]
}

function mergeCheckIns(local: CheckIn[], cloud: CheckIn[]): CheckIn[] {
  const cloudKeys = new Set(cloud.map(c => `${c.habitId}|${c.date}`))
  const localOnly = local.filter(c => !cloudKeys.has(`${c.habitId}|${c.date}`))
  return [...cloud, ...localOnly]
}

function mergeData(key: SyncKey, local: unknown, cloud: unknown): unknown {
  if (cloud == null) return local ?? DEFAULTS[key]
  if (local == null) return cloud

  switch (key) {
    case 'habits':
    case 'rewards':
      return mergeArrayById(local as any[], cloud as any[])
    case 'checkins':
      return mergeCheckIns(local as CheckIn[], cloud as CheckIn[])
    case 'memos':
    case 'dailyMood':
      return { ...(local as Record<string, unknown>), ...(cloud as Record<string, unknown>) }
    case 'badges':
      return [...new Set([...(local as string[]), ...(cloud as string[])])]
    default:
      return cloud
  }
}

/* --------------- context --------------- */

interface SyncCtx {
  syncToCloud: (key: SyncKey, value: unknown) => void
  subscribe: (key: SyncKey, setter: (value: any) => void) => () => void
  syncStatus: 'idle' | 'syncing' | 'synced' | 'error'
}

const SyncContext = createContext<SyncCtx>({
  syncToCloud: () => {},
  subscribe: () => () => {},
  syncStatus: 'idle',
})

export function useSync() {
  return useContext(SyncContext)
}

export function SyncProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const userRef = useRef(user)
  const readyRef = useRef(false)
  const settersRef = useRef(new Map<SyncKey, Set<(v: any) => void>>())
  const unsubsRef = useRef<(() => void)[]>([])
  const debounceRef = useRef(new Map<SyncKey, ReturnType<typeof setTimeout>>())
  const [syncStatus, setSyncStatus] = useState<SyncCtx['syncStatus']>('idle')

  useEffect(() => { userRef.current = user }, [user])

  const subscribe = useCallback((key: SyncKey, setter: (v: any) => void) => {
    if (!settersRef.current.has(key)) settersRef.current.set(key, new Set())
    settersRef.current.get(key)!.add(setter)
    return () => { settersRef.current.get(key)?.delete(setter) }
  }, [])

  const syncToCloud = useCallback((key: SyncKey, value: unknown) => {
    const u = userRef.current
    if (!u || !readyRef.current) return

    const timers = debounceRef.current
    if (timers.has(key)) clearTimeout(timers.get(key)!)

    timers.set(key, setTimeout(() => {
      timers.delete(key)
      const dbRef = ref(rtdb, `users/${u.uid}/data/${key}`)
      set(dbRef, { value, updatedAt: serverTimestamp() }).catch(console.error)
    }, 1000))
  }, [])

  useEffect(() => {
    readyRef.current = false
    debounceRef.current.forEach(t => clearTimeout(t))
    debounceRef.current.clear()
    unsubsRef.current.forEach(fn => fn())
    unsubsRef.current = []

    if (!user) {
      setSyncStatus('idle')
      return
    }

    let cancelled = false

    const init = async () => {
      setSyncStatus('syncing')

      for (const key of ALL_KEYS) {
        if (cancelled) return
        const dbRef = ref(rtdb, `users/${user.uid}/data/${key}`)
        const snap = await get(dbRef)
        const cloudValue = snap.exists() ? snap.val()?.value ?? null : null
        const localValue = loadLocal(key)
        const merged = mergeData(key, localValue, cloudValue)

        saveLocal(key, merged)
        await set(dbRef, { value: merged, updatedAt: serverTimestamp() })
        settersRef.current.get(key)?.forEach(fn => fn(merged))
      }

      if (cancelled) return
      readyRef.current = true

      for (const key of ALL_KEYS) {
        const dbRef = ref(rtdb, `users/${user.uid}/data/${key}`)
        const unsub = onValue(dbRef, (snap) => {
          if (!snap.exists()) return
          const cloudValue = snap.val()?.value
          if (cloudValue === undefined) return
          const localValue = loadLocal(key)
          if (JSON.stringify(cloudValue) !== JSON.stringify(localValue)) {
            saveLocal(key, cloudValue)
            settersRef.current.get(key)?.forEach(fn => fn(cloudValue))
          }
        })
        unsubsRef.current.push(unsub)
      }

      setSyncStatus('synced')
    }

    init().catch((e) => {
      console.error('Sync init failed:', e)
      if (!cancelled) setSyncStatus('error')
    })

    return () => {
      cancelled = true
      readyRef.current = false
      debounceRef.current.forEach(t => clearTimeout(t))
      debounceRef.current.clear()
      unsubsRef.current.forEach(fn => fn())
      unsubsRef.current = []
    }
  }, [user])

  return (
    <SyncContext.Provider value={{ syncToCloud, subscribe, syncStatus }}>
      {children}
    </SyncContext.Provider>
  )
}
