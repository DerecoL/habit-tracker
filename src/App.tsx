import { useState, useCallback, useRef, useEffect, lazy, Suspense } from 'react'
import { useHabits } from './useHabits'
import { useMemos } from './useMemos'
import { useDailyMood } from './useDailyMood'
import { DataManager } from './components/DataManager'
import { ReminderSettings, initReminder } from './components/ReminderSettings'
import { useToast, ToastContainer } from './components/Toast'
import { Celebration } from './components/Celebration'
import { Onboarding, shouldShowOnboarding } from './components/Onboarding'
import { useTheme } from './useTheme'
import { useI18n } from './i18n'
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

export default function App() {
  const [tab, setTab] = useState<Tab>('overview')
  const [tabKey, setTabKey] = useState(0)
  const [slideDir, setSlideDir] = useState<'left' | 'right'>('right')
  const [showOnboarding, setShowOnboarding] = useState(shouldShowOnboarding)
  const prevTabRef = useRef(0)
  const { toasts, toast } = useToast()
  const { theme, toggleTheme } = useTheme()
  const { locale, setLocale } = useI18n()

  useEffect(() => { initReminder() }, [])

  const switchTab = useCallback((t: Tab) => {
    const newIdx = TAB_INDEX[t]
    setSlideDir(newIdx >= prevTabRef.current ? 'right' : 'left')
    prevTabRef.current = newIdx
    setTab(t)
    setTabKey(k => k + 1)
  }, [])

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
    addSpecialCheckIn: rawAddSpecial,
    removeOneSpecialCheckIn,
    isCheckedIn,
    getSpecialCount,
  } = useHabits()
  const { getMemo, setMemo, refresh: refreshMemos } = useMemos()
  const { getMood, setMood, refresh: refreshMood } = useDailyMood()

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
    toast(wasDone ? '已取消打卡' : '打卡成功！', wasDone ? 'info' : 'success')
  }, [rawToggleCheckIn, isCheckedIn, toast])

  const addSpecialCheckIn = useCallback((habitId: string, date: string) => {
    rawAddSpecial(habitId, date)
    toast('+1 打卡记录', 'success')
  }, [rawAddSpecial, toast])

  return (
    <div className="app">
      <header className="header">
        <h1 className="logo">HABIT_TRACKER<span className="logo-sub"> // 习惯打卡</span></h1>
        <div className="header-controls">
          <button type="button" className="header-ctrl-btn" onClick={toggleTheme} title={theme === 'dark' ? '切换亮色' : '切换暗色'}>
            {theme === 'dark' ? '☀' : '☾'}
          </button>
          <button type="button" className="header-ctrl-btn" onClick={() => setLocale(locale === 'zh' ? 'en' : 'zh')} title="切换语言">
            {locale === 'zh' ? 'EN' : '中'}
          </button>
        </div>
        <nav className="tabs">
          {TABS.map(t => (
            <button
              key={t.id}
              type="button"
              className={`tab ${tab === t.id ? 'active' : ''}`}
              onClick={() => switchTab(t.id)}
            >
              <span className="tab-icon">{t.icon}</span> {t.label}
            </button>
          ))}
        </nav>
      </header>

      <main className={`main main-slide-${slideDir}`} key={tabKey}>
        <Suspense fallback={<div className="loading-fallback">加载中…</div>}>
          {tab === 'overview' && <Dashboard habits={habits} checkIns={checkIns} getMood={getMood} isCheckedIn={isCheckedIn} toggleCheckIn={toggleCheckIn} onGoManage={() => switchTab('habits')} />}
          {tab === 'daily' && (
            <DailyCheckIn
              habits={habits}
              checkIns={checkIns}
              isCheckedIn={isCheckedIn}
              toggleCheckIn={toggleCheckIn}
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
              <ReminderSettings />
              <DataManager onImported={refreshAll} />
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
