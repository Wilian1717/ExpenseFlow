'use client'

// ─── Shared types, constants, utils and small components used by both the
//     Beginner and Expert dashboard views. Moved verbatim from page.tsx. ─────

import { useEffect, useState, useRef, useId, useMemo } from 'react'
import ReactDOM from 'react-dom'
import {
  UtensilsCrossed, Car, ShoppingBag, HeartPulse, User, Home, Zap, Tv,
  PiggyBank, MoreHorizontal, Briefcase, DollarSign, BarChart2, TrendingUp,
  TrendingDown, Flame, AlertTriangle, MoreVertical, ChevronDown, Calendar, Check, Lightbulb
} from 'lucide-react'

export type Category = 'food' | 'transport' | 'shopping' | 'health' | 'personal' | 'housing' | 'utilities' | 'entertainment' | 'savings' | 'other'
export type IncomeCategory = 'salary' | 'freelance' | 'business' | 'investment' | 'other'
export type Frequency = 'daily' | 'weekly' | 'monthly'
export type SortOrder = 'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc'

export interface Expense {
  id: string; user_id: string; title: string; amount: number
  category: Category; note?: string; created_at: string
}
export interface Income {
  id: string; user_id: string; title: string; amount: number
  category: IncomeCategory; note?: string; created_at: string
}
export interface Budget {
  id: string; user_id: string; category: Category; limit_amount: number; month: string
}
export interface BudgetProfile {
  id: string; user_id: string; name: string
  sim_income: number
  category_budgets: Partial<Record<Category, number>>
  goal_allocations: Record<string, number>
  created_at: string; updated_at: string
}
export interface SavingsGoal {
  id: string; user_id: string; title: string; target_amount: number
  current_amount: number; deadline?: string; created_at: string
}
export interface GoalHistory {
  id: string; goal_id: string; user_id: string; amount: number; note?: string; created_at: string
}
export interface RecurringExpense {
  id: string; user_id: string; title: string; amount: number
  category: Category; frequency: Frequency; next_due: string; note?: string; created_at: string
  last_paid_date?: string
}
export interface ExpensePool {
  id: string; user_id: string; title: string; budget_amount: number
  category: Category; note?: string; created_at: string; is_archived: boolean
  is_reserved?: boolean   // counts toward "Reserved" money; undefined = true (column default)
}
export interface ExpensePoolEntry {
  id: string; pool_id: string; user_id: string; amount: number
  month: string; note?: string; expense_id?: string; created_at: string
}
export interface ExpensePoolWithStats {
  pool: ExpensePool; entries: ExpensePoolEntry[]
  spent: number; remaining: number; pct: number
}
export interface SplitBill {
  id: string; user_id: string; title: string; total_amount: number
  category: Category; note?: string; is_archived: boolean; created_at: string
}
export interface SplitBillParticipant {
  id: string; bill_id: string; user_id: string; name: string
  share_amount: number; is_paid: boolean; created_at: string
}
export interface SplitBillWithStats {
  bill: SplitBill; participants: SplitBillParticipant[]
  owed: number; collected: number; paidCount: number; settled: boolean
}
export interface Debt {
  id: string; user_id: string; person_name: string; amount: number
  note?: string; due_date?: string; is_archived: boolean; created_at: string
}
export interface DebtPayment {
  id: string; debt_id: string; user_id: string; amount: number
  note?: string; created_at: string
}
export interface DebtWithStats {
  debt: Debt; payments: DebtPayment[]
  paid: number; remaining: number; pct: number; settled: boolean; overdue: boolean
}

// ─── Daily spending ───────────────────────────────────────────────────────────
export interface DaySpend {
  day: number        // 1..daysInMonth
  dow: number        // 0=Sun .. 6=Sat (local weekday)
  total: number      // expenses only
  count: number      // transaction count
  isFuture: boolean  // hasn't happened yet — never the same as "spent nothing"
  isToday: boolean
}
export interface DailySpendData {
  days: DaySpend[]; daysInMonth: number; leadingBlanks: number
  elapsedDays: number; isCurrentMonth: boolean; todayDay: number | null
  monthTotal: number; maxDay: number
  spentDayCount: number; noSpendDayCount: number
  avgPerActiveDay: number; medianActiveDay: number
}
export interface DowStat {
  idx: number; label: string; total: number
  occurrences: number; avg: number; txCount: number
}
export interface DailyRecords {
  highest: DaySpend | null; quietest: DaySpend | null
  longestNoSpend: number; longestNoSpendEnd: number
  currentNoSpend: number
  heaviestDow: DowStat | null; lightestDow: DowStat | null
  weekendAvg: number; weekdayAvg: number
}

export const CATEGORY_CONFIG: Record<Category, { label: string; icon: React.ReactNode; bg: string; text: string }> = {
  food:          { label: 'Food & dining',  icon: <UtensilsCrossed size={14} />, bg: 'bg-green-50',   text: 'text-green-800'  },
  transport:     { label: 'Transport',      icon: <Car size={14} />,             bg: 'bg-blue-50',    text: 'text-blue-800'   },
  shopping:      { label: 'Shopping',       icon: <ShoppingBag size={14} />,     bg: 'bg-amber-50',   text: 'text-amber-800'  },
  health:        { label: 'Health',         icon: <HeartPulse size={14} />,      bg: 'bg-red-50',     text: 'text-red-800'    },
  personal:      { label: 'Personal',       icon: <User size={14} />,            bg: 'bg-purple-50',  text: 'text-purple-800' },
  housing:       { label: 'Housing',        icon: <Home size={14} />,            bg: 'bg-orange-50',  text: 'text-orange-800' },
  utilities:     { label: 'Utilities',      icon: <Zap size={14} />,             bg: 'bg-cyan-50',    text: 'text-cyan-800'   },
  entertainment: { label: 'Entertainment',  icon: <Tv size={14} />,              bg: 'bg-pink-50',    text: 'text-pink-800'   },
  savings:       { label: 'Savings goals',  icon: <PiggyBank size={14} />,       bg: 'bg-emerald-50', text: 'text-emerald-800'},
  other:         { label: 'Other',          icon: <MoreHorizontal size={14} />,  bg: 'bg-gray-100',   text: 'text-gray-700'   },
}

