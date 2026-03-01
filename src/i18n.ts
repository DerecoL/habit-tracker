import { useState, useCallback, useEffect } from 'react'

export type Locale = 'zh' | 'en'

const STORAGE_KEY = 'habit-tracker-locale'

interface Messages {
  appTitle: string
  appSub: string
  tabOverview: string
  tabDaily: string
  tabManage: string
  tabTrend: string
  today: string
  thisWeek: string
  thisMonth: string
  thisYear: string
  basic: string
  advanced: string
  special: string
  addHabit: string
  save: string
  cancel: string
  delete: string
  confirmDelete: string
  archive: string
  restore: string
  archived: string
  templates: string
  hideTemplates: string
  noHabits: string
  goAddHabit: string
  loading: string
  export: string
  import: string
  importing: string
  reminder: string
  reminderOn: string
  reminderOff: string
  switchLight: string
  switchDark: string
  overallRate: string
  perfectDays: string
  currentStreak: string
  avgMood: string
  bestDay: string
  totalCheckins: string
  monthReport: string
  yearReport: string
  insight90: string
  moodCorrelation: string
}

const zh: Messages = {
  appTitle: 'HABIT_TRACKER',
  appSub: '习惯打卡',
  tabOverview: '总览',
  tabDaily: '打卡',
  tabManage: '管理',
  tabTrend: '趋势',
  today: '今日',
  thisWeek: '本周',
  thisMonth: '本月',
  thisYear: '本年',
  basic: '基础',
  advanced: '进阶',
  special: '特殊',
  addHabit: '添加习惯',
  save: '保存',
  cancel: '取消',
  delete: '删除',
  confirmDelete: '确认删除？',
  archive: '归档',
  restore: '恢复',
  archived: '已归档',
  templates: '快捷模板',
  hideTemplates: '收起模板',
  noHabits: '暂无习惯，请在上方添加',
  goAddHabit: '去添加习惯',
  loading: '加载中…',
  export: '导出数据',
  import: '导入数据',
  importing: '导入中…',
  reminder: '打卡提醒',
  reminderOn: '已开启',
  reminderOff: '已关闭',
  switchLight: '切换亮色',
  switchDark: '切换暗色',
  overallRate: '总完成率',
  perfectDays: '全勤天数',
  currentStreak: '当前连续',
  avgMood: '平均心情',
  bestDay: '最佳打卡日',
  totalCheckins: '总打卡次数',
  monthReport: '本月',
  yearReport: '本年',
  insight90: '数据洞察（近 90 天）',
  moodCorrelation: '心情 × 完成率',
}

const en: Messages = {
  appTitle: 'HABIT_TRACKER',
  appSub: 'Habit Check-in',
  tabOverview: 'Overview',
  tabDaily: 'Daily',
  tabManage: 'Manage',
  tabTrend: 'Trends',
  today: 'Today',
  thisWeek: 'This Week',
  thisMonth: 'This Month',
  thisYear: 'This Year',
  basic: 'Basic',
  advanced: 'Advanced',
  special: 'Special',
  addHabit: 'Add Habit',
  save: 'Save',
  cancel: 'Cancel',
  delete: 'Delete',
  confirmDelete: 'Confirm?',
  archive: 'Archive',
  restore: 'Restore',
  archived: 'Archived',
  templates: 'Templates',
  hideTemplates: 'Hide Templates',
  noHabits: 'No habits yet. Add one above.',
  goAddHabit: 'Add Habit',
  loading: 'Loading…',
  export: 'Export',
  import: 'Import',
  importing: 'Importing…',
  reminder: 'Reminder',
  reminderOn: 'On',
  reminderOff: 'Off',
  switchLight: 'Light mode',
  switchDark: 'Dark mode',
  overallRate: 'Rate',
  perfectDays: 'Perfect Days',
  currentStreak: 'Streak',
  avgMood: 'Avg Mood',
  bestDay: 'Best Day',
  totalCheckins: 'Total',
  monthReport: 'Month',
  yearReport: 'Year',
  insight90: 'Insights (90 days)',
  moodCorrelation: 'Mood × Rate',
}

const messages: Record<Locale, Messages> = { zh, en }

export type { Messages }

function getInitialLocale(): Locale {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved === 'zh' || saved === 'en') return saved
  return 'zh'
}

export function useI18n() {
  const [locale, setLocaleState] = useState<Locale>(getInitialLocale)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, locale)
  }, [locale])

  const setLocale = useCallback((l: Locale) => { setLocaleState(l) }, [])
  const t = messages[locale]

  return { locale, setLocale, t }
}
