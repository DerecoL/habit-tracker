import { useEffect, useState, useMemo } from 'react'
import { todayStr } from '../dateUtils'
import { getDayStats, dailyHabits } from '../stats'
import type { Habit, CheckIn } from '../types'

const CELEB_KEY = 'habit-tracker-celebrated'
const PARTICLE_COUNT = 24
const COLORS = ['#00f0ff', '#ff2d95', '#b537f2', '#39ff14', '#fcee09', '#00b8cc']

function makeParticles() {
  return Array.from({ length: PARTICLE_COUNT }, (_, i) => {
    const angle = (Math.PI * 2 * i) / PARTICLE_COUNT + (Math.random() - 0.5) * 0.5
    const dist = 120 + Math.random() * 200
    return {
      id: i,
      tx: `${Math.cos(angle) * dist}px`,
      ty: `${Math.sin(angle) * dist}px`,
      size: 4 + Math.random() * 8,
      color: COLORS[i % COLORS.length],
      dur: 1.2 + Math.random() * 1,
      delay: Math.random() * 0.4,
    }
  })
}

interface CelebrationProps {
  habits: Habit[]
  checkIns: CheckIn[]
}

export function Celebration({ habits, checkIns }: CelebrationProps) {
  const [show, setShow] = useState(false)
  const today = todayStr()

  const dailyCount = useMemo(() => dailyHabits(habits).length, [habits])
  const dayStat = useMemo(() => getDayStats(habits, checkIns, today), [habits, checkIns, today])
  const isAllClear = dailyCount > 0 && dayStat.completed === dayStat.total

  useEffect(() => {
    if (!isAllClear) return
    const celebrated = sessionStorage.getItem(CELEB_KEY)
    if (celebrated === today) return
    sessionStorage.setItem(CELEB_KEY, today)
    setShow(true)
    const timer = setTimeout(() => setShow(false), 3200)
    return () => clearTimeout(timer)
  }, [isAllClear, today])

  if (!show) return null

  const particles = makeParticles()

  return (
    <div className="celebration-overlay">
      {particles.map(p => (
        <div
          key={p.id}
          className="celebration-particle"
          style={{
            width: p.size,
            height: p.size,
            background: p.color,
            boxShadow: `0 0 8px ${p.color}`,
            top: '50%',
            left: '50%',
            '--tx': p.tx,
            '--ty': p.ty,
            '--dur': `${p.dur}s`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.dur}s`,
          } as React.CSSProperties}
        />
      ))}
      <div className="celebration-banner">
        <div className="celebration-title">ALL CLEAR</div>
        <span className="celebration-sub">今日全勤！</span>
      </div>
    </div>
  )
}