// Real hex colors for the category donut chart (CATEGORY_CONFIG only carries Tailwind classes)
export const CATEGORY_COLOR: Record<Category, string> = {
  food: '#16a34a', transport: '#2563eb', shopping: '#d97706', health: '#dc2626',
  personal: '#9333ea', housing: '#ea580c', utilities: '#0891b2',
  entertainment: '#db2777', savings: '#059669', other: '#6b7280',
}
export const INCOME_CONFIG: Record<IncomeCategory, { label: string; icon: React.ReactNode }> = {
  salary:     { label: 'Salary',     icon: <Briefcase size={14} />  },
  freelance:  { label: 'Freelance',  icon: <DollarSign size={14} /> },
  business:   { label: 'Business',   icon: <BarChart2 size={14} />  },
  investment: { label: 'Investment', icon: <TrendingUp size={14} /> },
  other:      { label: 'Other',      icon: <PiggyBank size={14} />  },
}
export const FREQ_LABELS: Record<Frequency, string> = { daily: 'Daily', weekly: 'Weekly', monthly: 'Monthly' }
export const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
export const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

export function fmtFull(amount: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount)
}
export function fmt(amount: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount)
}
export function fmtShort(amount: number): string {
  if (amount >= 1_000_000_000_000) return `Rp ${(amount / 1_000_000_000_000).toFixed(2)}T`
  if (amount >= 1_000_000_000)     return `Rp ${(amount / 1_000_000_000).toFixed(1)}M`
  if (amount >= 1_000_000)         return `Rp ${(amount / 1_000_000).toFixed(1)}jt`
  if (amount >= 1_000)             return `Rp ${(amount / 1_000).toFixed(0)}rb`
  return `Rp ${amount}`
}
// Thousand-separated input helpers (Indonesian grouping, e.g. 2300000 -> "2.300.000")
export function groupId(n: number): string {
  return n ? n.toLocaleString('id-ID') : ''
}
export function parseRp(str: string): number {
  return parseInt(str.replace(/\D/g, ''), 10) || 0
}
export function inMonth(dateStr: string, month: string): boolean {
  const d = new Date(dateStr)
  const local = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  return local === month
}
export function currentMonth() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}
export function daysLeftInMonth(monthIso: string): number | null {
  if (monthIso !== currentMonth()) return null
  const now = new Date()
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  return end.getDate() - now.getDate()
}
export function getMonthLabelFull(iso: string) {
  const [year, month] = iso.split('-')
  return `${MONTHS[parseInt(month) - 1]} ${year}`
}
export function getMonthLabelShort(iso: string) {
  const [year, month] = iso.split('-')
  return `${MONTHS_SHORT[parseInt(month) - 1]} '${year.slice(2)}`
}
export function nextDueDate(current: string, frequency: Frequency): string {
  const d = new Date(current)
  if (frequency === 'daily')   d.setDate(d.getDate() + 1)
  if (frequency === 'weekly')  d.setDate(d.getDate() + 7)
  if (frequency === 'monthly') d.setMonth(d.getMonth() + 1)
  return d.toISOString().slice(0, 10)
}

// Normalize a recurring amount to its monthly equivalent (52 weeks / 12 months = 4.33)
export function monthlyEquivalent(amount: number, frequency: Frequency): number {
  return frequency === 'daily' ? amount * 30 : frequency === 'weekly' ? amount * 4.33 : amount
}
// Percentage text — guards Infinity/NaN so "Infinity%" can never render
export function pctText(n: number, digits = 0): string {
  return Number.isFinite(n) ? `${n.toFixed(digits)}%` : '—'
}
// Budget-usage colour ramp. Class strings stay whole literals for Tailwind's scanner.
export function usageTone(pct: number): { bar: string; text: string; chip: string } {
  if (!Number.isFinite(pct) || pct >= 100) return { bar: 'bg-red-500',   text: 'text-red-600',   chip: 'bg-red-50 text-red-600' }
  if (pct >= 80)                           return { bar: 'bg-amber-500', text: 'text-amber-600', chip: 'bg-amber-50 text-amber-700' }
  return                                          { bar: 'bg-gray-900',  text: 'text-gray-600',  chip: 'bg-gray-100 text-gray-600' }
}
// Savings-rate colour ramp
export function savingsTone(rate: number): { text: string; chip: string } {
  if (rate >= 20) return { text: 'text-emerald-600', chip: 'bg-emerald-50 text-emerald-700' }
  if (rate >= 10) return { text: 'text-amber-600',   chip: 'bg-amber-50 text-amber-700' }
  return          { text: 'text-red-500',            chip: 'bg-red-50 text-red-600' }
}

// Monday-first: ISO / Indonesian convention, and it keeps Sat+Sun adjacent so
// the weekend reads as one visual block.
export const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
// GitHub-contribution style sequential ramp (empty gray -> light -> deep green).
// Single-hue and sequential: it says "more", never "bad". Luminance drops
// monotonically so it still reads correctly in grayscale.
export const HEAT_COLORS = ['#ebedf0', '#9be9a8', '#40c463', '#30a14e', '#216e39']

/**
 * Heat level 0-4 per day, by quantile (empirical-CDF rank) over elapsed days
 * that had spending — NOT linear against the max. With rent of Rp 5.000.000 on
 * the 1st and ~Rp 80.000 on other days, a max-relative scale would render one
 * black square in a sea of white and destroy all real variation.
 */
export function heatLevels(days: DaySpend[]): number[] {
  const active = days.filter(d => !d.isFuture && d.total > 0)
                     .map(d => d.total).sort((a, b) => a - b)
  if (active.length === 0) return days.map(() => 0)
  const lo = active[0], hi = active[active.length - 1]
  return days.map(d => {
    if (d.isFuture || d.total === 0) return 0
    if (hi === lo) return 3                   // flat month -> uniform mid tone
    const rank = active.filter(v => v <= d.total).length
    return Math.min(4, Math.max(1, Math.ceil((rank / active.length) * 4)))
  })
}

export function localISOString(): string {
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`
}

export function dateWithCurrentTime(dateStr: string): string {
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${dateStr}T${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`
}

