import { useEffect, useState, useMemo } from 'react'
import { todayStr } from '../dateUtils'
import { getBasicDayStats, basicHabits } from '../stats'
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
  milestone?: { type: string; message: string } | null
}

export function Celebration({ habits, checkIns, milestone }: CelebrationProps) {
  const [show, setShow] = useState(false)
  const [display, setDisplay] = useState<{ title: string; sub: string } | null>(null)
  const today = todayStr()

  const basicCount = useMemo(() => basicHabits(habits).length, [habits])
  const basicDay = useMemo(() => getBasicDayStats(habits, checkIns, today), [habits, checkIns, today])
  const isAllClear = basicCount > 0 && basicDay.completed === basicDay.total

  useEffect(() => {
    if (milestone) {
      setDisplay({ title: milestone.type, sub: milestone.message })
      setShow(true)
      const timer = setTimeout(() => {
        setShow(false)
        setDisplay(null)
      }, 3200)
      return () => clearTimeout(timer)
    }
  }, [milestone])

  useEffect(() => {
    if (!milestone && isAllClear) {
      const celebrated = sessionStorage.getItem(CELEB_KEY)
      if (celebrated === today) return
      sessionStorage.setItem(CELEB_KEY, today)
      setDisplay({ title: 'ALL CLEAR', sub: '今日全勤！' })
      setShow(true)
      const timer = setTimeout(() => {
        setShow(false)
        setDisplay(null)
      }, 3200)
      return () => clearTimeout(timer)
    }
  }, [milestone, isAllClear, today])

  const particles = useMemo(() => makeParticles(), [show])

  if (!show || !display) return null

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
        <div className="celebration-title">{display.title}</div>
        <span className="celebration-sub">{display.sub}</span>
      </div>
    </div>
  )
}
