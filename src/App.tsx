import { useState, useCallback, useRef, useEffect, lazy, Suspense } from 'react'
import { useHabits } from './useHabits'
import { useMemos } from './useMemos'
import { useDailyMood } from './useDailyMood'
import { useXP } from './useXP'
import { useBadges } from './useBadges'
import { useRewards } from './useRewards'
import { useFreezes } from './useFreezes'
import { DataManager } from './components/DataManager'
import { ReminderSettings, initReminder } from './components/ReminderSettings'
import { useToast, ToastContainer } from './components/Toast'
import { Celebration } from './components/Celebration'
import { Onboarding, shouldShowOnboarding } from './components/Onboarding'
import { XPBar } from './components/XPBar'
import { BadgeWall } from './components/BadgeWall'
import { RewardManager } from './components/RewardManager'
import { useTheme } from './useTheme'
import { useI18n } from './i18n'
import { useSync, generateSyncCode } from './SyncContext'
import { getOverallStreak, activeHabits } from './stats'
import { XP_PER_BASIC, XP_PER_ADVANCED, XP_PER_SPECIAL } from './types'
import { AuroraBackground } from './components/AuroraBackground'
import './App.css'

const Dashboard = lazy(() => import('./components/Dashboard').then(m => ({ default: m.Dashboard })))
const DailyCheckIn = lazy(() => import('./components/DailyCheckIn').then(m => ({ default: m.DailyCheckIn })))
const HabitManage = lazy(() => import('./components/HabitManage').then(m => ({ default: m.HabitManage })))
const TrendChart = lazy(() => import('./components/TrendChart').then(m => ({ default: m.TrendChart })))

type Tab = 'overview' | 'daily' | 'habits' | 'trend'

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'overview', label: '总览', icon: '◈' },
  { id: 'daily', label: '打卡', icon: '▣' },
  { id: 'habits', label: '管理', icon: '⚙' },
  { id: 'trend', label: '趋势', icon: '◆' },
]

const TAB_INDEX: Record<Tab, number> = { overview: 0, daily: 1, habits: 2, trend: 3 }
const TAB_IDS: Tab[] = ['overview', 'daily', 'habits', 'trend']