export function exportCSV(expenses: Expense[], income: Income[], month: string) {
  const rows: string[] = [
    'Type,Date,Description,Category,Amount,Note',
    ...expenses.filter(e => inMonth(e.created_at, month)).map(e => [
      'Expense', new Date(e.created_at).toLocaleDateString('en-US'),
      `"${e.title.replace(/"/g, '""')}"`, CATEGORY_CONFIG[e.category].label, e.amount,
      `"${(e.note || '').replace(/"/g, '""')}"`
    ].join(',')),
    ...income.filter(i => inMonth(i.created_at, month)).map(i => [
      'Income', new Date(i.created_at).toLocaleDateString('en-US'),
      `"${i.title.replace(/"/g, '""')}"`, INCOME_CONFIG[i.category].label, i.amount,
      `"${(i.note || '').replace(/"/g, '""')}"`
    ].join(','))
  ]
  const blob = new Blob([rows.join('\n')], { type: 'text/csv' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href = url; a.download = `expenses-${month}.csv`; a.click()
  URL.revokeObjectURL(url)
}

export function scrollHorizontally(e: React.WheelEvent<HTMLDivElement>) {
  if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) e.currentTarget.scrollLeft += e.deltaY
}

// ─── Three-dot context menu (portal) ─────────────────────────────────────────
export function RowMenu({ items }: {
  items: { label: string; icon: React.ReactNode; onClick: () => void; danger?: boolean; disabled?: boolean }[]
}) {
  const [open, setOpen] = useState(false)
  const [pos, setPos]   = useState<{ top: number; left: number } | null>(null)
  const btnRef          = useRef<HTMLButtonElement>(null)

  const handleOpen = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect()
      const menuW = 144
      const menuH = items.length * 34 + 8 // approx row height + py-1 padding
      // Open to the left of the dots (covering the amount) and vertically centered
      // on the button — consistent for every row, then clamped inside the viewport.
      const left = Math.min(Math.max(rect.right - menuW, 8), window.innerWidth - menuW - 8)
      const top  = Math.min(Math.max(rect.top + rect.height / 2 - menuH / 2, 8), window.innerHeight - menuH - 8)
      setPos({ top, left })
    }
    setOpen(v => !v)
  }

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (btnRef.current && !btnRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  useEffect(() => {
    if (!open) return
    const handler = () => setOpen(false)
    window.addEventListener('scroll', handler, true)
    return () => window.removeEventListener('scroll', handler, true)
  }, [open])

  const dropdown = open && pos ? ReactDOM.createPortal(
    <div style={{ position: 'fixed', top: pos.top, left: pos.left, width: 144, zIndex: 9999 }}
      className="bg-white border border-gray-100 rounded-xl shadow-xl py-1 animate-slide-up"
      onMouseDown={e => e.stopPropagation()}>
      {items.map((item, i) => (
        <button key={i} disabled={item.disabled}
          onClick={e => { e.stopPropagation(); item.onClick(); setOpen(false) }}
          className={`w-full flex items-center gap-2.5 px-3.5 py-2 text-xs transition-colors disabled:opacity-40 ${item.danger ? 'text-red-500 hover:bg-red-50' : 'text-gray-700 hover:bg-gray-50'}`}>
          {item.icon}{item.label}
        </button>
      ))}
    </div>,
    document.body
  ) : null

  return (
    <div className="relative shrink-0">
      <button ref={btnRef} onClick={handleOpen}
        className={`p-1.5 rounded-lg transition-all ${open ? 'bg-gray-100 text-black' : 'text-gray-400 hover:text-black hover:bg-gray-100'}`}>
        <MoreVertical size={15} />
      </button>
      {dropdown}
    </div>
  )
}

// ─── Collapsible Section ──────────────────────────────────────────────────────
export function CollapsibleSection({ title, icon, children, defaultOpen = true, headerRight, badge, badgeColor = 'bg-black' }: {
  title: string; icon: React.ReactNode; children: React.ReactNode
  defaultOpen?: boolean; headerRight?: React.ReactNode; badge?: number; badgeColor?: string
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border border-gray-100 rounded-xl mb-4 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors">
        <button onClick={() => setOpen(v => !v)} className="flex items-center gap-2 flex-1 text-left">
          <span className="text-gray-400">{icon}</span>
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">{title}</p>
          {!open && badge !== undefined && badge > 0 && (
            <span className={`${badgeColor} text-white rounded-full text-[9px] w-4 h-4 flex items-center justify-center font-medium`}>{badge}</span>
          )}
          <ChevronDown size={12} className={`text-gray-300 transition-transform duration-300 ml-0.5 ${open ? 'rotate-0' : '-rotate-90'}`} />
        </button>
        {headerRight && <div className="ml-2">{headerRight}</div>}
      </div>
      <div style={{ maxHeight: open ? '2000px' : '0px', opacity: open ? 1 : 0, transition: 'max-height 0.35s ease, opacity 0.25s ease', overflow: 'hidden' }}>
        <div className="px-4 pb-4">{children}</div>
      </div>
    </div>
  )
}

