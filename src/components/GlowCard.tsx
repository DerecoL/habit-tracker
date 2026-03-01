import { useRef, useCallback, type ReactNode, type CSSProperties } from 'react'

interface GlowCardProps {
  children: ReactNode
  className?: string
  style?: CSSProperties
  glowColor?: string
}

export function GlowCard({ children, className = '', style, glowColor }: GlowCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)

  const handleMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = cardRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const centerX = rect.width / 2
    const centerY = rect.height / 2
    const rotateX = ((y - centerY) / centerY) * -6
    const rotateY = ((x - centerX) / centerX) * 6

    el.style.transform = `perspective(600px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`
    el.style.setProperty('--glow-x', `${x}px`)
    el.style.setProperty('--glow-y', `${y}px`)
  }, [])

  const handleLeave = useCallback(() => {
    const el = cardRef.current
    if (!el) return
    el.style.transform = 'perspective(600px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)'
  }, [])

  return (
    <div
      ref={cardRef}
      className={`glow-card ${className}`}
      style={{ ...style, '--glow-accent': glowColor } as CSSProperties}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
    >
      <div className="glow-card-spotlight" />
      <div className="glow-card-border" />
      <div className="glow-card-content">
        {children}
      </div>
    </div>
  )
}
