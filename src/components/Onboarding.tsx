import { useState } from 'react'

const STORAGE_KEY = 'habit-tracker-onboarded'

const STEPS = [
  {
    icon: '◈',
    title: '欢迎使用 HABIT_TRACKER',
    desc: '这是一个赛博朋克风格的习惯打卡系统，帮助你追踪日常习惯并可视化你的坚持。',
  },
  {
    icon: '⚙',
    title: '创建你的习惯',
    desc: '进入「管理」页面添加习惯。支持三种类型：基础（每日必做）、进阶（挑战自我）、特殊（不限频次，按次数统计）。也可使用快捷模板一键添加。',
  },
  {
    icon: '▣',
    title: '每日打卡',
    desc: '在「打卡」页面记录今日完成情况，还可以记录心情和备忘。支持回顾历史日期补打。',
  },
  {
    icon: '◆',
    title: '查看趋势与总览',
    desc: '「总览」展示热力图、连续天数和完成率；「趋势」页面用曲线可视化你的长期坚持。开始你的习惯之旅吧！',
  },
]

export function Onboarding({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0)

  const finish = () => {
    localStorage.setItem(STORAGE_KEY, '1')
    onDone()
  }

  const current = STEPS[step]

  return (
    <div className="onboarding-overlay">
      <div className="onboarding-card">
        <div className="onboarding-progress">
          {STEPS.map((_, i) => (
            <span key={i} className={`onboarding-dot ${i === step ? 'active' : ''} ${i < step ? 'done' : ''}`} />
          ))}
        </div>
        <span className="onboarding-icon">{current.icon}</span>
        <h2 className="onboarding-title">{current.title}</h2>
        <p className="onboarding-desc">{current.desc}</p>
        <div className="onboarding-actions">
          {step > 0 && (
            <button type="button" className="btn btn-ghost" onClick={() => setStep(s => s - 1)}>
              上一步
            </button>
          )}
          {step < STEPS.length - 1 ? (
            <button type="button" className="btn btn-primary" onClick={() => setStep(s => s + 1)}>
              下一步
            </button>
          ) : (
            <button type="button" className="btn btn-primary" onClick={finish}>
              开始使用
            </button>
          )}
        </div>
        <button type="button" className="onboarding-skip" onClick={finish}>
          跳过引导
        </button>
      </div>
    </div>
  )
}

export function shouldShowOnboarding(): boolean {
  return !localStorage.getItem(STORAGE_KEY)
}
