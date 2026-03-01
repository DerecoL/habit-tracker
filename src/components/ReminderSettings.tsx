import { useState, useEffect, useCallback } from 'react'

const STORAGE_KEY = 'habit-tracker-reminder'

interface ReminderConfig {
  enabled: boolean
  hour: number
  minute: number
}

function loadConfig(): ReminderConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return { enabled: false, hour: 21, minute: 0 }
}

function saveConfig(cfg: ReminderConfig) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg))
}

let reminderTimer: ReturnType<typeof setTimeout> | null = null

function scheduleNextReminder(cfg: ReminderConfig) {
  if (reminderTimer) clearTimeout(reminderTimer)
  if (!cfg.enabled) return
  if (Notification.permission !== 'granted') return

  const now = new Date()
  const target = new Date(now)
  target.setHours(cfg.hour, cfg.minute, 0, 0)
  if (target.getTime() <= now.getTime()) {
    target.setDate(target.getDate() + 1)
  }
  const delay = target.getTime() - now.getTime()
  reminderTimer = setTimeout(() => {
    new Notification('HABIT_TRACKER 打卡提醒', {
      body: '今天的习惯完成了吗？快去打卡吧！',
      icon: '/favicon.ico',
    })
    scheduleNextReminder(cfg)
  }, delay)
}

export function initReminder() {
  const cfg = loadConfig()
  if (cfg.enabled) scheduleNextReminder(cfg)
}

export function ReminderSettings() {
  const [cfg, setCfg] = useState<ReminderConfig>(loadConfig)
  const [permStatus, setPermStatus] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'denied'
  )

  const notSupported = typeof Notification === 'undefined'

  useEffect(() => {
    saveConfig(cfg)
    scheduleNextReminder(cfg)
  }, [cfg])

  const requestPermission = useCallback(async () => {
    if (notSupported) return
    const result = await Notification.requestPermission()
    setPermStatus(result)
    if (result === 'granted') {
      setCfg(prev => ({ ...prev, enabled: true }))
    }
  }, [notSupported])

  const toggle = () => {
    if (!cfg.enabled && permStatus !== 'granted') {
      requestPermission()
      return
    }
    setCfg(prev => ({ ...prev, enabled: !prev.enabled }))
  }

  if (notSupported) {
    return (
      <div className="reminder-settings">
        <h3 className="habit-block-title">打卡提醒</h3>
        <p className="memo-hint">当前浏览器不支持通知功能</p>
      </div>
    )
  }

  return (
    <div className="reminder-settings">
      <h3 className="habit-block-title">打卡提醒</h3>
      <p className="memo-hint">开启后会在指定时间发送浏览器通知提醒你打卡（需保持页面打开）</p>
      <div className="reminder-row">
        <label className="reminder-toggle-label">
          <input type="checkbox" checked={cfg.enabled} onChange={toggle} />
          <span className="reminder-toggle-text">{cfg.enabled ? '已开启' : '已关闭'}</span>
        </label>
        {cfg.enabled && (
          <div className="reminder-time-pick">
            <span>提醒时间</span>
            <input type="time"
              className="reminder-time-input"
              value={`${String(cfg.hour).padStart(2, '0')}:${String(cfg.minute).padStart(2, '0')}`}
              onChange={e => {
                const [h, m] = e.target.value.split(':').map(Number)
                setCfg(prev => ({ ...prev, hour: h, minute: m }))
              }}
            />
          </div>
        )}
      </div>
      {permStatus === 'denied' && (
        <p className="reminder-warn">浏览器通知权限已被拒绝，请在浏览器设置中手动允许</p>
      )}
    </div>
  )
}
