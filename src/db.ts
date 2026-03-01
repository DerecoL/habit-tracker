const DB_NAME = 'habit-tracker-db'
const DB_VERSION = 1
const STORE_NAME = 'kvstore'

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME)
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

export async function idbGet<T>(key: string): Promise<T | undefined> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const store = tx.objectStore(STORE_NAME)
    const req = store.get(key)
    req.onsuccess = () => resolve(req.result as T | undefined)
    req.onerror = () => reject(req.error)
  })
}

export async function idbSet(key: string, value: unknown): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    const req = store.put(value, key)
    req.onsuccess = () => resolve()
    req.onerror = () => reject(req.error)
  })
}

export async function idbDelete(key: string): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    const req = store.delete(key)
    req.onsuccess = () => resolve()
    req.onerror = () => reject(req.error)
  })
}

/**
 * Migrate existing localStorage data to IndexedDB (one-time).
 * localStorage remains the sync source of truth for initial load,
 * while IndexedDB provides a larger capacity backup.
 */
export async function migrateToIDB(keys: string[]): Promise<void> {
  const migrated = localStorage.getItem('habit-tracker-idb-migrated')
  if (migrated) return
  try {
    for (const key of keys) {
      const raw = localStorage.getItem(key)
      if (raw) {
        await idbSet(key, JSON.parse(raw))
      }
    }
    localStorage.setItem('habit-tracker-idb-migrated', '1')
  } catch {
    // silently fail — localStorage still works as fallback
  }
}

/**
 * Background sync: write to both localStorage and IndexedDB.
 * Returns immediately (fire-and-forget).
 */
export function syncToIDB(key: string, value: unknown): void {
  idbSet(key, value).catch(() => {})
}
