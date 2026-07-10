'use client'

// ─── Shared types, constants, utils and small components used by both the
//     Beginner and Expert dashboard views. Moved verbatim from page.tsx. ─────

import { useEffect, useState, useRef, useId } from 'react'
import ReactDOM from 'react-dom'
import {
  UtensilsCrossed, Car, ShoppingBag, HeartPulse, User, Home, Zap, Tv,
  PiggyBank, MoreHorizontal, Briefcase, DollarSign, BarChart2, TrendingUp,
  TrendingDown, Flame, AlertTriangle, MoreVertical, ChevronDown, Calendar, Check
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
export function MonthPickerDropdown({ months, selected, onChange }: {
  months: { key: string; label: string; total: number }[]
  selected: string
  onChange: (key: string) => void
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

      {open && (
        <div className="absolute left-0 top-full mt-2 w-52 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-[500] animate-slide-up">
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
export function SmartInsightsContent({ thisMonthTotal, lastMonthTotal, avgPerDay, categoryTotals, thisMonthIncomeTot, netSavings, budgets, budgetSpend }: {
  thisMonthTotal: number; lastMonthTotal: number; avgPerDay: number
  categoryTotals: Partial<Record<Category, number>>; thisMonthIncomeTot: number
  netSavings: number; budgets: Budget[]; budgetSpend: Partial<Record<Category, number>>
}) {
  const insights: { icon: React.ReactNode; text: string; color: string; bg: string }[] = []
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
