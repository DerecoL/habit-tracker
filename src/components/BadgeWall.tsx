import { BADGE_DEFS } from '../types'

interface BadgeWallProps {
  unlockedIds: string[]
}

export function BadgeWall({ unlockedIds }: BadgeWallProps) {
  return (
    <section className="badge-wall">
      <h3>成就徽章</h3>
      <div className="badge-grid">
        {BADGE_DEFS.map((badge) => {
          const unlocked = unlockedIds.includes(badge.id)
          return (
            <div
              key={badge.id}
              className={`badge-item ${unlocked ? 'badge-unlocked' : 'badge-locked'}`}
            >
              <span className="badge-icon">{unlocked ? badge.icon : '🔒'}</span>
              <span className="badge-name">{badge.name}</span>
              {unlocked && <span className="badge-desc">{badge.desc}</span>}
            </div>
          )
        })}
      </div>
    </section>
  )
}
