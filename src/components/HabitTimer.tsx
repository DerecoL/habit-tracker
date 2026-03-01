import { useState, useRef, useCallback, useEffect } from 'react'

interface HabitTimerProps {
  onComplete?: () => void
}

const PRESETS = [5, 10, 15, 30]

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function HabitTimer({ onComplete }: HabitTimerProps) {
  const [seconds, setSeconds] = useState(0)
  const [running, setRunning] = useState(false)
  const [targetMinutes, setTargetMinutes] = useState(10)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    setRunning(false)
  }, [])

  const start = useCallback(() => {
    if (intervalRef.current) return
    setRunning(true)
    intervalRef.current = setInterval(() => {
      setSeconds((s) => {
        const next = s + 1
        const targetSec = targetMinutes * 60
        if (next >= targetSec) {
          stop()
          onComplete?.()
        }
        return next
      })
    }, 1000)
  }, [targetMinutes, onComplete, stop])

  const pause = useCallback(() => {
    stop()
  }, [stop])

  const reset = useCallback(() => {
    stop()
    setSeconds(0)
  }, [stop])

  const setPreset = (mins: number) => {
    stop()
    setTargetMinutes(mins)
    setSeconds(0)
  }

  const targetSec = targetMinutes * 60
  const completed = seconds >= targetSec && !running

  return (
    <div className="habit-timer">
      <div className="timer-display">{formatTime(seconds)}</div>
      <div className="timer-presets">
        {PRESETS.map((m) => (
          <button
            key={m}
            type="button"
            className="timer-preset-btn"
            onClick={() => setPreset(m)}
          >
            {m}min
          </button>
        ))}
      </div>
      <div className="timer-controls">
        {!completed && (
          <>
            {running ? (
              <button type="button" onClick={pause} className="timer-btn">
                暂停
              </button>
            ) : (
              <button type="button" onClick={start} className="timer-btn">
                开始
              </button>
            )}
            <button type="button" onClick={reset} className="timer-btn">
              重置
            </button>
          </>
        )}
        {completed && (
          <div className="timer-complete">已完成!</div>
        )}
      </div>
    </div>
  )
}