export default function App() {
  const [tab, setTab] = useState<Tab>('overview')
  const [tabKey, setTabKey] = useState(0)
  const [slideDir, setSlideDir] = useState<'left' | 'right'>('right')
  const [showOnboarding, setShowOnboarding] = useState(shouldShowOnboarding)
  const prevTabRef = useRef(0)
  const { toasts, toast } = useToast()
  const { theme, toggleTheme } = useTheme()
  const { locale, setLocale } = useI18n()
  const { syncStatus, syncCode, connect, disconnect } = useSync()
  const [showSyncPanel, setShowSyncPanel] = useState(false)
  const [syncInput, setSyncInput] = useState('')

  useEffect(() => { initReminder() }, [])

  const switchTab = useCallback((t: Tab) => {
    const newIdx = TAB_INDEX[t]
    setSlideDir(newIdx >= prevTabRef.current ? 'right' : 'left')
    prevTabRef.current = newIdx
    setTab(t)
    setTabKey(k => k + 1)
  }, [])

  // Keyboard shortcuts (D4)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (e.key >= '1' && e.key <= '4') {
        e.preventDefault()
        switchTab(TAB_IDS[parseInt(e.key) - 1])
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [switchTab])

  const {
    habits,
    checkIns,
    refresh,
    addHabit: rawAddHabit,
    updateHabit: rawUpdateHabit,
    removeHabit: rawRemoveHabit,
    moveHabit,
    archiveHabit,
    unarchiveHabit,
    toggleCheckIn: rawToggleCheckIn,
    skipCheckIn: rawSkipCheckIn,
    setCheckInNote,
    getCheckInStatus,
    getCheckInNote,
    addSpecialCheckIn: rawAddSpecial,
    removeOneSpecialCheckIn,
    isCheckedIn,
    getSpecialCount,
  } = useHabits()
  const { getMemo, setMemo, refresh: refreshMemos } = useMemos()
  const { getMood, setMood, refresh: refreshMood } = useDailyMood()
  const { xp, addXP } = useXP()
  const { unlockedIds, checkAndUnlock } = useBadges()
  const { rewards, addReward, redeemReward: rawRedeemReward, removeReward } = useRewards()
  const { freezes } = useFreezes()

  // Update badges whenever relevant data changes
  useEffect(() => {
    const active = activeHabits(habits)
    const totalCheckins = checkIns.filter(c => !c.status || c.status === 'done').length
    const longestStreak = getOverallStreak(habits, checkIns)
    const totalDays = habits.length > 0
      ? Math.ceil((Date.now() - Math.min(...habits.map(h => new Date(h.createdAt).getTime()))) / 86400000)
      : 0
    checkAndUnlock({ totalCheckins, longestStreak, totalDays, habits: active.length })
  }, [habits, checkIns, checkAndUnlock])

  const refreshAll = useCallback(() => {
    refresh()
    refreshMemos()
    refreshMood()
  }, [refresh, refreshMemos, refreshMood])

  const addHabit = useCallback((...args: Parameters<typeof rawAddHabit>) => {
    rawAddHabit(...args)
    toast('习惯已添加', 'success')
  }, [rawAddHabit, toast])

  const updateHabit = useCallback((...args: Parameters<typeof rawUpdateHabit>) => {
    rawUpdateHabit(...args)
    toast('修改已保存', 'success')
  }, [rawUpdateHabit, toast])

  const removeHabit = useCallback((...args: Parameters<typeof rawRemoveHabit>) => {
    rawRemoveHabit(...args)
    toast('习惯已删除', 'warning')
  }, [rawRemoveHabit, toast])

  const toggleCheckIn = useCallback((habitId: string, date: string) => {
    const wasDone = isCheckedIn(habitId, date)
    rawToggleCheckIn(habitId, date)
    if (!wasDone) {
      const h = habits.find(x => x.id === habitId)
      const amount = h?.type === 'advanced' ? XP_PER_ADVANCED : h?.type === 'special' ? XP_PER_SPECIAL : XP_PER_BASIC
      addXP(amount)
    }
    toast(wasDone ? '已取消打卡' : '打卡成功！', wasDone ? 'info' : 'success')
  }, [rawToggleCheckIn, isCheckedIn, toast, habits, addXP])

  const skipCheckIn = useCallback((habitId: string, date: string) => {
    rawSkipCheckIn(habitId, date)
    toast('已标记跳过', 'info')
  }, [rawSkipCheckIn, toast])

  const addSpecialCheckIn = useCallback((habitId: string, date: string) => {
    rawAddSpecial(habitId, date)
    addXP(XP_PER_SPECIAL)
    toast('+1 打卡记录', 'success')
  }, [rawAddSpecial, toast, addXP])

  const skeletonFallback = (
    <div className="skeleton-wrap">
      <div className="skeleton-block skeleton-title" />
      <div className="skeleton-block skeleton-card" />
      <div className="skeleton-block skeleton-card" />
    </div>
  )

  return (
    <div className="app">
      {theme === 'dark' && <AuroraBackground />}
      <header className="header">
        <h1 className="logo">HABIT_TRACKER<span className="logo-sub"> // 习惯打卡</span></h1>
        <div className="header-controls">
          <div className="sync-wrapper">
            <button
              type="button"
              className={`header-ctrl-btn sync-btn ${syncCode ? 'sync-active' : ''}`}
              onClick={() => setShowSyncPanel(p => !p)}
              title={syncCode ? `同步码: ${syncCode}` : '点击同步数据'}
            >
              {syncCode && <span className={`sync-dot sync-${syncStatus}`} />}
              ⇄
            </button>
            {showSyncPanel && (
              <>
              <div className="sync-panel-backdrop" onClick={() => setShowSyncPanel(false)} />
              <div className="sync-panel">
                {syncCode ? (
                  <>
                    <div className="sync-panel-label">同步码</div>
                    <div className="sync-panel-code">{syncCode}</div>
                    <div className="sync-panel-status">
                      <span className={`sync-dot sync-${syncStatus}`} />
                      {syncStatus === 'synced' ? '已同步' : syncStatus === 'syncing' ? '同步中...' : syncStatus === 'error' ? '同步失败' : '未连接'}
                    </div>
                    <button
                      type="button"
                      className="sync-panel-btn"
                      onClick={() => { navigator.clipboard?.writeText(syncCode); toast('已复制同步码', 'success') }}
                    >复制同步码</button>
                    <button
                      type="button"
                      className="sync-panel-btn sync-panel-btn-danger"
                      onClick={() => { disconnect(); setShowSyncPanel(false) }}
                    >断开同步</button>
                  </>
                ) : (
                  <>
                    <div className="sync-panel-label">输入同步码连接</div>
                    <input
                      className="sync-panel-input"
                      value={syncInput}
                      onChange={e => setSyncInput(e.target.value.toUpperCase())}
                      placeholder="如 ABCD1234"
                      maxLength={8}
                    />
                    <button
                      type="button"
                      className="sync-panel-btn"
                      disabled={syncInput.trim().length < 4}
                      onClick={() => { connect(syncInput.trim()); setSyncInput(''); setShowSyncPanel(false); toast('已连接同步', 'success') }}
                    >开始同步</button>
                    <div className="sync-panel-divider">或</div>
                    <button
                      type="button"
                      className="sync-panel-btn sync-panel-btn-gen"
                      onClick={() => { const code = generateSyncCode(); connect(code); setSyncInput(''); setShowSyncPanel(false); toast(`同步码: ${code}，请记住！`, 'success') }}
                    >生成新同步码</button>
                  </>
                )}
              </div>
              </>
            )}
          </div>
          <button type="button" className="header-ctrl-btn" onClick={toggleTheme} title={theme === 'dark' ? '切换亮色' : '切换暗色'}>
            {theme === 'dark' ? '☀' : '☾'}
          </button>
          <button type="button" className="header-ctrl-btn" onClick={() => setLocale(locale === 'zh' ? 'en' : 'zh')} title="切换语言">
            {locale === 'zh' ? 'EN' : '中'}
          </button>
        </div>
        <nav className="tabs">
          {TABS.map((t, i) => (
            <button
              key={t.id}
              type="button"
              className={`tab ${tab === t.id ? 'active' : ''}`}
              onClick={() => switchTab(t.id)}
              title={`快捷键: ${i + 1}`}
            >
              <span className="tab-icon">{t.icon}</span> {t.label}
            </button>
          ))}
        </nav>
      </header>

      <main className={`main main-slide-${slideDir}`} key={tabKey}>
        <Suspense fallback={skeletonFallback}>
          {tab === 'overview' && <Dashboard habits={habits} checkIns={checkIns} getMood={getMood} isCheckedIn={isCheckedIn} toggleCheckIn={toggleCheckIn} onGoManage={() => switchTab('habits')} xp={xp.total} unlockedBadgeIds={unlockedIds} freezes={freezes} />}
          {tab === 'daily' && (
            <DailyCheckIn
              habits={habits}
              checkIns={checkIns}
              isCheckedIn={isCheckedIn}
              toggleCheckIn={toggleCheckIn}
              skipCheckIn={skipCheckIn}
              getCheckInStatus={getCheckInStatus}
              getCheckInNote={getCheckInNote}
              setCheckInNote={setCheckInNote}
              addSpecialCheckIn={addSpecialCheckIn}
              removeOneSpecialCheckIn={removeOneSpecialCheckIn}
              getSpecialCount={getSpecialCount}
              getMemo={getMemo}
              setMemo={setMemo}
              getMood={getMood}
              setMood={setMood}
              onGoManage={() => switchTab('habits')}
            />
          )}
          {tab === 'habits' && (
            <>
              <HabitManage
                habits={habits}
                addHabit={addHabit}
                updateHabit={updateHabit}
                removeHabit={removeHabit}
                moveHabit={moveHabit}
                archiveHabit={archiveHabit}
                unarchiveHabit={unarchiveHabit}
              />
              <XPBar totalXp={xp.total} />
              <BadgeWall unlockedIds={unlockedIds} />
              <RewardManager rewards={rewards} xpBalance={xp.total} addReward={addReward} redeemReward={(id: string) => { const r = rewards.find(x => x.id === id); if (r && xp.total >= r.cost) { addXP(-r.cost); rawRedeemReward(id) } }} removeReward={removeReward} />
              <ReminderSettings />
              <DataManager onImported={refreshAll} habits={habits} checkIns={checkIns} />
            </>
          )}
          {tab === 'trend' && <TrendChart habits={habits} checkIns={checkIns} />}
        </Suspense>
      </main>

      <nav className="tabs-nav-bottom" aria-label="主导航">
        {TABS.map(t => (
          <button
            key={t.id}
            type="button"
            className={`tab ${tab === t.id ? 'active' : ''}`}
            onClick={() => switchTab(t.id)}
          >
            <span className="tab-icon">{t.icon}</span>
            <span className="tab-label-mobile">{t.label}</span>
          </button>
        ))}
      </nav>

      <Celebration habits={habits} checkIns={checkIns} />
      <ToastContainer toasts={toasts} />
      {showOnboarding && <Onboarding onDone={() => setShowOnboarding(false)} />}
    </div>
  )
}
