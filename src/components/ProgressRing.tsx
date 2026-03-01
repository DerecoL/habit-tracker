interface ProgressRingProps {
  percent: number
  size?: number
  stroke?: number
  label?: string
  sublabel?: string
  color?: string
  glowColor?: string
}

export function ProgressRing({
  percent, size = 120, stroke = 6,
  label, sublabel,
  color = 'var(--neon-cyan)',
  glowColor = 'var(--neon-cyan-glow)',
}: ProgressRingProps) {
  const r = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const offset = circ - (circ * Math.min(100, percent)) / 100

  return (
    <div className="progress-ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          className="progress-ring-bg"
          cx={size / 2} cy={size / 2} r={r}
          fill="none"
          stroke="rgba(255,255,255,0.04)"
          strokeWidth={stroke}
        />
        <circle
          className="progress-ring-fill"
          cx={size / 2} cy={size / 2} r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          style={{
            filter: `drop-shadow(0 0 6px ${glowColor})`,
            transform: 'rotate(-90deg)',
            transformOrigin: '50% 50%',
            transition: 'stroke-dashoffset 1s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        />
      </svg>
      <div className="progress-ring-content">
        {label && <span className="progress-ring-label">{label}</span>}
        {sublabel && <span className="progress-ring-sublabel">{sublabel}</span>}
      </div>
    </div>
  )
}
