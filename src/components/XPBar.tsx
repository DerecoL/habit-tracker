import { getLevelInfo } from '../types'

interface XPBarProps {
  totalXp: number
}

export function XPBar({ totalXp }: XPBarProps) {
  const info = getLevelInfo(totalXp)
  return (
    <section className="xp-bar-section">
      <h3>经验 & 等级</h3>
      <div className="xp-level-row">
        <span className="xp-level-badge">Lv.{info.level}</span>
        <span className="xp-level-name">{info.name}</span>
        <span className="xp-total">{info.totalXp} XP</span>
      </div>
      <div className="xp-progress-track">
        <div className="xp-progress-fill" style={{ width: `${info.progress}%` }} />
      </div>
      <div className="xp-next">NEXT → {info.nextName}</div>
    </section>
  )
}
