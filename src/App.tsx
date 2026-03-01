import { useState, useCallback, useRef } from 'react'
import { useHabits } from './useHabits'
import { useMemos } from './useMemos'
import { useDailyMood } from './useDailyMood'
import { Dashboard } from './components/Dashboard'
import { DailyCheckIn } from './components/DailyCheckIn'
import { HabitManage } from './components/HabitManage'
import { TrendChart } from './components/TrendChart'
import { DataManager } from './components/DataManager'
import { useToast, ToastContainer } from './components/Toast'
import { Celebration } from './components/Celebration'
import './App.css'

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
  const prevTabRef = useRef(0)
  const { toasts, toast } = useToast()

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
    toggleCheckIn: rawToggleCheckIn,
    addSpecialCheckIn: rawAddSpecial,
    removeOneSpecialCheckIn,
    isCheckedIn,
    getSpecialCount,
  } = useHabits()
  const { getMemo, setMemo } = useMemos()
  const { getMood, setMood } = useDailyMood()

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
            />
            <DataManager onImported={refresh} />
          </>
        )}
        {tab === 'trend' && <TrendChart habits={habits} checkIns={checkIns} />}
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
    </div>
  )
}
