import { useState, useCallback } from 'react'

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

  const toast = useCallback((message: string, type: ToastType = 'info') => {
    const id = ++toastId
    setToasts(prev => {
      const next = [...prev, { id, message, type, leaving: false }]
      return next.length > 3 ? next.slice(-3) : next
    })
    setTimeout(() => {
      setToasts(prev => prev.map(t => t.id === id ? { ...t, leaving: true } : t))
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id))
      }, 300)
    }, 2400)
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
    <div className="toast-container">
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
