import { useState } from 'react'
import type { Reward } from '../types'

interface RewardManagerProps {
  rewards: Reward[]
  xpBalance: number
  addReward: (name: string, cost: number) => void
  redeemReward: (id: string) => void
  removeReward: (id: string) => void
}

export function RewardManager({
  rewards,
  xpBalance,
  addReward,
  redeemReward,
  removeReward,
}: RewardManagerProps) {
  const [name, setName] = useState('')
  const [cost, setCost] = useState('')

  const handleAdd = () => {
    const c = parseInt(cost, 10)
    if (name.trim() && !isNaN(c) && c > 0) {
      addReward(name.trim(), c)
      setName('')
      setCost('')
    }
  }

  return (
    <div className="reward-manager">
      <h3>自定义奖励</h3>
      <form
        className="reward-add-form"
        onSubmit={(e) => {
          e.preventDefault()
          handleAdd()
        }}
      >
        <input
          type="text"
          placeholder="奖励名称"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="reward-input"
        />
        <input
          type="number"
          placeholder="消耗 XP"
          value={cost}
          onChange={(e) => setCost(e.target.value)}
          min={1}
          className="reward-input"
        />
        <button type="submit" className="reward-add-btn">
          添加
        </button>
      </form>
      <div className="reward-list">
        {rewards.length === 0 && (
          <p className="memo-hint" style={{ textAlign: 'center', padding: '12px 0' }}>暂无奖励，添加一个吧</p>
        )}
        {rewards.map((r) => (
          <div key={r.id} className="reward-item">
            <div className="reward-info">
              <span className="reward-name">{r.name}</span>
              <span className="reward-cost">{r.cost} XP</span>
            </div>
            <div className="reward-actions">
              <button
                type="button"
                className="reward-redeem-btn"
                disabled={xpBalance < r.cost || r.redeemed}
                title={r.redeemed ? '已兑换' : xpBalance < r.cost ? `需要 ${r.cost} XP（当前 ${xpBalance}）` : '兑换此奖励'}
                onClick={() => redeemReward(r.id)}
              >
                {r.redeemed ? '已兑换' : '兑换'}
              </button>
              <button
                type="button"
                className="reward-remove-btn"
                onClick={() => removeReward(r.id)}
              >
                删除
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