// ─── Custom Month Picker Dropdown ────────────────────────────────────────────
export function MonthPickerDropdown({ months, selected, onChange, variant = 'default', size = 'md', align = 'left' }: {
  months: { key: string; label: string; total: number }[]
  selected: string
  onChange: (key: string) => void
  variant?: 'default' | 'pill'
  size?: 'sm' | 'md'
  align?: 'left' | 'right'
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const selectedLabel = getMonthLabelFull(selected)

  return (
    <div className="relative" ref={ref}>
      {variant === 'pill' ? (
        <button
          onClick={() => setOpen(v => !v)}
          className={`flex items-center rounded-full border shadow-sm transition-all whitespace-nowrap ${
            size === 'sm' ? 'gap-1.5 h-8 px-3 text-xs font-semibold' : 'gap-1.5 h-8 px-3 text-sm font-semibold'
          } ${open ? 'bg-black text-white border-black' : 'bg-white text-black border-gray-200 hover:border-gray-400'}`}
        >
          <Calendar size={size === 'sm' ? 12 : 13} className={open ? 'text-white' : 'text-black'} />
          {selectedLabel}
          <ChevronDown size={size === 'sm' ? 12 : 13} className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
        </button>
      ) : (
        <button
          onClick={() => setOpen(v => !v)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all border ${
            open ? 'bg-black text-white border-black' : 'bg-white text-gray-700 border-gray-200 hover:border-gray-400'
          }`}
        >
          <Calendar size={12} className={open ? 'text-white' : 'text-gray-400'} />
          {selectedLabel}
          <ChevronDown size={12} className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
        </button>
      )}

      {open && (
        <div className={`absolute ${align === 'right' ? 'right-0' : 'left-0'} top-full mt-2 w-52 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-[500] animate-slide-up`}>
          <div className="px-3 pt-3 pb-1">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Select month</p>
          </div>
          <div className="py-1.5 px-1.5 flex flex-col gap-0.5">
            {months.map(m => {
              const isSelected = m.key === selected
              return (
                <button
                  key={m.key}
                  onClick={() => { onChange(m.key); setOpen(false) }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm transition-all ${
                    isSelected ? 'bg-black text-white' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span className="font-medium">{getMonthLabelFull(m.key)}</span>
                  {m.total > 0 && (
                    <span className={`text-xs ${isSelected ? 'text-gray-300' : 'text-gray-400'}`}>
                      {fmtShort(m.total)}
                    </span>
                  )}
                  {isSelected && <Check size={13} className="text-white ml-1 shrink-0" />}
                </button>
              )
            })}
          </div>
          <div className="h-2" />
        </div>
      )}
    </div>
  )
}

// ─── Smart Insights ───────────────────────────────────────────────────────────
type SmartInsightsProps = {
  thisMonthTotal: number; lastMonthTotal: number; avgPerDay: number
  categoryTotals: Partial<Record<Category, number>>; thisMonthIncomeTot: number
  netSavings: number; budgets: Budget[]; budgetSpend: Partial<Record<Category, number>>
  freeToSpend?: number      // Beginner only: money left after reserved budgets + unpaid bills
}
type Insight = { icon: React.ReactNode; text: string; color: string; bg: string }

export function buildInsights({ thisMonthTotal, lastMonthTotal, avgPerDay, categoryTotals, thisMonthIncomeTot, netSavings, budgets, budgetSpend, freeToSpend }: SmartInsightsProps): Insight[] {
  const insights: Insight[] = []
  if (freeToSpend !== undefined && freeToSpend < 0 && netSavings >= 0)
    insights.push({ icon: <AlertTriangle size={13} />, text: `Your budgets and bills need ${fmt(Math.abs(freeToSpend))} more than you have left this month`, color: 'text-red-700', bg: 'bg-red-50' })
  if (lastMonthTotal > 0 && thisMonthTotal > 0) {
    const pct = ((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100
    if (pct > 10) insights.push({ icon: <TrendingUp size={13} />, text: `Spending is up ${pct.toFixed(0)}% vs last month`, color: 'text-red-700', bg: 'bg-red-50' })
    else if (pct < -10) insights.push({ icon: <TrendingDown size={13} />, text: `Great! Spending is down ${Math.abs(pct).toFixed(0)}% vs last month`, color: 'text-green-700', bg: 'bg-green-50' })
  }
  const topCat = (Object.keys(categoryTotals) as Category[]).sort((a, b) => (categoryTotals[b] || 0) - (categoryTotals[a] || 0))[0]
  if (topCat && thisMonthTotal > 0) {
    const pct = ((categoryTotals[topCat] || 0) / thisMonthTotal) * 100
    if (pct > 40) insights.push({ icon: <Flame size={13} />, text: `${CATEGORY_CONFIG[topCat].label} is ${pct.toFixed(0)}% of your spending this month`, color: 'text-amber-700', bg: 'bg-amber-50' })
  }
  const today = new Date()
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate()
  const projected = avgPerDay * daysInMonth
  if (lastMonthTotal > 0 && projected > lastMonthTotal * 1.15)
    insights.push({ icon: <TrendingUp size={13} />, text: `On pace for ${fmtShort(projected)} — ${fmtShort(projected - lastMonthTotal)} more than last month`, color: 'text-orange-700', bg: 'bg-orange-50' })
  if (thisMonthIncomeTot > 0) {
    const savingsRate = (netSavings / thisMonthIncomeTot) * 100
    if (savingsRate >= 20) insights.push({ icon: <PiggyBank size={13} />, text: `Saving ${savingsRate.toFixed(0)}% of income this month — solid!`, color: 'text-green-700', bg: 'bg-green-50' })
    else if (savingsRate < 0) insights.push({ icon: <AlertTriangle size={13} />, text: `Spending exceeds income by ${fmtShort(Math.abs(netSavings))} this month`, color: 'text-red-700', bg: 'bg-red-50' })
  }
  budgets.forEach(b => {
    const spent = budgetSpend[b.category] || 0; const pct = (spent / b.limit_amount) * 100
    if (pct >= 80 && pct < 100) insights.push({ icon: <AlertTriangle size={13} />, text: `${CATEGORY_CONFIG[b.category].label} budget is ${pct.toFixed(0)}% used`, color: 'text-amber-700', bg: 'bg-amber-50' })
    else if (pct >= 100) insights.push({ icon: <AlertTriangle size={13} />, text: `${CATEGORY_CONFIG[b.category].label} budget exceeded by ${fmtShort(spent - b.limit_amount)}`, color: 'text-red-700', bg: 'bg-red-50' })
  })
  return insights
}

export function SmartInsightsContent(props: SmartInsightsProps) {
  const insights = buildInsights(props)
  if (insights.length === 0) return <p className="text-xs text-gray-300 py-2 text-center">No insights yet — keep tracking!</p>
  return (
    <div className="flex flex-col gap-2">
      {insights.map((ins, i) => (
        <div key={i} className={`flex items-start gap-2.5 rounded-lg px-3 py-2.5 ${ins.bg}`}>
          <span className={`mt-0.5 shrink-0 ${ins.color}`}>{ins.icon}</span>
          <p className={`text-xs leading-relaxed ${ins.color}`}>{ins.text}</p>
        </div>
      ))}
    </div>
  )
}

// Beginner-view card version: green when every insight is good news, neutral otherwise
// so a warning never sits on a "good news" background.
export function SmartInsightsCard({ cardClass, ...props }: SmartInsightsProps & { cardClass: string }) {
  const [open, setOpen] = useState(true)
  const insights = buildInsights(props)
  const allPositive = insights.length > 0 && insights.every(i => i.color === 'text-green-700')
  return (
    <div className={`relative overflow-hidden mb-4 ${allPositive
      ? 'rounded-2xl border border-emerald-100 bg-linear-to-br from-emerald-50 via-emerald-50/60 to-white shadow-[0_1px_2px_rgba(16,24,40,0.04),0_8px_24px_-12px_rgba(16,24,40,0.10)]'
      : cardClass}`}>
      {allPositive && (
        <svg aria-hidden="true" viewBox="0 0 120 80" className="hidden sm:block absolute right-4 bottom-2 w-24 h-16 text-emerald-500 opacity-[0.18] pointer-events-none">
          <rect x="6"  y="56" width="16" height="20" rx="4" fill="currentColor" />
          <rect x="34" y="44" width="16" height="32" rx="4" fill="currentColor" />
          <rect x="62" y="30" width="16" height="46" rx="4" fill="currentColor" />
          <rect x="90" y="14" width="16" height="62" rx="4" fill="currentColor" />
          <path d="M8 40 C 40 34, 70 22, 104 4" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          <path d="M92 4 L106 3 L102 16" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
      <button onClick={() => setOpen(v => !v)} aria-expanded={open}
        className="relative w-full flex items-center gap-2.5 px-4 pt-3 pb-2 text-left">
        <Lightbulb size={14} className="text-black shrink-0" />
        <p className="text-xs font-semibold text-black uppercase tracking-wider flex-1">Smart insights</p>
        <ChevronDown size={14} className={`text-gray-400 transition-transform duration-300 ${open ? 'rotate-0' : '-rotate-90'}`} />
      </button>
      <div style={{ maxHeight: open ? '2000px' : '0px', opacity: open ? 1 : 0, transition: 'max-height 0.35s ease, opacity 0.25s ease', overflow: 'hidden' }}>
        <div className="relative px-4 pb-3 sm:pr-32">
          {insights.length === 0 ? (
            <p className="text-xs text-gray-300 py-2 text-center">No insights yet — keep tracking!</p>
          ) : (
            <div className="flex flex-col gap-1">
              {insights.map((ins, i) => (
                <div key={i} className="flex items-center gap-2.5 py-1">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${allPositive ? 'bg-white/70' : ins.bg} ${ins.color}`}>{ins.icon}</span>
                  <p className={`text-xs leading-snug ${ins.color}`}>{ins.text}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Interactive sparkline (SVG area/line with hover tooltip) ────────────────
export function Sparkline({ data, stroke = '#059669', fill, height = 36, labels, format }: {
  data: number[]; stroke?: string; fill?: string; height?: number; labels?: string[]; format?: (v: number) => string
}) {
  const [hover, setHover] = useState<number | null>(null)
  const gradId = useId()
  if (!data || data.length === 0) return null
  const max = Math.max(...data, 1), min = Math.min(...data, 0)
  const range = max - min || 1, w = 100, h = height
  const xPct = (i: number) => data.length === 1 ? 0 : (i / (data.length - 1)) * 100
  const yOf = (v: number) => h - ((v - min) / range) * h
  const pts = data.map((v, i) => [(xPct(i) / 100) * w, yOf(v)] as const)
  // Catmull-Rom → cubic bezier so the line flows smoothly through every point
  let line = `M${pts[0][0].toFixed(2)},${pts[0][1].toFixed(2)}`
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i]
    const p1 = pts[i]
    const p2 = pts[i + 1]
    const p3 = pts[i + 2] ?? p2
    const c1x = p1[0] + (p2[0] - p0[0]) / 6, c1y = p1[1] + (p2[1] - p0[1]) / 6
    const c2x = p2[0] - (p3[0] - p1[0]) / 6, c2y = p2[1] - (p3[1] - p1[1]) / 6
    line += ` C${c1x.toFixed(2)},${c1y.toFixed(2)} ${c2x.toFixed(2)},${c2y.toFixed(2)} ${p2[0].toFixed(2)},${p2[1].toFixed(2)}`
  }
  const area = `${line} L${w},${h} L0,${h} Z`
  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const ratio = (e.clientX - rect.left) / rect.width
    setHover(Math.max(0, Math.min(data.length - 1, Math.round(ratio * (data.length - 1)))))
  }
  return (
    <div className="relative w-full" style={{ height }} onMouseMove={onMove} onMouseLeave={() => setHover(null)}>
      <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="w-full" style={{ height }}>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={stroke} stopOpacity="0.16" />
            <stop offset="100%" stopColor={stroke} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill={fill ?? `url(#${gradId})`} stroke="none" />
        <path d={line} fill="none" stroke={stroke} strokeWidth={1.5} vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {hover !== null && (
        <>
          <div className="absolute top-0 bottom-0 w-px pointer-events-none" style={{ left: `${xPct(hover)}%`, background: stroke, opacity: 0.35 }} />
          <div className="absolute w-1.5 h-1.5 rounded-full pointer-events-none -translate-x-1/2 -translate-y-1/2" style={{ left: `${xPct(hover)}%`, top: yOf(data[hover]), background: stroke }} />
          {format && (
            <div className="absolute -top-6 px-1.5 py-0.5 rounded-md bg-black text-white text-[10px] font-medium whitespace-nowrap pointer-events-none -translate-x-1/2 z-10"
              style={{ left: `${Math.min(Math.max(xPct(hover), 12), 88)}%` }}>
              {labels?.[hover] ? `${labels[hover]} · ` : ''}{format(data[hover])}
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ─── Progress ring ────────────────────────────────────────────────────────────
export function Ring({ pct, size = 132, stroke = 12, color = '#111110', children }: {
  pct: number; size?: number; stroke?: number; color?: string; children?: React.ReactNode
}) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const off = c - (Math.min(Math.max(pct, 0), 100) / 100) * c
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#f1f1ef" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={off} className="transition-all duration-700" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">{children}</div>
    </div>
  )
}

// ─── Category icon chip ───────────────────────────────────────────────────────
export function CatIcon({ category, size = 36 }: { category: Category; size?: number }) {
  const cfg = CATEGORY_CONFIG[category]
  return (
    <div className={`rounded-xl ${cfg.bg} ${cfg.text} flex items-center justify-center shrink-0`} style={{ width: size, height: size }}>
      {cfg.icon}
    </div>
  )
}

// ─── Daily spending heatmap ───────────────────────────────────────────────────
export function SpendingHeatmap({
  data, monthKey, size = 'compact', onSelectDay, showLegend = true, showWeekTotals = false,
}: {
  data: DailySpendData; monthKey: string
  size?: 'compact' | 'comfortable'
  onSelectDay?: (day: number) => void
  showLegend?: boolean
  showWeekTotals?: boolean
}) {
  const [hover, setHover] = useState<number | null>(null)
  const [focusDay, setFocusDay] = useState<number>(data.todayDay ?? 1)
  const usedKeyboard = useRef(false)
  const gridRef = useRef<HTMLDivElement>(null)
  const [yr, mo] = monthKey.split('-').map(Number)

  const levels = useMemo(() => heatLevels(data.days), [data.days])
  const compact = size === 'compact'

  useEffect(() => { setFocusDay(data.todayDay ?? 1); usedKeyboard.current = false }, [monthKey, data.todayDay])
  useEffect(() => {
    if (!usedKeyboard.current) return          // never steal focus on mount
    gridRef.current?.querySelector<HTMLElement>(`[data-day="${focusDay}"]`)?.focus()
  }, [focusDay])

  const maxFocusable = Math.max(data.elapsedDays, 1)
  const onKeyDown = (e: React.KeyboardEvent, day: number) => {
    let next: number | null = null
    if (e.key === 'ArrowRight') next = day + 1
    else if (e.key === 'ArrowLeft') next = day - 1
    else if (e.key === 'ArrowDown') next = day + 7
    else if (e.key === 'ArrowUp') next = day - 7
    else if (e.key === 'Home') next = day - ((data.leadingBlanks + day - 1) % 7)
    else if (e.key === 'End') next = day + (6 - ((data.leadingBlanks + day - 1) % 7))
    else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelectDay?.(day); return }
    else return
    e.preventDefault()
    usedKeyboard.current = true
    setFocusDay(Math.min(Math.max(next, 1), maxFocusable))
  }

  const dateLabel = (day: number) =>
    new Date(yr, mo - 1, day).toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' })

  const hoverDay = hover !== null ? data.days[hover - 1] : null
  const hoverCol = hoverDay ? (data.leadingBlanks + hoverDay.day - 1) % 7 : 0
  const hoverRow = hoverDay ? Math.floor((data.leadingBlanks + hoverDay.day - 1) / 7) : 0
  const rowCount = Math.ceil((data.leadingBlanks + data.daysInMonth) / 7)

  // Week-total column (optional): fixed width, so tooltips are positioned
  // against the 7 day-columns only and stay centred over the hovered cell.
  const gapRem  = compact ? 0.25 : 0.375   // matches gap-1 / gap-1.5
  const totalW  = showWeekTotals ? `(3.5rem + ${gapRem}rem)` : '0rem'
  const colTemplate = showWeekTotals ? 'repeat(7, minmax(0, 1fr)) 3.5rem' : 'repeat(7, minmax(0, 1fr))'
  const gapCls  = compact ? 'gap-1' : 'gap-1.5'

  // Flat cell list (blanks + days + trailing blanks), chunked into weeks
  type Cell = { kind: 'blank' } | { kind: 'day'; d: DaySpend; i: number }
  const cells: Cell[] = [
    ...Array.from({ length: data.leadingBlanks }, () => ({ kind: 'blank' as const })),
    ...data.days.map((d, i) => ({ kind: 'day' as const, d, i })),
  ]
  while (cells.length % 7) cells.push({ kind: 'blank' })
  const weeks: Cell[][] = []
  for (let r = 0; r < cells.length; r += 7) weeks.push(cells.slice(r, r + 7))

  const renderDay = (d: DaySpend, i: number) => {
    const lvl = levels[i]
    const onDark = lvl >= 3
    const common = `heat-cell aspect-square ${compact ? 'rounded-[7px] text-[10px]' : 'rounded-lg text-[10px]'} flex items-center justify-center font-medium tabular-nums select-none`
    if (d.isFuture) {
      return (
        <div key={d.day} role="gridcell" aria-disabled="true"
          aria-label={`${d.day} ${MONTHS[mo - 1]}, upcoming`}
          className={`${common} text-gray-300 cursor-default`}
          style={{ animationDelay: `${0.012 * i}s`, background: '#f7f8f9' }}>
          {d.day}
        </div>
      )
    }
    return (
      <button key={d.day} role="gridcell" data-day={d.day}
        tabIndex={d.day === focusDay ? 0 : -1}
        aria-label={`${d.day} ${MONTHS[mo - 1]}, ${d.total > 0 ? `${fmt(d.total)} across ${d.count} ${d.count === 1 ? 'transaction' : 'transactions'}` : 'no spending'}`}
        onMouseEnter={() => setHover(d.day)}
        onMouseLeave={() => setHover(h => h === d.day ? null : h)}
        onFocus={() => setHover(d.day)}
        onBlur={() => setHover(h => h === d.day ? null : h)}
        onKeyDown={e => onKeyDown(e, d.day)}
        onClick={() => onSelectDay?.(d.day)}
        className={`${common} ${onDark ? 'text-white' : lvl === 0 ? 'text-gray-500' : 'text-[#0f3d1f]'} ${onSelectDay ? 'cursor-pointer' : 'cursor-default'} focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black`}
        style={{
          animationDelay: `${0.012 * i}s`,
          backgroundColor: HEAT_COLORS[lvl],
          boxShadow: d.isToday ? `0 0 0 2px #ffffff, 0 0 0 3.5px #111110` : undefined,
        }}>
        {d.day}
      </button>
    )
  }

  return (
    <div className={`w-full mx-auto ${compact ? (showWeekTotals ? 'max-w-[340px]' : 'max-w-[300px]') : 'max-w-[520px]'}`}>
      <div className="relative" ref={gridRef}>
        {/* Tooltip — owned by the grid so it can escape individual cells */}
        {hoverDay && (
          <div
            className="absolute px-2 py-1 rounded-md bg-black text-white text-[11px] font-medium whitespace-nowrap pointer-events-none -translate-x-1/2 z-10"
            style={{
              left: `calc((100% - ${totalW}) * ${Math.min(Math.max((hoverCol + 0.5) / 7, 0.14), 0.86)})`,
              top: `calc(${hoverRow} * ((100% - 1.25rem) / ${rowCount}) + 0.1rem)`,
              transform: 'translate(-50%, -110%)',
            }}>
            {dateLabel(hoverDay.day)} · {hoverDay.total > 0 ? `${fmt(hoverDay.total)} · ${hoverDay.count} ${hoverDay.count === 1 ? 'transaction' : 'transactions'}` : 'No spending'}
          </div>
        )}

        <div role="grid" aria-label={`Daily spending for ${getMonthLabelFull(monthKey)}`}>
          <div role="row" className={`grid ${gapCls} mb-1`} style={{ gridTemplateColumns: colTemplate }}>
            {WEEKDAY_LABELS.map((w, i) => (
              <div key={w} role="columnheader" aria-label={w}
                className={`text-center ${compact ? 'text-[9px]' : 'text-[10px]'} font-medium ${i >= 5 ? 'text-gray-300' : 'text-gray-400'}`}>
                {compact ? w[0] : w}
              </div>
            ))}
            {showWeekTotals && (
              <div role="columnheader" className={`text-right ${compact ? 'text-[9px]' : 'text-[10px]'} font-medium text-gray-400`}>Week</div>
            )}
          </div>
          <div className={`grid ${gapCls}`} style={{ gridTemplateColumns: colTemplate }}>
            {weeks.map((week, r) => {
              const elapsed = week.filter((c): c is Extract<Cell, { kind: 'day' }> => c.kind === 'day' && !c.d.isFuture)
              const weekTotal = elapsed.reduce((s, c) => s + c.d.total, 0)
              return [
                ...week.map((c, k) => c.kind === 'blank'
                  ? <div key={`b${r}-${k}`} aria-hidden="true" />
                  : renderDay(c.d, c.i)),
                showWeekTotals && (
                  <div key={`w${r}`} aria-label={elapsed.length ? `Week total ${fmt(weekTotal)}` : 'Week not started'}
                    className={`flex items-center justify-end text-[10px] tabular-nums ${elapsed.length && weekTotal > 0 ? 'text-gray-600 font-medium' : 'text-gray-300'}`}>
                    {elapsed.length ? fmtShort(weekTotal) : ''}
                  </div>
                ),
              ]
            })}
          </div>
        </div>
      </div>

      {showLegend && (
        <div className="flex items-center justify-between gap-2 mt-3 flex-wrap">
          {data.spentDayCount > 0 ? (
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-gray-400 mr-0.5">Less</span>
              {HEAT_COLORS.map((c, i) => (
                <span key={i} className="w-2.5 h-2.5 rounded-[3px]" style={{ backgroundColor: c }} />
              ))}
              <span className="text-[10px] text-gray-400 ml-0.5">More</span>
            </div>
          ) : <span />}
          <div className="flex items-center gap-2.5">
            <span className="flex items-center gap-1 text-[10px] text-gray-400">
              <span className="w-2.5 h-2.5 rounded-[3px]" style={{ background: HEAT_COLORS[0] }} /> No spending
            </span>
            {data.isCurrentMonth && (
              <span className="flex items-center gap-1 text-[10px] text-gray-400">
                <span className="w-2.5 h-2.5 rounded-[3px]" style={{ background: '#f7f8f9', border: '1px solid #eceef0' }} /> Upcoming
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Weekday averages — column-aligned under the heatmap ──────────────────────
export function WeekdayBars({ stats, size = 'compact', withWeekColumn = false }: {
  stats: DowStat[]; size?: 'compact' | 'comfortable'
  withWeekColumn?: boolean   // match SpendingHeatmap showWeekTotals so columns stay aligned
}) {
  const [hover, setHover] = useState<number | null>(null)
  const compact = size === 'compact'
  const maxAvg = Math.max(...stats.map(s => s.avg), 1)
  const heaviest = stats.reduce<DowStat | null>((m, s) => s.occurrences > 0 && (!m || s.avg > m.avg) ? s : m, null)
  const totalW = withWeekColumn ? `(3.5rem + ${compact ? 0.25 : 0.375}rem)` : '0rem'

  return (
    <div className={`w-full mx-auto ${compact ? (withWeekColumn ? 'max-w-[340px]' : 'max-w-[300px]') : 'max-w-[520px]'} mt-3`}>
      <div className="relative">
        {hover !== null && stats[hover].occurrences > 0 && (
          <div className="absolute px-2 py-1 rounded-md bg-black text-white text-[11px] font-medium whitespace-nowrap pointer-events-none -translate-x-1/2 z-10 -top-1"
            style={{ left: `calc((100% - ${totalW}) * ${Math.min(Math.max((hover + 0.5) / 7, 0.16), 0.84)})`, transform: 'translate(-50%, -100%)' }}>
            {stats[hover].label}s · {fmt(stats[hover].avg)} average · {stats[hover].occurrences} so far
          </div>
        )}
        <div className={`grid ${compact ? 'gap-1' : 'gap-1.5'} items-end`}
          style={{ height: compact ? 32 : 52, gridTemplateColumns: withWeekColumn ? 'repeat(7, minmax(0, 1fr)) 3.5rem' : 'repeat(7, minmax(0, 1fr))' }}>
          {stats.map((s, i) => (
            <div key={s.idx} className="h-full flex items-end justify-center"
              onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(h => h === i ? null : h)}>
              {s.occurrences === 0 ? (
                <div className={compact ? 'w-3/5 rounded-full bg-gray-100' : 'w-full rounded-sm'} style={compact ? { height: 3 } : { height: 3, border: '1px dashed #eeeeec' }} />
              ) : (
                <div className={`heat-bar ${compact ? 'w-3/5 rounded-full' : 'w-full rounded-t-sm'}`}
                  style={{
                    height: `${Math.max((s.avg / maxAvg) * 100, 3)}%`,
                    backgroundColor: heaviest && s.idx === heaviest.idx ? HEAT_COLORS[4] : HEAT_COLORS[1],
                  }} />
              )}
            </div>
          ))}
        </div>
      </div>
      <p className="text-[10px] text-gray-300 text-center mt-1.5">Average spending by weekday</p>
    </div>
  )
}

// ─── Spending pace: running total this month vs last month ───────────────────
// Both series are cumulative per day-of-month. Comparing "by the same day"
// answers the beginner question "am I spending faster than last month?"
export function SpendingPaceChart({ thisSeries, lastSeries, daysInMonth }: {
  thisSeries: number[]   // cumulative, one value per elapsed day of the selected month
  lastSeries: number[]   // cumulative, one value per day of the previous month
  daysInMonth: number
}) {
  const [hover, setHover] = useState<number | null>(null)
  const gradId = useId()
  if (thisSeries.length === 0) return null

  const hasLast  = lastSeries.length > 0 && lastSeries[lastSeries.length - 1] > 0
  const elapsed  = thisSeries.length
  const thisNow  = thisSeries[elapsed - 1]
  const lastSame = hasLast ? lastSeries[Math.min(elapsed, lastSeries.length) - 1] : 0
  const diff     = thisNow - lastSame
  const same     = hasLast && Math.abs(diff) <= Math.max(lastSame * 0.01, 1)

  const N  = Math.max(daysInMonth, hasLast ? lastSeries.length : 0, 2)
  const H  = 72
  const max = Math.max(...thisSeries, ...(hasLast ? lastSeries : [0]), 1) * 1.08
  const xPct = (day: number) => ((day - 1) / (N - 1)) * 100
  const y    = (v: number) => H - (v / max) * H
  const path = (s: number[]) => s.map((v, i) => `${i ? 'L' : 'M'}${xPct(i + 1).toFixed(2)},${y(v).toFixed(2)}`).join(' ')
  const thisLine = path(thisSeries)
  const thisArea = `${thisLine} L${xPct(elapsed).toFixed(2)},${H} L0,${H} Z`

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    const day = Math.round(((e.clientX - r.left) / r.width) * (N - 1)) + 1
    setHover(Math.max(1, Math.min(N, day)))
  }
  const hThis = hover !== null && hover <= elapsed ? thisSeries[hover - 1] : null
  const hLast = hover !== null && hasLast && hover <= lastSeries.length ? lastSeries[hover - 1] : null

  return (
    <div>
      <p className="text-xs text-gray-600 leading-relaxed mb-3">
        {!hasLast ? (
          <>By day {elapsed} you&apos;ve spent <strong className="font-medium text-black">{fmt(thisNow)}</strong>. No spending last month to compare yet.</>
        ) : same ? (
          <>By day {elapsed} you&apos;ve spent <strong className="font-medium text-black">{fmt(thisNow)}</strong>, about the same as last month by this point.</>
        ) : (
          <>By day {elapsed} you&apos;ve spent <strong className="font-medium text-black">{fmt(thisNow)}</strong> — <strong className={`font-medium ${diff < 0 ? 'text-emerald-600' : 'text-red-600'}`}>{fmt(Math.abs(diff))} {diff < 0 ? 'less' : 'more'}</strong> than last month by this point.</>
        )}
      </p>

      <div className="relative w-full" style={{ height: H }} onMouseMove={onMove} onMouseLeave={() => setHover(null)}>
        <svg viewBox={`0 0 100 ${H}`} preserveAspectRatio="none" className="w-full overflow-visible" style={{ height: H }} aria-hidden="true">
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#30a14e" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#30a14e" stopOpacity="0" />
            </linearGradient>
          </defs>
          {[0.5, 1].map(f => (
            <line key={f} x1="0" x2="100" y1={H * f} y2={H * f} stroke="#f0f1f3" strokeWidth={1} vectorEffect="non-scaling-stroke" />
          ))}
          {hasLast && (
            <path d={path(lastSeries)} fill="none" stroke="#c4c7cc" strokeWidth={1.5} strokeDasharray="4 4"
              vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" />
          )}
          <path d={thisArea} fill={`url(#${gradId})`} stroke="none" />
          <path d={thisLine} fill="none" stroke="#30a14e" strokeWidth={2} vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" />
          {hover !== null && (
            <line x1={xPct(hover)} x2={xPct(hover)} y1="0" y2={H} stroke="#111110" strokeOpacity={0.15} strokeWidth={1} vectorEffect="non-scaling-stroke" />
          )}
        </svg>

        {/* Today / last point dot — HTML so it stays round on a stretched SVG */}
        <span className="absolute w-2.5 h-2.5 rounded-full bg-[#30a14e] ring-2 ring-white -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          style={{ left: `${xPct(elapsed)}%`, top: y(thisNow) }} />
        {hover !== null && hThis !== null && hover !== elapsed && (
          <span className="absolute w-2 h-2 rounded-full bg-[#30a14e] ring-2 ring-white -translate-x-1/2 -translate-y-1/2 pointer-events-none"
            style={{ left: `${xPct(hover)}%`, top: y(hThis) }} />
        )}
        {hover !== null && hLast !== null && (
          <span className="absolute w-2 h-2 rounded-full bg-[#c4c7cc] ring-2 ring-white -translate-x-1/2 -translate-y-1/2 pointer-events-none"
            style={{ left: `${xPct(hover)}%`, top: y(hLast) }} />
        )}

        {hover !== null && (hThis !== null || hLast !== null) && (
          <div className="absolute -top-2 px-2 py-1 rounded-md bg-black text-white text-[11px] font-medium whitespace-nowrap pointer-events-none z-10"
            style={{ left: `${Math.min(Math.max(xPct(hover), 18), 82)}%`, transform: 'translate(-50%, -100%)' }}>
            Day {hover}
            {hThis !== null && <> · this month {fmt(hThis)}</>}
            {hLast !== null && <> · last month {fmt(hLast)}</>}
          </div>
        )}
      </div>

      <div className="flex items-center justify-center gap-4 mt-2.5">
        <span className="flex items-center gap-1.5 text-[10px] text-gray-500">
          <span className="w-3.5 h-[2px] rounded-full bg-[#30a14e]" /> This month
        </span>
        {hasLast && (
          <span className="flex items-center gap-1.5 text-[10px] text-gray-500">
            <span className="w-3.5 border-t-2 border-dashed border-[#c4c7cc]" /> Last month
          </span>
        )}
      </div>
    </div>
  )
}
