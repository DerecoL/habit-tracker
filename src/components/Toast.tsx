import { useState, useCallback, useEffect, useRef } from 'react'

export type ToastType = 'success' | 'info' | 'warning' | 'error'

interface ToastItem {
  id: number
  message: string
  type: ToastType
  leaving: boolean
}

let toastId = 0

export function useToast() {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const timersRef = useRef<Set<ReturnType<typeof setTimeout>>>(new Set())

  useEffect(() => {
    return () => { timersRef.current.forEach(t => clearTimeout(t)) }
  }, [])

  const toast = useCallback((message: string, type: ToastType = 'info') => {
    const id = ++toastId
    setToasts(prev => {
      const next = [...prev, { id, message, type, leaving: false }]
      return next.length > 3 ? next.slice(-3) : next
    })
    const t1 = setTimeout(() => {
      setToasts(prev => prev.map(t => t.id === id ? { ...t, leaving: true } : t))
      timersRef.current.delete(t1)
      const t2 = setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id))
        timersRef.current.delete(t2)
      }, 300)
      timersRef.current.add(t2)
    }, 2400)
    timersRef.current.add(t1)
  }, [])

  return { toasts, toast }
}

const TYPE_CONFIG: Record<ToastType, { icon: string; className: string }> = {
  success: { icon: '✓', className: 'toast-success' },
  info: { icon: '◈', className: 'toast-info' },
  warning: { icon: '⚠', className: 'toast-warning' },
  error: { icon: '✕', className: 'toast-error' },
}

export function ToastContainer({ toasts }: { toasts: ToastItem[] }) {
  if (toasts.length === 0) return null
  return (
    <div className="toast-container" role="status" aria-live="polite">
      {toasts.map(t => {
        const cfg = TYPE_CONFIG[t.type]
        return (
          <div
            key={t.id}
            className={`toast-item ${cfg.className} ${t.leaving ? 'toast-leaving' : ''}`}
          >
            <span className="toast-icon">{cfg.icon}</span>
            <span className="toast-msg">{t.message}</span>
          </div>
        )
      })}
    </div>
  )
}
