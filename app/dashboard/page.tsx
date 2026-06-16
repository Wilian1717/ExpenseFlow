'use client'

import { useEffect, useState, useMemo, useRef } from 'react'
import ReactDOM from 'react-dom'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import {
  Plus, LogOut, Wallet, TrendingUp, TrendingDown,
  ShoppingBag, Car, UtensilsCrossed, HeartPulse, MoreHorizontal,
  Calendar, Target, Receipt, Pencil, Trash2, X, Check,
  DollarSign, Briefcase, BarChart2, PiggyBank, ArrowUpCircle, ArrowDownCircle,
  Lightbulb, AlertTriangle, Flag, Flame, Search, ChevronDown,
  User, Home, Zap, Menu, ChevronLeft, ChevronRight, History, CreditCard,
  MoreVertical, Undo2, Download, SlidersHorizontal, Tv, Eye, EyeOff, Calculator,
  Users, UserPlus
} from 'lucide-react'

type Category = 'food' | 'transport' | 'shopping' | 'health' | 'personal' | 'housing' | 'utilities' | 'entertainment' | 'savings' | 'other'
type IncomeCategory = 'salary' | 'freelance' | 'business' | 'investment' | 'other'
type Frequency = 'daily' | 'weekly' | 'monthly'
type SortOrder = 'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc'

interface Expense {
  id: string; user_id: string; title: string; amount: number
  category: Category; note?: string; created_at: string
}
interface Income {
  id: string; user_id: string; title: string; amount: number
  category: IncomeCategory; note?: string; created_at: string
}
interface Budget {
  id: string; user_id: string; category: Category; limit_amount: number; month: string
}
interface BudgetProfile {
  id: string; user_id: string; name: string
  sim_income: number
  category_budgets: Partial<Record<Category, number>>
  goal_allocations: Record<string, number>
  created_at: string; updated_at: string
}
interface SavingsGoal {
  id: string; user_id: string; title: string; target_amount: number
  current_amount: number; deadline?: string; created_at: string
}
interface GoalHistory {
  id: string; goal_id: string; user_id: string; amount: number; note?: string; created_at: string
}
interface RecurringExpense {
  id: string; user_id: string; title: string; amount: number
  category: Category; frequency: Frequency; next_due: string; note?: string; created_at: string
  last_paid_date?: string
}
interface ExpensePool {
  id: string; user_id: string; title: string; budget_amount: number
  category: Category; note?: string; created_at: string; is_archived: boolean
}
interface ExpensePoolEntry {
  id: string; pool_id: string; user_id: string; amount: number
  month: string; note?: string; expense_id?: string; created_at: string
}
interface ExpensePoolWithStats {
  pool: ExpensePool; entries: ExpensePoolEntry[]
  spent: number; remaining: number; pct: number
}
interface SplitBill {
  id: string; user_id: string; title: string; total_amount: number
  category: Category; note?: string; is_archived: boolean; created_at: string
}
interface SplitBillParticipant {
  id: string; bill_id: string; user_id: string; name: string
  share_amount: number; is_paid: boolean; created_at: string
}
interface SplitBillWithStats {
  bill: SplitBill; participants: SplitBillParticipant[]
  owed: number; collected: number; paidCount: number; settled: boolean
}

const CATEGORY_CONFIG: Record<Category, { label: string; icon: React.ReactNode; bg: string; text: string }> = {
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
const INCOME_CONFIG: Record<IncomeCategory, { label: string; icon: React.ReactNode }> = {
  salary:     { label: 'Salary',     icon: <Briefcase size={14} />  },
  freelance:  { label: 'Freelance',  icon: <DollarSign size={14} /> },
  business:   { label: 'Business',   icon: <BarChart2 size={14} />  },
  investment: { label: 'Investment', icon: <TrendingUp size={14} /> },
  other:      { label: 'Other',      icon: <PiggyBank size={14} />  },
}
const FREQ_LABELS: Record<Frequency, string> = { daily: 'Daily', weekly: 'Weekly', monthly: 'Monthly' }
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function fmtFull(amount: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount)
}
function fmt(amount: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount)
}
function fmtShort(amount: number): string {
  if (amount >= 1_000_000_000_000) return `Rp ${(amount / 1_000_000_000_000).toFixed(2)}T`
  if (amount >= 1_000_000_000)     return `Rp ${(amount / 1_000_000_000).toFixed(1)}M`
  if (amount >= 1_000_000)         return `Rp ${(amount / 1_000_000).toFixed(1)}jt`
  if (amount >= 1_000)             return `Rp ${(amount / 1_000).toFixed(0)}rb`
  return `Rp ${amount}`
}
// Thousand-separated input helpers (Indonesian grouping, e.g. 2300000 -> "2.300.000")
function groupId(n: number): string {
  return n ? n.toLocaleString('id-ID') : ''
}
function parseRp(str: string): number {
  return parseInt(str.replace(/\D/g, ''), 10) || 0
}
function inMonth(dateStr: string, month: string): boolean {
  const d = new Date(dateStr)
  const local = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  return local === month
}
function currentMonth() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}
function getMonthLabelFull(iso: string) {
  const [year, month] = iso.split('-')
  return `${MONTHS[parseInt(month) - 1]} ${year}`
}
function getMonthLabelShort(iso: string) {
  const [year, month] = iso.split('-')
  return `${MONTHS_SHORT[parseInt(month) - 1]} '${year.slice(2)}`
}
function nextDueDate(current: string, frequency: Frequency): string {
  const d = new Date(current)
  if (frequency === 'daily')   d.setDate(d.getDate() + 1)
  if (frequency === 'weekly')  d.setDate(d.getDate() + 7)
  if (frequency === 'monthly') d.setMonth(d.getMonth() + 1)
  return d.toISOString().slice(0, 10)
}

function localISOString(): string {
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`
}

function exportCSV(expenses: Expense[], income: Income[], month: string) {
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

// ─── Three-dot context menu (portal) ─────────────────────────────────────────
function RowMenu({ items }: {
  items: { label: string; icon: React.ReactNode; onClick: () => void; danger?: boolean; disabled?: boolean }[]
}) {
  const [open, setOpen] = useState(false)
  const [pos, setPos]   = useState<{ top: number; left: number } | null>(null)
  const btnRef          = useRef<HTMLButtonElement>(null)

  const handleOpen = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect()
      const left = rect.right - 144 < 0 ? rect.left : rect.right - 144
      setPos({ top: rect.bottom + 4, left })
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
function CollapsibleSection({ title, icon, children, defaultOpen = true, headerRight, badge, badgeColor = 'bg-black' }: {
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
function MonthPickerDropdown({ months, selected, onChange }: {
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

// ─── Edit Income Modal ────────────────────────────────────────────────────────
function EditIncomeModal({ income, onClose, onSave }: {
  income: Income; onClose: () => void; onSave: (updated: Partial<Income>) => Promise<void>
}) {
  const [title, setTitle]       = useState(income.title)
  const [amount, setAmount]     = useState(String(income.amount))
  const [category, setCategory] = useState<IncomeCategory>(income.category)
  const [note, setNote]         = useState(income.note ?? '')
  const [saving, setSaving]     = useState(false)

  const handleSave = async () => {
    if (!title.trim() || !amount) return
    setSaving(true); await onSave({ title: title.trim(), amount: parseFloat(amount), category, note: note.trim() }); setSaving(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/30 px-4 pb-4 sm:pb-0">
      <div className="bg-white rounded-2xl w-full max-w-sm p-5 shadow-xl animate-slide-up">
        <div className="flex justify-between items-center mb-5">
          <div><h2 className="text-base font-medium text-black">Edit income</h2><p className="text-xs text-gray-400 mt-0.5">Update the details below</p></div>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-black transition-all"><X size={16} /></button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Amount (Rp)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-medium select-none">Rp</span>
              <input type="text" inputMode="numeric" value={amount} onChange={e => setAmount(e.target.value.replace(/[^0-9.]/g, ''))}
                className="w-full border border-gray-200 rounded-lg pl-10 pr-3 py-2.5 text-sm text-black focus:outline-none focus:border-black transition font-medium" />
            </div>
            {amount && !isNaN(parseFloat(amount)) && <p className="text-xs text-gray-400 mt-1 pl-1">{fmt(parseFloat(amount))}</p>}
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Description</label>
            <input value={title} onChange={e => setTitle(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-black focus:outline-none focus:border-black transition" />
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Category</label>
            <select value={category} onChange={e => setCategory(e.target.value as IncomeCategory)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-black focus:outline-none focus:border-black transition bg-white">
              {(Object.keys(INCOME_CONFIG) as IncomeCategory[]).map(c => <option key={c} value={c}>{INCOME_CONFIG[c].label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Note <span className="text-gray-300">(optional)</span></label>
            <input value={note} onChange={e => setNote(e.target.value)} placeholder="Add a note..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-black focus:outline-none focus:border-black transition" />
          </div>
        </div>
        <div className="flex gap-2 mt-5">
          <button onClick={onClose} className="flex-1 border border-gray-200 rounded-lg py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition">Cancel</button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 bg-black text-white rounded-lg py-2.5 text-sm font-medium hover:bg-gray-800 active:scale-[.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2">
            {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Check size={14} /> Save</>}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Edit Bill Modal ──────────────────────────────────────────────────────────
function EditBillModal({ item, onClose, onSave }: {
  item: RecurringExpense; onClose: () => void; onSave: (updated: Partial<RecurringExpense>) => Promise<void>
}) {
  const [title, setTitle]         = useState(item.title)
  const [amount, setAmount]       = useState(String(item.amount))
  const [category, setCategory]   = useState<Category>(item.category)
  const [frequency, setFrequency] = useState<Frequency>(item.frequency)
  const [next_due, setNextDue]    = useState(item.next_due)
  const [note, setNote]           = useState(item.note ?? '')
  const [saving, setSaving]       = useState(false)

  const handleSave = async () => {
    if (!title.trim() || !amount) return
    setSaving(true); await onSave({ title: title.trim(), amount: parseFloat(amount), category, frequency, next_due, note: note.trim() }); setSaving(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/30 px-4 pb-4 sm:pb-0">
      <div className="bg-white rounded-2xl w-full max-w-sm p-5 shadow-xl max-h-[90vh] overflow-y-auto animate-slide-up">
        <div className="flex justify-between items-center mb-5">
          <div><h2 className="text-base font-medium text-black">Edit bill</h2><p className="text-xs text-gray-400 mt-0.5">Update the details below</p></div>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-black transition-all"><X size={16} /></button>
        </div>
        <div className="mb-4">
          <label className="text-xs text-gray-400 mb-2 block">Category</label>
          <div className="grid grid-cols-4 gap-1.5">
            {(Object.keys(CATEGORY_CONFIG) as Category[]).map(c => {
              const cfg = CATEGORY_CONFIG[c]; const active = category === c
              return (
                <button key={c} type="button" onClick={() => setCategory(c)}
                  className={`flex flex-col items-center gap-1 py-2.5 rounded-xl text-xs font-medium transition-all ${active ? `${cfg.bg} ${cfg.text} ring-1 ring-current` : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`}>
                  <span className={active ? cfg.text : 'text-gray-400'}>{cfg.icon}</span>
                  <span className="text-[10px] leading-none">{cfg.label.split(' ')[0]}</span>
                </button>
              )
            })}
          </div>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Amount (Rp)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-medium select-none">Rp</span>
              <input type="text" inputMode="numeric" value={amount} onChange={e => setAmount(e.target.value.replace(/[^0-9.]/g, ''))}
                className="w-full border border-gray-200 rounded-lg pl-10 pr-3 py-2.5 text-sm text-black focus:outline-none focus:border-black transition font-medium" />
            </div>
            {amount && !isNaN(parseFloat(amount)) && <p className="text-xs text-gray-400 mt-1 pl-1">{fmt(parseFloat(amount))}</p>}
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Bill name</label>
            <input value={title} onChange={e => setTitle(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-black focus:outline-none focus:border-black transition" />
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Frequency</label>
            <select value={frequency} onChange={e => setFrequency(e.target.value as Frequency)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-black focus:outline-none focus:border-black transition bg-white">
              {(Object.keys(FREQ_LABELS) as Frequency[]).map(f => <option key={f} value={f}>{FREQ_LABELS[f]}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Next due date</label>
            <input type="date" value={next_due} onChange={e => setNextDue(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-black focus:outline-none focus:border-black transition" />
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Note <span className="text-gray-300">(optional)</span></label>
            <input value={note} onChange={e => setNote(e.target.value)} placeholder="Add a note..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-black focus:outline-none focus:border-black transition" />
          </div>
        </div>
        <div className="flex gap-2 mt-5">
          <button onClick={onClose} className="flex-1 border border-gray-200 rounded-lg py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition">Cancel</button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 bg-black text-white rounded-lg py-2.5 text-sm font-medium hover:bg-gray-800 active:scale-[.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2">
            {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Check size={14} /> Save</>}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Savings Goal Detail Modal ────────────────────────────────────────────────
function GoalDetailModal({ goal, history, onClose, onAddFunds, onDeleteHistory, onEditHistory, onEditGoal, onDeleteGoal }: {
  goal: SavingsGoal; history: GoalHistory[]; onClose: () => void
  onAddFunds: (amount: number, note: string) => Promise<void>
  onDeleteHistory: (id: string) => Promise<void>
  onEditHistory: (id: string, amount: number, note: string) => Promise<void>
  onEditGoal: (updated: Partial<SavingsGoal>) => Promise<void>
  onDeleteGoal: () => Promise<void>
}) {
  const [tab, setTab]               = useState<'overview' | 'history' | 'edit'>('overview')
  const [addAmount, setAddAmount]   = useState('')
  const [addNote, setAddNote]       = useState('')
  const [saving, setSaving]         = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [editingHistory, setEditingHistory] = useState<GoalHistory | null>(null)
  const [editHAmount, setEditHAmount] = useState('')
  const [editHNote, setEditHNote]   = useState('')
  const [editTitle, setEditTitle]   = useState(goal.title)
  const [editTarget, setEditTarget] = useState(String(goal.target_amount))
  const [editDeadline, setEditDeadline] = useState(goal.deadline ?? '')
  const [editSaving, setEditSaving] = useState(false)
  const [deleting, setDeleting]     = useState(false)

  const pct       = Math.min((goal.current_amount / goal.target_amount) * 100, 100)
  const done      = goal.current_amount >= goal.target_amount
  const remaining = goal.target_amount - goal.current_amount

  const handleAddFunds = async () => {
    if (!addAmount || parseFloat(addAmount) <= 0) return
    setSaving(true); await onAddFunds(parseFloat(addAmount), addNote.trim()); setAddAmount(''); setAddNote(''); setSaving(false)
  }
  const handleDeleteHistory = async (id: string) => { setDeletingId(id); await onDeleteHistory(id); setDeletingId(null) }
  const startEditHistory = (h: GoalHistory) => { setEditingHistory(h); setEditHAmount(String(h.amount)); setEditHNote(h.note ?? '') }
  const handleSaveEditHistory = async () => {
    if (!editingHistory) return
    await onEditHistory(editingHistory.id, parseFloat(editHAmount), editHNote.trim()); setEditingHistory(null)
  }
  const handleEditGoal = async () => {
    if (!editTitle.trim() || !editTarget) return
    setEditSaving(true); await onEditGoal({ title: editTitle.trim(), target_amount: parseFloat(editTarget), deadline: editDeadline || undefined }); setEditSaving(false)
  }
  const handleDeleteGoal = async () => { setDeleting(true); await onDeleteGoal(); setDeleting(false) }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/30 px-4 pb-4 sm:pb-0">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl max-h-[88vh] flex flex-col animate-slide-up">
        <div className="flex items-start justify-between p-5 pb-3 border-b border-gray-100">
          <div className="flex-1 min-w-0 mr-3">
            <p className="text-base font-medium text-black truncate">{goal.title}</p>
            <p className="text-xs text-gray-400 mt-0.5">{fmtShort(goal.current_amount)} saved of {fmtShort(goal.target_amount)}</p>
          </div>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-black transition-all shrink-0"><X size={16} /></button>
        </div>
        <div className="px-5 pt-3 pb-0">
          <div className="bg-gray-100 rounded-full h-2.5 overflow-hidden mb-1">
            <div className={`h-full rounded-full transition-all duration-700 ${
              done ? 'bg-gradient-to-r from-emerald-400 to-green-500' :
              pct >= 75 ? 'bg-gradient-to-r from-blue-500 to-indigo-500' :
              pct >= 40 ? 'bg-gradient-to-r from-amber-400 to-orange-400' :
              'bg-gradient-to-r from-rose-400 to-pink-400'
            }`} style={{ width: `${pct}%` }} />
          </div>
          <div className="flex justify-between">
            <span className="text-xs text-gray-400">{pct.toFixed(0)}% achieved</span>
            {done ? <span className="text-xs text-green-500 font-medium">Goal reached! 🎉</span>
                  : <span className="text-xs text-gray-400">{fmtShort(remaining)} to go</span>}
          </div>
        </div>
        <div className="flex gap-1 mx-5 mt-3 bg-gray-100 p-1 rounded-lg">
          {(['overview', 'history', 'edit'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-1 rounded-md text-xs font-medium transition-all ${tab === t ? 'bg-white text-black shadow-sm' : 'text-gray-400 hover:text-black'}`}>
              {t === 'overview' ? 'Add funds' : t === 'history' ? `History (${history.length})` : 'Edit'}
            </button>
          ))}
        </div>
        <div className="flex-1 overflow-y-auto px-5 pb-5 pt-3">
          {tab === 'overview' && (
            <div className="space-y-3">
              {done && <div className="bg-green-50 rounded-xl p-3 text-center"><p className="text-sm text-green-700 font-medium">🎉 Goal reached!</p><p className="text-xs text-green-600 mt-0.5">You saved {fmtShort(goal.target_amount)}</p></div>}
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Amount to add (Rp)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-medium select-none">Rp</span>
                  <input type="text" inputMode="numeric" value={addAmount} onChange={e => setAddAmount(e.target.value.replace(/[^0-9.]/g, ''))} placeholder="0" autoFocus
                    className="w-full border border-gray-200 rounded-lg pl-10 pr-3 py-2.5 text-sm text-black focus:outline-none focus:border-black transition font-medium" />
                </div>
                {addAmount && !isNaN(parseFloat(addAmount)) && parseFloat(addAmount) > 0 && <p className="text-xs text-gray-400 mt-1 pl-1">{fmt(parseFloat(addAmount))}</p>}
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Note <span className="text-gray-300">(optional)</span></label>
                <input value={addNote} onChange={e => setAddNote(e.target.value)} placeholder="e.g. From this month's salary..."
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-black focus:outline-none focus:border-black transition" />
              </div>
              {!done && remaining > 0 && addAmount && parseFloat(addAmount) > 0 && (
                <div className="bg-gray-50 rounded-lg px-3 py-2">
                  <p className="text-xs text-gray-500">After adding: <span className="font-medium text-black">{fmtShort(goal.current_amount + parseFloat(addAmount))}</span>{' '}({Math.min(((goal.current_amount + parseFloat(addAmount)) / goal.target_amount) * 100, 100).toFixed(0)}%)</p>
                  <p className="text-xs text-emerald-600 mt-0.5 flex items-center gap-1">
                    <ArrowDownCircle size={10} /> Will be recorded as a savings expense
                  </p>
                </div>
              )}
              <button onClick={handleAddFunds} disabled={saving || !addAmount || parseFloat(addAmount) <= 0}
                className="w-full bg-black text-white rounded-lg py-2.5 text-sm font-medium hover:bg-gray-800 active:scale-[.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Plus size={14} /> Add savings</>}
              </button>
            </div>
          )}
          {tab === 'history' && (
            history.length === 0 ? (
              <div className="text-center py-8"><History size={24} className="mx-auto mb-2 text-gray-200" /><p className="text-xs text-gray-300">No savings history yet</p></div>
            ) : (
              <div className="flex flex-col gap-2">
                <div className="bg-gray-50 rounded-xl px-3 py-2.5 mb-1 flex justify-between items-center">
                  <span className="text-xs text-gray-500">{history.length} transaction{history.length !== 1 ? 's' : ''}</span>
                  <span className="text-xs font-medium text-black">{fmtShort(history.reduce((s, h) => s + h.amount, 0))} total</span>
                </div>
                {history.map(h => (
                  <div key={h.id}>
                    {editingHistory?.id === h.id ? (
                      <div className="border border-black rounded-xl p-3 space-y-2">
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 select-none">Rp</span>
                          <input type="text" inputMode="numeric" value={editHAmount} onChange={e => setEditHAmount(e.target.value.replace(/[^0-9.]/g, ''))}
                            className="w-full border border-gray-200 rounded-lg pl-9 pr-3 py-2 text-sm text-black focus:outline-none focus:border-black transition font-medium" />
                        </div>
                        <input value={editHNote} onChange={e => setEditHNote(e.target.value)} placeholder="Note..."
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs text-black focus:outline-none focus:border-black transition" />
                        <div className="flex gap-2">
                          <button onClick={() => setEditingHistory(null)} className="flex-1 border border-gray-200 rounded-lg py-1.5 text-xs text-gray-600 hover:bg-gray-50">Cancel</button>
                          <button onClick={handleSaveEditHistory} className="flex-1 bg-black text-white rounded-lg py-1.5 text-xs font-medium hover:bg-gray-800 flex items-center justify-center gap-1"><Check size={12} /> Save</button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 border border-gray-100 rounded-xl px-3 py-2.5 group hover:bg-gray-50 transition-all">
                        <div className="w-7 h-7 bg-emerald-50 rounded-lg flex items-center justify-center shrink-0"><PiggyBank size={13} className="text-emerald-700" /></div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-emerald-700">+{fmtShort(h.amount)}</p>
                          {h.note && <p className="text-xs text-gray-400 truncate">{h.note}</p>}
                          <p className="text-xs text-gray-300">{new Date(h.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                        </div>
                        <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shrink-0">
                          <button onClick={() => startEditHistory(h)} className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-400 hover:text-black transition-all"><Pencil size={12} /></button>
                          <button onClick={() => handleDeleteHistory(h.id)} disabled={deletingId === h.id} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-all disabled:opacity-50">
                            {deletingId === h.id ? <div className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin" /> : <Trash2 size={12} />}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )
          )}
          {tab === 'edit' && (
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Goal name</label>
                <input value={editTitle} onChange={e => setEditTitle(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-black focus:outline-none focus:border-black transition" />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Target amount (Rp)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-medium select-none">Rp</span>
                  <input type="text" inputMode="numeric" value={editTarget} onChange={e => setEditTarget(e.target.value.replace(/[^0-9.]/g, ''))}
                    className="w-full border border-gray-200 rounded-lg pl-10 pr-3 py-2.5 text-sm text-black focus:outline-none focus:border-black transition font-medium" />
                </div>
                {editTarget && <p className="text-xs text-gray-400 mt-1 pl-1">{fmt(parseFloat(editTarget) || 0)}</p>}
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Target date <span className="text-gray-300">(optional)</span></label>
                <input type="date" value={editDeadline} onChange={e => setEditDeadline(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-black focus:outline-none focus:border-black transition" />
              </div>
              <button onClick={handleEditGoal} disabled={editSaving}
                className="w-full bg-black text-white rounded-lg py-2.5 text-sm font-medium hover:bg-gray-800 active:scale-[.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                {editSaving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Check size={14} /> Save changes</>}
              </button>
              <div className="pt-2 border-t border-gray-100">
                <button onClick={handleDeleteGoal} disabled={deleting}
                  className="w-full border border-red-200 text-red-500 hover:bg-red-50 rounded-lg py-2.5 text-sm font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                  {deleting ? <div className="w-4 h-4 border-2 border-red-300 border-t-red-500 rounded-full animate-spin" /> : <><Trash2 size={14} /> Delete this goal</>}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Add Bill Modal ───────────────────────────────────────────────────────────
function AddBillModal({ onClose, onSave }: {
  onClose: () => void
  onSave: (data: { title: string; amount: number; category: Category; frequency: Frequency; next_due: string; note: string }) => Promise<void>
}) {
  const [title, setTitle]         = useState('')
  const [amount, setAmount]       = useState('')
  const [category, setCategory]   = useState<Category>('utilities')
  const [frequency, setFrequency] = useState<Frequency>('monthly')
  const [next_due, setNextDue]    = useState(new Date().toISOString().slice(0, 10))
  const [note, setNote]           = useState('')
  const [saving, setSaving]       = useState(false)

  const handleSave = async () => {
    if (!title.trim() || !amount || parseFloat(amount) <= 0) return
    setSaving(true); await onSave({ title: title.trim(), amount: parseFloat(amount), category, frequency, next_due, note: note.trim() }); setSaving(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/30 px-4 pb-4 sm:pb-0">
      <div className="bg-white rounded-2xl w-full max-w-sm p-5 shadow-xl max-h-[90vh] overflow-y-auto animate-slide-up">
        <div className="flex justify-between items-center mb-5">
          <div><h2 className="text-base font-medium text-black">Add bill</h2><p className="text-xs text-gray-400 mt-0.5">Fixed or recurring costs</p></div>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-black transition-all"><X size={16} /></button>
        </div>
        <div className="mb-4">
          <label className="text-xs text-gray-400 mb-2 block">Category</label>
          <div className="grid grid-cols-4 gap-1.5">
            {(Object.keys(CATEGORY_CONFIG) as Category[]).map(c => {
              const cfg = CATEGORY_CONFIG[c]; const active = category === c
              return (
                <button key={c} type="button" onClick={() => setCategory(c)}
                  className={`flex flex-col items-center gap-1 py-2.5 rounded-xl text-xs font-medium transition-all ${active ? `${cfg.bg} ${cfg.text} ring-1 ring-current` : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`}>
                  <span className={active ? cfg.text : 'text-gray-400'}>{cfg.icon}</span>
                  <span className="text-[10px] leading-none">{cfg.label.split(' ')[0]}</span>
                </button>
              )
            })}
          </div>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Amount (Rp)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-medium select-none">Rp</span>
              <input type="text" inputMode="numeric" value={amount} onChange={e => setAmount(e.target.value.replace(/[^0-9.]/g, ''))} placeholder="0" autoFocus
                className="w-full border border-gray-200 rounded-lg pl-10 pr-3 py-2.5 text-sm text-black focus:outline-none focus:border-black transition font-medium" />
            </div>
            {amount && !isNaN(parseFloat(amount)) && parseFloat(amount) > 0 && <p className="text-xs text-gray-400 mt-1 pl-1">{fmt(parseFloat(amount))}</p>}
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Bill name</label>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Netflix, Rent, Gym..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-black focus:outline-none focus:border-black transition" />
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Frequency</label>
            <select value={frequency} onChange={e => setFrequency(e.target.value as Frequency)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-black focus:outline-none focus:border-black transition bg-white">
              {(Object.keys(FREQ_LABELS) as Frequency[]).map(f => <option key={f} value={f}>{FREQ_LABELS[f]}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">First due date</label>
            <input type="date" value={next_due} onChange={e => setNextDue(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-black focus:outline-none focus:border-black transition" />
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Note <span className="text-gray-300">(optional)</span></label>
            <input value={note} onChange={e => setNote(e.target.value)} placeholder="Add a note..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-black focus:outline-none focus:border-black transition" />
          </div>
        </div>
        <div className="flex gap-2 mt-5">
          <button onClick={onClose} className="flex-1 border border-gray-200 rounded-lg py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition">Cancel</button>
          <button onClick={handleSave} disabled={saving || !title.trim() || !amount || parseFloat(amount) <= 0}
            className="flex-1 bg-black text-white rounded-lg py-2.5 text-sm font-medium hover:bg-gray-800 active:scale-[.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2">
            {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Plus size={14} /> Add</>}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Add Expense Modal ────────────────────────────────────────────────────────
function AddExpenseModal({ onClose, onSave }: {
  onClose: () => void; onSave: (data: { title: string; amount: number; category: Category; note: string }) => Promise<void>
}) {
  const [title, setTitle]       = useState('')
  const [amount, setAmount]     = useState('')
  const [category, setCategory] = useState<Category>('food')
  const [note, setNote]         = useState('')
  const [saving, setSaving]     = useState(false)

  const handleSave = async () => {
    if (!title.trim() || !amount || parseFloat(amount) <= 0) return
    setSaving(true); await onSave({ title: title.trim(), amount: parseFloat(amount), category, note: note.trim() }); setSaving(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/30 px-4 pb-4 sm:pb-0">
      <div className="bg-white rounded-2xl w-full max-w-sm p-5 shadow-xl max-h-[90vh] overflow-y-auto animate-slide-up" onKeyDown={e => e.key === 'Escape' && onClose()}>
        <div className="flex justify-between items-center mb-5">
          <div><h2 className="text-base font-medium text-black">Add expense</h2><p className="text-xs text-gray-400 mt-0.5">Record a new expense</p></div>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-black transition-all"><X size={16} /></button>
        </div>
        <div className="mb-4">
          <label className="text-xs text-gray-400 mb-2 block">Category</label>
          <div className="grid grid-cols-4 gap-1.5">
            {(Object.keys(CATEGORY_CONFIG) as Category[]).map(c => {
              const cfg = CATEGORY_CONFIG[c]; const active = category === c
              return (
                <button key={c} type="button" onClick={() => setCategory(c)}
                  className={`flex flex-col items-center gap-1 py-2.5 rounded-xl text-xs font-medium transition-all ${active ? `${cfg.bg} ${cfg.text} ring-1 ring-current` : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`}>
                  <span className={active ? cfg.text : 'text-gray-400'}>{cfg.icon}</span>
                  <span className="text-[10px] leading-none">{cfg.label.split(' ')[0]}</span>
                </button>
              )
            })}
          </div>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Amount (Rp)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-medium select-none">Rp</span>
              <input type="text" inputMode="numeric" value={amount} onChange={e => setAmount(e.target.value.replace(/[^0-9.]/g, ''))} placeholder="0" autoFocus
                className="w-full border border-gray-200 rounded-lg pl-10 pr-3 py-2.5 text-sm text-black focus:outline-none focus:border-black transition font-medium" />
            </div>
            {amount && !isNaN(parseFloat(amount)) && parseFloat(amount) > 0 && <p className="text-xs text-gray-400 mt-1 pl-1">{fmt(parseFloat(amount))}</p>}
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Description</label>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Lunch, Gas, Groceries..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-black focus:outline-none focus:border-black transition" />
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Note <span className="text-gray-300">(optional)</span></label>
            <input value={note} onChange={e => setNote(e.target.value)} placeholder="Add a note..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-black focus:outline-none focus:border-black transition" />
          </div>
        </div>
        <div className="flex gap-2 mt-5">
          <button onClick={onClose} className="flex-1 border border-gray-200 rounded-lg py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition">Cancel</button>
          <button onClick={handleSave} disabled={saving || !title.trim() || !amount || parseFloat(amount) <= 0}
            className="flex-1 bg-black text-white rounded-lg py-2.5 text-sm font-medium hover:bg-gray-800 active:scale-[.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2">
            {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Plus size={14} /> Add</>}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Edit Expense Modal ───────────────────────────────────────────────────────
function EditExpenseModal({ expense, onClose, onSave }: {
  expense: Expense; onClose: () => void; onSave: (updated: Partial<Expense>) => Promise<void>
}) {
  const [title, setTitle]       = useState(expense.title)
  const [amount, setAmount]     = useState(String(expense.amount))
  const [category, setCategory] = useState<Category>(expense.category)
  const [note, setNote]         = useState(expense.note ?? '')
  const [saving, setSaving]     = useState(false)

  const handleSave = async () => {
    if (!title.trim() || !amount) return
    setSaving(true); await onSave({ title: title.trim(), amount: parseFloat(amount), category, note: note.trim() }); setSaving(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/30 px-4 pb-4 sm:pb-0">
      <div className="bg-white rounded-2xl w-full max-w-sm p-5 shadow-xl max-h-[90vh] overflow-y-auto animate-slide-up">
        <div className="flex justify-between items-center mb-5">
          <div><h2 className="text-base font-medium text-black">Edit expense</h2><p className="text-xs text-gray-400 mt-0.5">Update the details below</p></div>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-black transition-all"><X size={16} /></button>
        </div>
        <div className="mb-4">
          <label className="text-xs text-gray-400 mb-2 block">Category</label>
          <div className="grid grid-cols-4 gap-1.5">
            {(Object.keys(CATEGORY_CONFIG) as Category[]).map(c => {
              const cfg = CATEGORY_CONFIG[c]; const active = category === c
              return (
                <button key={c} type="button" onClick={() => setCategory(c)}
                  className={`flex flex-col items-center gap-1 py-2.5 rounded-xl text-xs font-medium transition-all ${active ? `${cfg.bg} ${cfg.text} ring-1 ring-current` : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`}>
                  <span className={active ? cfg.text : 'text-gray-400'}>{cfg.icon}</span>
                  <span className="text-[10px] leading-none">{cfg.label.split(' ')[0]}</span>
                </button>
              )
            })}
          </div>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Amount (Rp)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-medium select-none">Rp</span>
              <input type="text" inputMode="numeric" value={amount} onChange={e => setAmount(e.target.value.replace(/[^0-9.]/g, ''))}
                className="w-full border border-gray-200 rounded-lg pl-10 pr-3 py-2.5 text-sm text-black focus:outline-none focus:border-black transition font-medium" />
            </div>
            {amount && !isNaN(parseFloat(amount)) && <p className="text-xs text-gray-400 mt-1 pl-1">{fmt(parseFloat(amount))}</p>}
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Description</label>
            <input value={title} onChange={e => setTitle(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-black focus:outline-none focus:border-black transition" />
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Note <span className="text-gray-300">(optional)</span></label>
            <input value={note} onChange={e => setNote(e.target.value)} placeholder="Add a note..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-black focus:outline-none focus:border-black transition" />
          </div>
        </div>
        <div className="flex gap-2 mt-5">
          <button onClick={onClose} className="flex-1 border border-gray-200 rounded-lg py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition">Cancel</button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 bg-black text-white rounded-lg py-2.5 text-sm font-medium hover:bg-gray-800 active:scale-[.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2">
            {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Check size={14} /> Save</>}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Add Income Modal ─────────────────────────────────────────────────────────
function AddIncomeModal({ onClose, onSave }: {
  onClose: () => void; onSave: (income: { title: string; amount: number; category: IncomeCategory; note: string }) => Promise<void>
}) {
  const [title, setTitle]       = useState('')
  const [amount, setAmount]     = useState('')
  const [category, setCategory] = useState<IncomeCategory>('salary')
  const [note, setNote]         = useState('')
  const [saving, setSaving]     = useState(false)

  const handleSave = async () => {
    if (!title.trim() || !amount) return
    setSaving(true); await onSave({ title: title.trim(), amount: parseFloat(amount), category, note: note.trim() }); setSaving(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/30 px-4 pb-4 sm:pb-0">
      <div className="bg-white rounded-2xl w-full max-w-sm p-5 shadow-xl animate-slide-up">
        <div className="flex justify-between items-center mb-5">
          <div><h2 className="text-base font-medium text-black">Add income</h2><p className="text-xs text-gray-400 mt-0.5">Record incoming money</p></div>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-black transition-all"><X size={16} /></button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Amount (Rp)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-medium select-none">Rp</span>
              <input type="text" inputMode="numeric" value={amount} onChange={e => setAmount(e.target.value.replace(/[^0-9.]/g, ''))} placeholder="0" autoFocus
                className="w-full border border-gray-200 rounded-lg pl-10 pr-3 py-2.5 text-sm text-black focus:outline-none focus:border-black transition font-medium" />
            </div>
            {amount && !isNaN(parseFloat(amount)) && parseFloat(amount) > 0 && <p className="text-xs text-gray-400 mt-1 pl-1">{fmt(parseFloat(amount))}</p>}
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Description</label>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. April Salary, Freelance project..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-black focus:outline-none focus:border-black transition" />
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Category</label>
            <select value={category} onChange={e => setCategory(e.target.value as IncomeCategory)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-black focus:outline-none focus:border-black transition bg-white">
              {(Object.keys(INCOME_CONFIG) as IncomeCategory[]).map(c => <option key={c} value={c}>{INCOME_CONFIG[c].label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Note <span className="text-gray-300">(optional)</span></label>
            <input value={note} onChange={e => setNote(e.target.value)} placeholder="Add a note..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-black focus:outline-none focus:border-black transition" />
          </div>
        </div>
        <div className="flex gap-2 mt-5">
          <button onClick={onClose} className="flex-1 border border-gray-200 rounded-lg py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition">Cancel</button>
          <button onClick={handleSave} disabled={saving || !title.trim() || !amount}
            className="flex-1 bg-black text-white rounded-lg py-2.5 text-sm font-medium hover:bg-gray-800 active:scale-[.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2">
            {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Plus size={14} /> Add</>}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Add Savings Goal Modal ───────────────────────────────────────────────────
function AddGoalModal({ onClose, onSave }: {
  onClose: () => void; onSave: (data: { title: string; target_amount: number; current_amount: number; deadline: string }) => Promise<void>
}) {
  const [title, setTitle]       = useState('')
  const [target, setTarget]     = useState('')
  const [current, setCurrent]   = useState('')
  const [deadline, setDeadline] = useState('')
  const [saving, setSaving]     = useState(false)

  const handleSave = async () => {
    if (!title.trim() || !target || parseFloat(target) <= 0) return
    setSaving(true); await onSave({ title: title.trim(), target_amount: parseFloat(target), current_amount: parseFloat(current) || 0, deadline }); setSaving(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/30 px-4 pb-4 sm:pb-0">
      <div className="bg-white rounded-2xl w-full max-w-sm p-5 shadow-xl animate-slide-up">
        <div className="flex justify-between items-center mb-5">
          <div><h2 className="text-base font-medium text-black">New savings goal</h2><p className="text-xs text-gray-400 mt-0.5">Set a target to work towards</p></div>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-black transition-all"><X size={16} /></button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Goal name</label>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Emergency fund, New laptop..." autoFocus
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-black focus:outline-none focus:border-black transition" />
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Target amount (Rp)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-medium select-none">Rp</span>
              <input type="text" inputMode="numeric" value={target} onChange={e => setTarget(e.target.value.replace(/[^0-9.]/g, ''))} placeholder="0"
                className="w-full border border-gray-200 rounded-lg pl-10 pr-3 py-2.5 text-sm text-black focus:outline-none focus:border-black transition font-medium" />
            </div>
            {target && !isNaN(parseFloat(target)) && parseFloat(target) > 0 && <p className="text-xs text-gray-400 mt-1 pl-1">{fmt(parseFloat(target))}</p>}
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Already saved (Rp) <span className="text-gray-300">(optional)</span></label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-medium select-none">Rp</span>
              <input type="text" inputMode="numeric" value={current} onChange={e => setCurrent(e.target.value.replace(/[^0-9.]/g, ''))} placeholder="0"
                className="w-full border border-gray-200 rounded-lg pl-10 pr-3 py-2.5 text-sm text-black focus:outline-none focus:border-black transition font-medium" />
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Target date <span className="text-gray-300">(optional)</span></label>
            <input type="date" value={deadline} onChange={e => setDeadline(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-black focus:outline-none focus:border-black transition" />
          </div>
        </div>
        <div className="flex gap-2 mt-5">
          <button onClick={onClose} className="flex-1 border border-gray-200 rounded-lg py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition">Cancel</button>
          <button onClick={handleSave} disabled={saving || !title.trim() || !target || parseFloat(target) <= 0}
            className="flex-1 bg-black text-white rounded-lg py-2.5 text-sm font-medium hover:bg-gray-800 active:scale-[.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2">
            {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Plus size={14} /> Create goal</>}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Delete Confirm ───────────────────────────────────────────────────────────
function DeleteConfirm({ title, onConfirm, onCancel, deleting }: {
  title: string; onConfirm: () => void; onCancel: () => void; deleting: boolean
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
      <div className="bg-white rounded-2xl w-full max-w-xs p-5 shadow-xl text-center animate-slide-up">
        <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-3"><Trash2 size={18} className="text-red-500" /></div>
        <h2 className="text-base font-medium text-black mb-1">Delete?</h2>
        <p className="text-xs text-gray-500 mb-1 truncate px-4">"{title}"</p>
        <p className="text-xs text-gray-300 mb-5">This action cannot be undone.</p>
        <div className="flex gap-2">
          <button onClick={onCancel} className="flex-1 border border-gray-200 rounded-lg py-2 text-sm text-gray-600 hover:bg-gray-50 transition">Cancel</button>
          <button onClick={onConfirm} disabled={deleting}
            className="flex-1 bg-red-500 hover:bg-red-600 text-white rounded-lg py-2 text-sm font-medium transition-all disabled:opacity-60 flex items-center justify-center gap-2">
            {deleting ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Smart Insights ───────────────────────────────────────────────────────────
function SmartInsightsContent({ thisMonthTotal, lastMonthTotal, avgPerDay, categoryTotals, thisMonthIncomeTot, netSavings, budgets, budgetSpend }: {
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

// ─── Add Pool Modal ───────────────────────────────────────────────────────────
function AddPoolModal({ onClose, onSave }: {
  onClose: () => void
  onSave: (data: { title: string; budget_amount: number; category: Category; note: string }) => Promise<void>
}) {
  const [title, setTitle]         = useState('')
  const [amount, setAmount]       = useState('')
  const [category, setCategory]   = useState<Category>('transport')
  const [note, setNote]           = useState('')
  const [saving, setSaving]       = useState(false)

  const handleSave = async () => {
    if (!title.trim() || !amount || parseFloat(amount) <= 0) return
    setSaving(true); await onSave({ title: title.trim(), budget_amount: parseFloat(amount), category, note: note.trim() }); setSaving(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/30 px-4 pb-4 sm:pb-0">
      <div className="bg-white rounded-2xl w-full max-w-sm p-5 shadow-xl max-h-[90vh] overflow-y-auto animate-slide-up">
        <div className="flex justify-between items-center mb-5">
          <div><h2 className="text-base font-medium text-black">New expense pool</h2><p className="text-xs text-gray-400 mt-0.5">Set a monthly budget envelope</p></div>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-black transition-all"><X size={16} /></button>
        </div>
        <div className="mb-4">
          <label className="text-xs text-gray-400 mb-2 block">Category</label>
          <div className="grid grid-cols-4 gap-1.5">
            {(Object.keys(CATEGORY_CONFIG) as Category[]).filter(c => c !== 'savings').map(c => {
              const cfg = CATEGORY_CONFIG[c]; const active = category === c
              return (
                <button key={c} type="button" onClick={() => setCategory(c)}
                  className={`flex flex-col items-center gap-1 py-2.5 rounded-xl text-xs font-medium transition-all ${active ? `${cfg.bg} ${cfg.text} ring-1 ring-current` : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`}>
                  <span className={active ? cfg.text : 'text-gray-400'}>{cfg.icon}</span>
                  <span className="text-[10px] leading-none">{cfg.label.split(' ')[0]}</span>
                </button>
              )
            })}
          </div>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Monthly budget (Rp)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-medium select-none">Rp</span>
              <input type="text" inputMode="numeric" value={amount} onChange={e => setAmount(e.target.value.replace(/[^0-9.]/g, ''))} placeholder="0" autoFocus
                className="w-full border border-gray-200 rounded-lg pl-10 pr-3 py-2.5 text-sm text-black focus:outline-none focus:border-black transition font-medium" />
            </div>
            {amount && !isNaN(parseFloat(amount)) && parseFloat(amount) > 0 && <p className="text-xs text-gray-400 mt-1 pl-1">{fmt(parseFloat(amount))}</p>}
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Pool name</label>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Work Transport, Groceries..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-black focus:outline-none focus:border-black transition" />
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Note <span className="text-gray-300">(optional)</span></label>
            <input value={note} onChange={e => setNote(e.target.value)} placeholder="Add a note..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-black focus:outline-none focus:border-black transition" />
          </div>
        </div>
        <div className="flex gap-2 mt-5">
          <button onClick={onClose} className="flex-1 border border-gray-200 rounded-lg py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition">Cancel</button>
          <button onClick={handleSave} disabled={saving || !title.trim() || !amount || parseFloat(amount) <= 0}
            className="flex-1 bg-black text-white rounded-lg py-2.5 text-sm font-medium hover:bg-gray-800 active:scale-[.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2">
            {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Plus size={14} /> Create pool</>}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Log Pool Entry Modal ─────────────────────────────────────────────────────
function LogPoolEntryModal({ pool, remaining, onClose, onSave }: {
  pool: ExpensePool; remaining: number; onClose: () => void
  onSave: (amount: number, note: string) => Promise<void>
}) {
  const [amount, setAmount] = useState('')
  const [note, setNote]     = useState('')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!amount || parseFloat(amount) <= 0) return
    setSaving(true); await onSave(parseFloat(amount), note.trim()); setSaving(false)
  }

  const cfg = CATEGORY_CONFIG[pool.category]
  const afterRemaining = remaining - (parseFloat(amount) || 0)

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/30 px-4 pb-4 sm:pb-0">
      <div className="bg-white rounded-2xl w-full max-w-sm p-5 shadow-xl animate-slide-up">
        <div className="flex justify-between items-center mb-1">
          <div>
            <h2 className="text-base font-medium text-black">Log usage</h2>
            <p className="text-xs text-gray-400 mt-0.5">{pool.title}</p>
          </div>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-black transition-all"><X size={16} /></button>
        </div>
        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg ${cfg.bg} ${cfg.text} text-xs font-medium mb-4`}>
          {cfg.icon}
          {remaining >= 0 ? `${fmtShort(remaining)} remaining` : `${fmtShort(Math.abs(remaining))} over budget`}
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Amount (Rp)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-medium select-none">Rp</span>
              <input type="text" inputMode="numeric" value={amount} onChange={e => setAmount(e.target.value.replace(/[^0-9.]/g, ''))} placeholder="0" autoFocus
                className="w-full border border-gray-200 rounded-lg pl-10 pr-3 py-2.5 text-sm text-black focus:outline-none focus:border-black transition font-medium" />
            </div>
            {amount && !isNaN(parseFloat(amount)) && parseFloat(amount) > 0 && <p className="text-xs text-gray-400 mt-1 pl-1">{fmt(parseFloat(amount))}</p>}
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Note <span className="text-gray-300">(optional)</span></label>
            <input value={note} onChange={e => setNote(e.target.value)} placeholder="e.g. Gojek to office..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-black focus:outline-none focus:border-black transition" />
          </div>
          {amount && parseFloat(amount) > 0 && (
            <div className="bg-gray-50 rounded-lg px-3 py-2">
              <p className="text-xs text-gray-500">After logging: <span className={`font-medium ${afterRemaining < 0 ? 'text-red-600' : 'text-black'}`}>{fmtShort(Math.abs(afterRemaining))} {afterRemaining < 0 ? 'over budget' : 'remaining'}</span></p>
            </div>
          )}
        </div>
        <div className="flex gap-2 mt-5">
          <button onClick={onClose} className="flex-1 border border-gray-200 rounded-lg py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition">Cancel</button>
          <button onClick={handleSave} disabled={saving || !amount || parseFloat(amount) <= 0}
            className="flex-1 bg-black text-white rounded-lg py-2.5 text-sm font-medium hover:bg-gray-800 active:scale-[.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2">
            {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Check size={14} /> Log usage</>}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Pool Detail Modal ────────────────────────────────────────────────────────
function PoolDetailModal({ stats, selectedMonth, onClose, onLogEntry, onDeleteEntry, onEditPool, onArchivePool, onOpenLog }: {
  stats: ExpensePoolWithStats; selectedMonth: string; onClose: () => void
  onLogEntry: () => void
  onDeleteEntry: (entry: ExpensePoolEntry) => Promise<void>
  onEditPool: (updated: Partial<Pick<ExpensePool, 'title' | 'budget_amount' | 'category' | 'note'>>) => Promise<void>
  onArchivePool: () => Promise<void>
  onOpenLog: () => void
}) {
  const { pool, entries, spent, remaining, pct } = stats
  const [tab, setTab]             = useState<'overview' | 'history' | 'edit'>('overview')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [editTitle, setEditTitle]   = useState(pool.title)
  const [editAmount, setEditAmount] = useState(String(pool.budget_amount))
  const [editCategory, setEditCategory] = useState<Category>(pool.category)
  const [editNote, setEditNote]     = useState(pool.note ?? '')
  const [editSaving, setEditSaving] = useState(false)
  const [archiving, setArchiving]   = useState(false)

  const over = spent > pool.budget_amount
  const warn = !over && pct >= 80
  const cfg  = CATEGORY_CONFIG[pool.category]

  const handleDeleteEntry = async (entry: ExpensePoolEntry) => {
    setDeletingId(entry.id); await onDeleteEntry(entry); setDeletingId(null)
  }
  const handleEditPool = async () => {
    if (!editTitle.trim() || !editAmount || parseFloat(editAmount) <= 0) return
    setEditSaving(true)
    await onEditPool({ title: editTitle.trim(), budget_amount: parseFloat(editAmount), category: editCategory, note: editNote.trim() })
    setEditSaving(false)
  }
  const handleArchive = async () => { setArchiving(true); await onArchivePool(); setArchiving(false) }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/30 px-4 pb-4 sm:pb-0">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl max-h-[88vh] flex flex-col animate-slide-up">
        <div className="flex items-start justify-between p-5 pb-3 border-b border-gray-100">
          <div className="flex-1 min-w-0 mr-3">
            <p className="text-base font-medium text-black truncate">{pool.title}</p>
            <p className="text-xs text-gray-400 mt-0.5">{fmtShort(spent)} of {fmtShort(pool.budget_amount)} used · {getMonthLabelFull(selectedMonth)}</p>
          </div>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-black transition-all shrink-0"><X size={16} /></button>
        </div>
        <div className="px-5 pt-3 pb-0">
          <div className="bg-gray-100 rounded-full h-2.5 overflow-hidden mb-1">
            <div className={`h-full rounded-full transition-all duration-700 ${over ? 'bg-red-500' : warn ? 'bg-amber-500' : 'bg-black'}`} style={{ width: `${pct}%` }} />
          </div>
          <div className="flex justify-between">
            <span className={`text-xs ${over ? 'text-red-500' : warn ? 'text-amber-500' : 'text-gray-400'}`}>{pct.toFixed(0)}% used</span>
            {over ? <span className="text-xs text-red-500 font-medium">Over by {fmtShort(spent - pool.budget_amount)}</span>
                  : <span className="text-xs text-gray-400">{fmtShort(remaining)} remaining</span>}
          </div>
        </div>
        <div className="flex gap-1 mx-5 mt-3 bg-gray-100 p-1 rounded-lg">
          {(['overview', 'history', 'edit'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-1 rounded-md text-xs font-medium transition-all ${tab === t ? 'bg-white text-black shadow-sm' : 'text-gray-400 hover:text-black'}`}>
              {t === 'overview' ? 'Overview' : t === 'history' ? `History (${entries.length})` : 'Edit'}
            </button>
          ))}
        </div>
        <div className="flex-1 overflow-y-auto px-5 pb-5 pt-3">
          {tab === 'overview' && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-gray-50 rounded-xl px-3 py-2.5">
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">Budget</p>
                  <p className="text-sm font-semibold text-black">{fmtShort(pool.budget_amount)}</p>
                  <p className="text-[10px] text-gray-400">per month</p>
                </div>
                <div className={`rounded-xl px-3 py-2.5 ${over ? 'bg-red-50' : 'bg-gray-50'}`}>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">Remaining</p>
                  <p className={`text-sm font-semibold ${over ? 'text-red-600' : 'text-black'}`}>{fmtShort(Math.abs(remaining))}</p>
                  <p className={`text-[10px] ${over ? 'text-red-400' : 'text-gray-400'}`}>{over ? 'over budget' : 'left'}</p>
                </div>
              </div>
              <div className="bg-gray-50 rounded-xl px-3 py-2.5 flex justify-between items-center">
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">Total used</p>
                  <p className="text-sm font-semibold text-black">{fmtShort(spent)}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">Entries</p>
                  <p className="text-sm font-semibold text-black">{entries.length}</p>
                </div>
              </div>
              <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg ${cfg.bg} ${cfg.text} text-xs font-medium`}>
                {cfg.icon} {cfg.label}
              </div>
              {pool.note && <p className="text-xs text-gray-400 italic">{pool.note}</p>}
              <button onClick={onOpenLog}
                className="w-full bg-black text-white rounded-lg py-2.5 text-sm font-medium hover:bg-gray-800 active:scale-[.98] transition-all flex items-center justify-center gap-2">
                <Plus size={14} /> Log daily usage
              </button>
            </div>
          )}
          {tab === 'history' && (
            entries.length === 0 ? (
              <div className="text-center py-8"><History size={24} className="mx-auto mb-2 text-gray-200" /><p className="text-xs text-gray-300">No entries this month yet</p><button onClick={onOpenLog} className="mt-3 inline-flex items-center gap-1 text-xs text-black font-medium hover:underline"><Plus size={11} /> Log first usage</button></div>
            ) : (
              <div className="flex flex-col gap-2">
                <div className="bg-gray-50 rounded-xl px-3 py-2.5 mb-1 flex justify-between items-center">
                  <span className="text-xs text-gray-500">{entries.length} entr{entries.length !== 1 ? 'ies' : 'y'} this month</span>
                  <span className="text-xs font-medium text-black">{fmtShort(spent)} total</span>
                </div>
                {entries.map(entry => (
                  <div key={entry.id} className="flex items-center gap-3 border border-gray-100 rounded-xl px-3 py-2.5 group hover:bg-gray-50 transition-all">
                    <div className={`w-7 h-7 ${cfg.bg} rounded-lg flex items-center justify-center shrink-0`}>
                      <span className={cfg.text}>{cfg.icon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${cfg.text}`}>-{fmtShort(entry.amount)}</p>
                      {entry.note && <p className="text-xs text-gray-400 truncate">{entry.note}</p>}
                      <p className="text-xs text-gray-300">{new Date(entry.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                    </div>
                    <button onClick={() => handleDeleteEntry(entry)} disabled={deletingId === entry.id}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-all disabled:opacity-50 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 shrink-0">
                      {deletingId === entry.id ? <div className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin" /> : <Trash2 size={12} />}
                    </button>
                  </div>
                ))}
              </div>
            )
          )}
          {tab === 'edit' && (
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-400 mb-2 block">Category</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {(Object.keys(CATEGORY_CONFIG) as Category[]).filter(c => c !== 'savings').map(c => {
                    const cat = CATEGORY_CONFIG[c]; const active = editCategory === c
                    return (
                      <button key={c} type="button" onClick={() => setEditCategory(c)}
                        className={`flex flex-col items-center gap-1 py-2.5 rounded-xl text-xs font-medium transition-all ${active ? `${cat.bg} ${cat.text} ring-1 ring-current` : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`}>
                        <span className={active ? cat.text : 'text-gray-400'}>{cat.icon}</span>
                        <span className="text-[10px] leading-none">{cat.label.split(' ')[0]}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Pool name</label>
                <input value={editTitle} onChange={e => setEditTitle(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-black focus:outline-none focus:border-black transition" />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Monthly budget (Rp)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-medium select-none">Rp</span>
                  <input type="text" inputMode="numeric" value={editAmount} onChange={e => setEditAmount(e.target.value.replace(/[^0-9.]/g, ''))}
                    className="w-full border border-gray-200 rounded-lg pl-10 pr-3 py-2.5 text-sm text-black focus:outline-none focus:border-black transition font-medium" />
                </div>
                {editAmount && <p className="text-xs text-gray-400 mt-1 pl-1">{fmt(parseFloat(editAmount) || 0)}</p>}
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Note <span className="text-gray-300">(optional)</span></label>
                <input value={editNote} onChange={e => setEditNote(e.target.value)} placeholder="Add a note..."
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-black focus:outline-none focus:border-black transition" />
              </div>
              <button onClick={handleEditPool} disabled={editSaving}
                className="w-full bg-black text-white rounded-lg py-2.5 text-sm font-medium hover:bg-gray-800 active:scale-[.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                {editSaving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Check size={14} /> Save changes</>}
              </button>
              <div className="pt-2 border-t border-gray-100">
                <button onClick={handleArchive} disabled={archiving}
                  className="w-full border border-red-200 text-red-500 hover:bg-red-50 rounded-lg py-2.5 text-sm font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                  {archiving ? <div className="w-4 h-4 border-2 border-red-300 border-t-red-500 rounded-full animate-spin" /> : <><Trash2 size={14} /> Archive this pool</>}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Add Split Bill Modal ─────────────────────────────────────────────────────
function AddSplitBillModal({ onClose, onSave }: {
  onClose: () => void
  onSave: (
    data: { title: string; total_amount: number; category: Category; note: string },
    participants: { name: string; share_amount: number }[]
  ) => Promise<void>
}) {
  const [title, setTitle]       = useState('')
  const [amount, setAmount]     = useState('')
  const [category, setCategory] = useState<Category>('food')
  const [note, setNote]         = useState('')
  const [names, setNames]       = useState<string[]>(['', ''])
  const [customShares, setCustomShares] = useState<Record<number, number>>({})
  const [splitEqually, setSplitEqually] = useState(true)
  const [includeMe, setIncludeMe]       = useState(true)
  const [saving, setSaving]     = useState(false)

  const total       = parseRp(amount)
  const trimmedNames = names.map(n => n.trim())
  const filledCount  = trimmedNames.filter(Boolean).length

  // Equal split: each person (incl. me, if chosen) owes total / n; remainder goes to me
  // when I'm included, otherwise to the first participants so shares sum exactly.
  const equalShares = (): number[] => {
    const n = filledCount + (includeMe ? 1 : 0)
    if (n === 0) return trimmedNames.map(() => 0)
    const base = Math.floor(total / n)
    const shares = trimmedNames.map(nm => nm ? base : 0)
    if (!includeMe) {
      let rem = total - base * filledCount
      for (let i = 0; rem > 0 && i < shares.length; i++) { if (trimmedNames[i]) { shares[i] += 1; rem-- } }
    }
    return shares
  }

  const shares    = splitEqually ? equalShares() : trimmedNames.map((_, i) => customShares[i] || 0)
  const owedTotal = trimmedNames.reduce((s, nm, i) => s + (nm ? shares[i] : 0), 0)
  const myShare   = includeMe ? Math.max(total - owedTotal, 0) : 0

  const addName    = () => setNames(prev => [...prev, ''])
  const removeName = (idx: number) => { setNames(prev => prev.filter((_, i) => i !== idx)); setCustomShares(prev => { const n = { ...prev }; delete n[idx]; return n }) }
  const setName    = (idx: number, v: string) => setNames(prev => prev.map((n, i) => i === idx ? v : n))
  const setShare   = (idx: number, v: string) => setCustomShares(prev => ({ ...prev, [idx]: parseRp(v) }))

  const canSave = !!title.trim() && total > 0 && filledCount > 0
  const handleSave = async () => {
    if (!canSave) return
    const participants = trimmedNames.map((nm, i) => ({ name: nm, share_amount: shares[i] })).filter(p => p.name)
    setSaving(true)
    await onSave({ title: title.trim(), total_amount: total, category, note: note.trim() }, participants)
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/30 px-4 pb-4 sm:pb-0">
      <div className="bg-white rounded-2xl w-full max-w-sm p-5 shadow-xl max-h-[90vh] overflow-y-auto animate-slide-up">
        <div className="flex justify-between items-center mb-5">
          <div><h2 className="text-base font-medium text-black">Split a bill</h2><p className="text-xs text-gray-400 mt-0.5">Track who owes you</p></div>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-black transition-all"><X size={16} /></button>
        </div>
        <div className="mb-4">
          <label className="text-xs text-gray-400 mb-2 block">Category</label>
          <div className="grid grid-cols-4 gap-1.5">
            {(Object.keys(CATEGORY_CONFIG) as Category[]).filter(c => c !== 'savings').map(c => {
              const cfg = CATEGORY_CONFIG[c]; const active = category === c
              return (
                <button key={c} type="button" onClick={() => setCategory(c)}
                  className={`flex flex-col items-center gap-1 py-2.5 rounded-xl text-xs font-medium transition-all ${active ? `${cfg.bg} ${cfg.text} ring-1 ring-current` : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`}>
                  <span className={active ? cfg.text : 'text-gray-400'}>{cfg.icon}</span>
                  <span className="text-[10px] leading-none">{cfg.label.split(' ')[0]}</span>
                </button>
              )
            })}
          </div>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Total bill (Rp)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-medium select-none">Rp</span>
              <input type="text" inputMode="numeric" value={groupId(total)} onChange={e => setAmount(e.target.value)} placeholder="0" autoFocus
                className="w-full border border-gray-200 rounded-lg pl-10 pr-3 py-2.5 text-sm text-black focus:outline-none focus:border-black transition font-medium" />
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">{"What's it for?"}</label>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Makan di Sushi Tei, Trip Bali..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-black focus:outline-none focus:border-black transition" />
          </div>

          {/* Split options */}
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setSplitEqually(v => !v)}
              className={`flex-1 py-1.5 rounded-lg text-xs font-medium border transition-all ${splitEqually ? 'bg-black text-white border-black' : 'border-gray-200 text-gray-500 hover:border-black hover:text-black'}`}>
              Split equally
            </button>
            <button type="button" onClick={() => setIncludeMe(v => !v)}
              className={`flex-1 py-1.5 rounded-lg text-xs font-medium border transition-all ${includeMe ? 'bg-gray-100 text-black border-gray-200' : 'border-gray-200 text-gray-400 hover:text-black'}`}>
              {includeMe ? '✓ ' : ''}Include me
            </button>
          </div>

          {/* Participants */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs text-gray-400">People who owe you</label>
              <button type="button" onClick={addName} className="flex items-center gap-1 text-[11px] text-gray-500 hover:text-black transition-colors"><UserPlus size={12} /> Add person</button>
            </div>
            <div className="flex flex-col gap-1.5">
              {names.map((nm, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <input value={nm} onChange={e => setName(i, e.target.value)} placeholder={`Person ${i + 1}`}
                    className="flex-1 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-black focus:outline-none focus:border-black transition" />
                  <div className="relative w-28 shrink-0">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 select-none">Rp</span>
                    <input type="text" inputMode="numeric" value={groupId(shares[i] || 0)} disabled={splitEqually}
                      onChange={e => setShare(i, e.target.value)}
                      className="w-full border border-gray-200 rounded-lg pl-6 pr-2 py-1.5 text-xs text-black focus:outline-none focus:border-black transition text-right disabled:bg-gray-50 disabled:text-gray-400" />
                  </div>
                  {names.length > 1 && (
                    <button type="button" onClick={() => removeName(i)} className="p-1 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all"><X size={14} /></button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {total > 0 && filledCount > 0 && (
            <div className="bg-gray-50 rounded-xl px-3 py-2.5 space-y-1">
              <div className="flex justify-between text-xs"><span className="text-gray-500">Owed to you</span><span className="font-semibold text-black">{fmt(owedTotal)}</span></div>
              {includeMe && <div className="flex justify-between text-xs"><span className="text-gray-400">Your share</span><span className="text-gray-500">{fmt(myShare)}</span></div>}
              {!splitEqually && owedTotal + myShare !== total && (
                <p className="text-[10px] text-amber-600">{"Shares don't add up to the total"} ({fmt(total)})</p>
              )}
            </div>
          )}

          <div>
            <label className="text-xs text-gray-400 mb-1 block">Note <span className="text-gray-300">(optional)</span></label>
            <input value={note} onChange={e => setNote(e.target.value)} placeholder="Add a note..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-black focus:outline-none focus:border-black transition" />
          </div>
        </div>
        <div className="flex gap-2 mt-5">
          <button onClick={onClose} className="flex-1 border border-gray-200 rounded-lg py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition">Cancel</button>
          <button onClick={handleSave} disabled={saving || !canSave}
            className="flex-1 bg-black text-white rounded-lg py-2.5 text-sm font-medium hover:bg-gray-800 active:scale-[.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2">
            {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Plus size={14} /> Create split</>}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Split Bill Detail Modal ──────────────────────────────────────────────────
function SplitBillDetailModal({ stats, onClose, onTogglePaid, onAddParticipant, onDeleteParticipant, onEditBill, onDeleteBill }: {
  stats: SplitBillWithStats; onClose: () => void
  onTogglePaid: (p: SplitBillParticipant) => Promise<void>
  onAddParticipant: (name: string, share: number) => Promise<void>
  onDeleteParticipant: (p: SplitBillParticipant) => Promise<void>
  onEditBill: (updated: Partial<Pick<SplitBill, 'title' | 'total_amount' | 'category' | 'note'>>) => Promise<void>
  onDeleteBill: () => Promise<void>
}) {
  const { bill, participants, owed, collected, settled } = stats
  const [tab, setTab]               = useState<'people' | 'edit'>('people')
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [newName, setNewName]       = useState('')
  const [newShare, setNewShare]     = useState('')
  const [addingPerson, setAddingPerson] = useState(false)
  const [editTitle, setEditTitle]   = useState(bill.title)
  const [editAmount, setEditAmount] = useState(String(bill.total_amount))
  const [editCategory, setEditCategory] = useState<Category>(bill.category)
  const [editNote, setEditNote]     = useState(bill.note ?? '')
  const [editSaving, setEditSaving] = useState(false)
  const [deleting, setDeleting]     = useState(false)

  const cfg = CATEGORY_CONFIG[bill.category]
  const pct = bill.total_amount > 0 ? Math.min((collected / bill.total_amount) * 100, 100) : 0

  const handleToggle = async (p: SplitBillParticipant) => { setTogglingId(p.id); await onTogglePaid(p); setTogglingId(null) }
  const handleAdd = async () => {
    if (!newName.trim()) return
    setAddingPerson(true); await onAddParticipant(newName.trim(), parseRp(newShare)); setAddingPerson(false)
    setNewName(''); setNewShare('')
  }
  const handleEdit = async () => {
    if (!editTitle.trim() || parseRp(editAmount) <= 0) return
    setEditSaving(true)
    await onEditBill({ title: editTitle.trim(), total_amount: parseRp(editAmount), category: editCategory, note: editNote.trim() })
    setEditSaving(false)
  }
  const handleDelete = async () => { setDeleting(true); await onDeleteBill(); setDeleting(false) }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/30 px-4 pb-4 sm:pb-0">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl max-h-[88vh] flex flex-col animate-slide-up">
        <div className="flex items-start justify-between p-5 pb-3 border-b border-gray-100">
          <div className="flex-1 min-w-0 mr-3">
            <p className="text-base font-medium text-black truncate">{bill.title}</p>
            <p className="text-xs text-gray-400 mt-0.5">{fmt(bill.total_amount)} total · {participants.length} {participants.length === 1 ? 'person' : 'people'}</p>
          </div>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-black transition-all shrink-0"><X size={16} /></button>
        </div>
        <div className="px-5 pt-3 pb-0">
          <div className="bg-gray-100 rounded-full h-2.5 overflow-hidden mb-1">
            <div className={`h-full rounded-full transition-all duration-700 ${settled ? 'bg-emerald-500' : 'bg-black'}`} style={{ width: `${pct}%` }} />
          </div>
          <div className="flex justify-between">
            <span className="text-xs text-gray-400">{fmt(collected)} collected</span>
            {settled ? <span className="text-xs text-emerald-500 font-medium">All settled</span>
                     : <span className="text-xs text-gray-500 font-medium">{fmt(owed)} owed to you</span>}
          </div>
        </div>
        <div className="flex gap-1 mx-5 mt-3 bg-gray-100 p-1 rounded-lg">
          {(['people', 'edit'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-1 rounded-md text-xs font-medium transition-all ${tab === t ? 'bg-white text-black shadow-sm' : 'text-gray-400 hover:text-black'}`}>
              {t === 'people' ? `People (${participants.length})` : 'Edit'}
            </button>
          ))}
        </div>
        <div className="flex-1 overflow-y-auto px-5 pb-5 pt-3">
          {tab === 'people' && (
            <div className="space-y-2">
              {participants.map(p => (
                <div key={p.id} className="flex items-center gap-3 border border-gray-100 rounded-xl px-3 py-2.5 group">
                  <button onClick={() => handleToggle(p)} disabled={togglingId === p.id}
                    className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-all ${p.is_paid ? 'bg-emerald-50 text-emerald-600' : `${cfg.bg} ${cfg.text}`}`}>
                    {togglingId === p.id ? <div className="w-3.5 h-3.5 border border-gray-400 border-t-transparent rounded-full animate-spin" /> : p.is_paid ? <Check size={16} /> : <Users size={15} />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{p.name}</p>
                    <p className={`text-xs ${p.is_paid ? 'text-emerald-500' : 'text-gray-400'}`}>{fmt(p.share_amount)} · {p.is_paid ? 'paid' : 'unpaid'}</p>
                  </div>
                  <button onClick={() => handleToggle(p)} disabled={togglingId === p.id}
                    className={`text-[11px] px-2.5 py-1 rounded-lg border font-medium transition-all shrink-0 ${p.is_paid ? 'border-gray-200 text-gray-400 hover:text-black' : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'}`}>
                    {p.is_paid ? 'Undo' : 'Mark paid'}
                  </button>
                  <button onClick={() => onDeleteParticipant(p)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-500 transition-all shrink-0"><Trash2 size={12} /></button>
                </div>
              ))}
              {/* Add person */}
              <div className="flex items-center gap-1.5 pt-1">
                <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Add a person..."
                  onKeyDown={e => { if (e.key === 'Enter') handleAdd() }}
                  className="flex-1 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-black focus:outline-none focus:border-black transition" />
                <div className="relative w-24 shrink-0">
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 select-none">Rp</span>
                  <input type="text" inputMode="numeric" value={groupId(parseRp(newShare))} onChange={e => setNewShare(e.target.value)} placeholder="0"
                    className="w-full border border-gray-200 rounded-lg pl-6 pr-2 py-1.5 text-xs text-black focus:outline-none focus:border-black transition text-right" />
                </div>
                <button onClick={handleAdd} disabled={addingPerson || !newName.trim()}
                  className="w-8 h-8 flex items-center justify-center bg-black text-white rounded-lg hover:bg-gray-800 transition-all disabled:opacity-40 shrink-0">
                  {addingPerson ? <div className="w-3.5 h-3.5 border border-white/30 border-t-white rounded-full animate-spin" /> : <Plus size={14} />}
                </button>
              </div>
              {bill.note && <p className="text-xs text-gray-400 italic pt-1">{bill.note}</p>}
            </div>
          )}
          {tab === 'edit' && (
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-400 mb-2 block">Category</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {(Object.keys(CATEGORY_CONFIG) as Category[]).filter(c => c !== 'savings').map(c => {
                    const cat = CATEGORY_CONFIG[c]; const active = editCategory === c
                    return (
                      <button key={c} type="button" onClick={() => setEditCategory(c)}
                        className={`flex flex-col items-center gap-1 py-2.5 rounded-xl text-xs font-medium transition-all ${active ? `${cat.bg} ${cat.text} ring-1 ring-current` : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`}>
                        <span className={active ? cat.text : 'text-gray-400'}>{cat.icon}</span>
                        <span className="text-[10px] leading-none">{cat.label.split(' ')[0]}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Title</label>
                <input value={editTitle} onChange={e => setEditTitle(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-black focus:outline-none focus:border-black transition" />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Total bill (Rp)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-medium select-none">Rp</span>
                  <input type="text" inputMode="numeric" value={groupId(parseRp(editAmount))} onChange={e => setEditAmount(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg pl-10 pr-3 py-2.5 text-sm text-black focus:outline-none focus:border-black transition font-medium" />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Note <span className="text-gray-300">(optional)</span></label>
                <input value={editNote} onChange={e => setEditNote(e.target.value)} placeholder="Add a note..."
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-black focus:outline-none focus:border-black transition" />
              </div>
              <button onClick={handleEdit} disabled={editSaving}
                className="w-full bg-black text-white rounded-lg py-2.5 text-sm font-medium hover:bg-gray-800 active:scale-[.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                {editSaving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Check size={14} /> Save changes</>}
              </button>
              <div className="pt-2 border-t border-gray-100">
                <button onClick={handleDelete} disabled={deleting}
                  className="w-full border border-red-200 text-red-500 hover:bg-red-50 rounded-lg py-2.5 text-sm font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                  {deleting ? <div className="w-4 h-4 border-2 border-red-300 border-t-red-500 rounded-full animate-spin" /> : <><Trash2 size={14} /> Delete this bill</>}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Budget Simulator Modal ───────────────────────────────────────────────────
function BudgetSimulatorModal({
  thisMonthIncomeTot, categoryTotals,
  last6Months, expenses, recurring, budgets, savingsGoals, selectedMonth, onClose
}: {
  thisMonthIncomeTot: number
  categoryTotals: Partial<Record<Category, number>>
  last6Months: { key: string; label: string; total: number }[]
  expenses: Expense[]; recurring: RecurringExpense[]
  budgets: Budget[]; savingsGoals: SavingsGoal[]
  selectedMonth: string; onClose: () => void
}) {
  const [tab, setTab] = useState<'plan' | 'scenarios' | 'goals'>('plan')
  const [simIncome, setSimIncome] = useState(thisMonthIncomeTot || 0)
  const [simCategoryBudgets, setSimCategoryBudgets] = useState<Partial<Record<Category, number>>>(() => {
    const init: Partial<Record<Category, number>> = {}
    budgets.forEach(b => { init[b.category] = b.limit_amount })
    return init
  })
  const [activeScenario, setActiveScenario] = useState<'custom' | 'frugal' | 'normal' | 'ambitious'>('custom')
  const [goalAllocations, setGoalAllocations] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {}
    savingsGoals.forEach(g => { init[g.id] = 0 })
    return init
  })
  const [saving, setSaving] = useState(false)
  const [savedAt, setSavedAt] = useState<Date | null>(null)
  const [loadingPlan, setLoadingPlan] = useState(true)
  const [profiles, setProfiles] = useState<BudgetProfile[]>([])
  const [activeProfileId, setActiveProfileId] = useState<string | null>(null)
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const [namingMode, setNamingMode] = useState<'new' | 'rename' | null>(null)
  const [nameDraft, setNameDraft] = useState('')

  const activeProfile = profiles.find(p => p.id === activeProfileId) || null

  const loadProfileIntoEditor = (p: BudgetProfile) => {
    setActiveProfileId(p.id)
    setSimIncome(p.sim_income || thisMonthIncomeTot || 0)
    setSimCategoryBudgets(p.category_budgets || {})
    setGoalAllocations(p.goal_allocations || {})
    setActiveScenario('custom')
    setSavedAt(new Date(p.updated_at))
  }

  useEffect(() => {
    const load = async () => {
      const { data: ud } = await supabase.auth.getUser()
      const user = ud.user; if (!user) { setLoadingPlan(false); return }
      const { data } = await supabase.from('budget_simulations').select('*').eq('user_id', user.id).order('created_at', { ascending: true })
      const list = (data || []) as BudgetProfile[]
      setProfiles(list)
      if (list.length > 0) {
        const active = [...list].sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())[0]
        loadProfileIntoEditor(active)
      }
      setLoadingPlan(false)
    }
    load()
  }, [])

  const planPayload = () => ({
    sim_income: simIncome,
    category_budgets: simCategoryBudgets,
    goal_allocations: goalAllocations,
  })

  const handleSavePlan = async () => {
    setSaving(true)
    const { data: ud } = await supabase.auth.getUser()
    const user = ud.user; if (!user) { setSaving(false); return }
    const now = new Date().toISOString()
    if (activeProfileId) {
      const { error } = await supabase.from('budget_simulations')
        .update({ ...planPayload(), updated_at: now }).eq('id', activeProfileId)
      if (!error) {
        setProfiles(prev => prev.map(p => p.id === activeProfileId ? { ...p, ...planPayload(), updated_at: now } : p))
        setSavedAt(new Date())
      }
    } else {
      const { data: inserted, error } = await supabase.from('budget_simulations')
        .insert({ user_id: user.id, name: 'My plan', ...planPayload(), updated_at: now }).select().single()
      if (!error && inserted) {
        setProfiles(prev => [...prev, inserted as BudgetProfile])
        setActiveProfileId(inserted.id)
        setSavedAt(new Date())
      }
    }
    setSaving(false)
  }

  const handleSelectProfile = (id: string) => {
    const p = profiles.find(pf => pf.id === id)
    if (p) loadProfileIntoEditor(p)
    setProfileMenuOpen(false)
  }

  // Creates a new profile seeded with the current editor values (duplicate-current)
  const handleCreateProfile = async (name: string) => {
    const { data: ud } = await supabase.auth.getUser()
    const user = ud.user; if (!user) return
    const trimmed = name.trim() || `Plan ${profiles.length + 1}`
    const now = new Date().toISOString()
    const { data: inserted, error } = await supabase.from('budget_simulations')
      .insert({ user_id: user.id, name: trimmed, ...planPayload(), updated_at: now }).select().single()
    if (!error && inserted) {
      setProfiles(prev => [...prev, inserted as BudgetProfile])
      setActiveProfileId(inserted.id)
      setSavedAt(new Date())
    }
  }

  const handleRenameProfile = async (name: string) => {
    if (!activeProfileId) return
    const trimmed = name.trim(); if (!trimmed) return
    const { error } = await supabase.from('budget_simulations').update({ name: trimmed }).eq('id', activeProfileId)
    if (!error) setProfiles(prev => prev.map(p => p.id === activeProfileId ? { ...p, name: trimmed } : p))
  }

  const handleDeleteProfile = async () => {
    if (!activeProfileId) return
    const id = activeProfileId
    await supabase.from('budget_simulations').delete().eq('id', id)
    const remaining = profiles.filter(p => p.id !== id)
    setProfiles(remaining)
    if (remaining.length > 0) {
      loadProfileIntoEditor(remaining[0])
    } else {
      setActiveProfileId(null); setSavedAt(null)
      setSimCategoryBudgets({}); setGoalAllocations({})
    }
    setProfileMenuOpen(false)
  }

  const submitName = () => {
    if (namingMode === 'new') handleCreateProfile(nameDraft)
    else if (namingMode === 'rename') handleRenameProfile(nameDraft)
    setNamingMode(null); setNameDraft('')
  }

  // ── Key derived values ──────────────────────────────────────────────────────
  const simFixedTotal = useMemo(() => recurring.reduce((s, r) => {
    const monthly = r.frequency === 'daily' ? r.amount * 30 : r.frequency === 'weekly' ? r.amount * 4.33 : r.amount
    return s + monthly
  }, 0), [recurring])

  const simVariableTotal = useMemo(() =>
    Object.values(simCategoryBudgets).reduce((s, v) => s + (v || 0), 0), [simCategoryBudgets])

  const simSurplus     = simIncome - simFixedTotal - simVariableTotal
  const simSavingsRate = simIncome > 0 ? (simSurplus / simIncome) * 100 : 0

  const threeMonthCatAvg = useMemo(() => {
    const recentThree = last6Months.slice(2, 5)
    const totals: Partial<Record<Category, number>> = {}
    recentThree.forEach(m => {
      expenses.filter(e => inMonth(e.created_at, m.key)).forEach(e => {
        totals[e.category] = (totals[e.category] || 0) + e.amount
      })
    })
    const avg: Partial<Record<Category, number>> = {}
    ;(Object.keys(totals) as Category[]).forEach(cat => { avg[cat] = Math.round((totals[cat] || 0) / 3) })
    return avg
  }, [last6Months, expenses])

  const lastMonthCatActuals = useMemo(() => {
    const idx = last6Months.findIndex(m => m.key === selectedMonth)
    if (idx <= 0) return {}
    const lastKey = last6Months[idx - 1].key
    const map: Partial<Record<Category, number>> = {}
    expenses.filter(e => inMonth(e.created_at, lastKey)).forEach(e => { map[e.category] = (map[e.category] || 0) + e.amount })
    return map
  }, [last6Months, selectedMonth, expenses])

  const frugalBudgets = useMemo(() =>
    Object.fromEntries(Object.entries(simCategoryBudgets).map(([c, v]) => [c, Math.round((v || 0) * 0.7)])) as Partial<Record<Category, number>>,
    [simCategoryBudgets])

  const normalBudgets = useMemo(() => lastMonthCatActuals, [lastMonthCatActuals])

  const ambitiousBudgets = useMemo(() => {
    const totalGoalAlloc = Object.values(goalAllocations).reduce((s, v) => s + v, 0)
    const available = Math.max(simIncome - simFixedTotal - totalGoalAlloc, 0)
    const totalAvg   = Object.values(threeMonthCatAvg).reduce((s, v) => s + (v || 0), 0)
    if (totalAvg === 0) return simCategoryBudgets
    return Object.fromEntries(
      (Object.keys(threeMonthCatAvg) as Category[]).map(cat => [cat, Math.round(((threeMonthCatAvg[cat] || 0) / totalAvg) * available)])
    ) as Partial<Record<Category, number>>
  }, [simIncome, simFixedTotal, goalAllocations, threeMonthCatAvg, simCategoryBudgets])

  // Goal simulator
  const totalGoalAllocations    = Object.values(goalAllocations).reduce((s, v) => s + v, 0)
  const goalAllocExceedsSurplus = totalGoalAllocations > simSurplus && simSurplus > 0

  function monthsToReach(goal: SavingsGoal, monthly: number): number | null {
    if (monthly <= 0) return null
    const remaining = goal.target_amount - goal.current_amount
    if (remaining <= 0) return 0
    return Math.ceil(remaining / monthly)
  }

  // Handlers
  const handleResetFromActuals = () => { setSimCategoryBudgets({ ...categoryTotals }); setActiveScenario('custom') }
  const handleAutoAllocate5030 = () => {
    const needs: Category[] = ['housing', 'utilities', 'food', 'transport']
    const wants: Category[] = ['shopping', 'entertainment', 'personal', 'other']
    const newB: Partial<Record<Category, number>> = {}
    const needPool = Math.round(simIncome * 0.50)
    const wantPool = Math.round(simIncome * 0.30)
    const avgNeeds = needs.filter(c => (threeMonthCatAvg[c] || 0) > 0)
    const avgWants = wants.filter(c => (threeMonthCatAvg[c] || 0) > 0)
    const needTot  = avgNeeds.reduce((s, c) => s + (threeMonthCatAvg[c] || 0), 0)
    const wantTot  = avgWants.reduce((s, c) => s + (threeMonthCatAvg[c] || 0), 0)
    avgNeeds.forEach(c => { newB[c] = needTot > 0 ? Math.round((threeMonthCatAvg[c] || 0) / needTot * needPool) : Math.round(needPool / avgNeeds.length) })
    avgWants.forEach(c => { newB[c] = wantTot > 0 ? Math.round((threeMonthCatAvg[c] || 0) / wantTot * wantPool) : Math.round(wantPool / avgWants.length) })
    newB.savings = Math.round(simIncome * 0.20)
    setSimCategoryBudgets(newB); setActiveScenario('custom')
  }
  const handleApplyScenario = (s: 'frugal' | 'normal' | 'ambitious') => {
    const map = { frugal: frugalBudgets, normal: normalBudgets, ambitious: ambitiousBudgets }
    setSimCategoryBudgets({ ...map[s] }); setActiveScenario(s); setTab('plan')
  }
  const updateCatBudget = (cat: Category, val: string) => {
    const n = parseRp(val)
    setSimCategoryBudgets(prev => ({ ...prev, [cat]: n }))
    setActiveScenario('custom')
  }

  function savedLabel() {
    if (!savedAt) return null
    const diffMin = Math.floor((Date.now() - savedAt.getTime()) / 60000)
    if (diffMin < 1) return 'just now'
    if (diffMin < 60) return `${diffMin}m ago`
    return `${Math.floor(diffMin / 60)}h ago`
  }

  // ── Scenario card helper ────────────────────────────────────────────────────
  function ScenarioCard({ name, desc, icon, budgetSet, scenarioKey }: {
    name: string; desc: string; icon: React.ReactNode
    budgetSet: Partial<Record<Category, number>>; scenarioKey: 'frugal' | 'normal' | 'ambitious'
  }) {
    const varTotal = Object.values(budgetSet).reduce((s, v) => s + (v || 0), 0)
    const surplus  = simIncome - simFixedTotal - varTotal
    const savRate  = simIncome > 0 ? (surplus / simIncome) * 100 : 0
    const isActive = activeScenario === scenarioKey
    return (
      <div className={`border rounded-xl p-3 flex flex-col gap-2 transition-all ${isActive ? 'border-black' : 'border-gray-100'}`}>
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className="text-gray-500">{icon}</span>
          <p className="text-xs font-semibold text-gray-800">{name}</p>
          {isActive && <span className="ml-auto text-[10px] bg-black text-white px-1.5 py-0.5 rounded-full">Active</span>}
        </div>
        <p className="text-[10px] text-gray-400 leading-relaxed">{desc}</p>
        <div className="space-y-1 text-xs">
          <div className="flex justify-between text-gray-500"><span>Variable</span><span className="font-medium">{fmt(varTotal)}</span></div>
          <div className="flex justify-between text-gray-500"><span>Surplus</span>
            <span className={`font-medium ${surplus >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>{fmt(Math.abs(surplus))}{surplus < 0 ? ' deficit' : ''}</span>
          </div>
          <div className="flex justify-between text-gray-500"><span>Savings rate</span>
            <span className={`font-medium ${savRate >= 20 ? 'text-emerald-600' : savRate >= 10 ? 'text-amber-600' : 'text-red-500'}`}>{savRate.toFixed(0)}%</span>
          </div>
        </div>
        <button onClick={() => handleApplyScenario(scenarioKey)}
          className={`w-full py-1.5 rounded-lg text-xs font-medium transition-all ${isActive ? 'bg-black text-white' : 'border border-gray-200 text-gray-600 hover:border-black hover:text-black'}`}>
          {isActive ? 'Applied' : 'Apply'}
        </button>
      </div>
    )
  }

  if (loadingPlan) return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white rounded-2xl p-8 shadow-xl flex flex-col items-center gap-3">
        <div className="w-6 h-6 border-2 border-gray-200 border-t-black rounded-full animate-spin" />
        <p className="text-sm text-gray-400">Loading your plan...</p>
      </div>
    </div>
  )

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/30 px-4 pb-4 sm:pb-0">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl max-h-[92vh] flex flex-col animate-slide-up">

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-gray-100 shrink-0">
          <div>
            <h2 className="text-base font-medium text-black">Budget Simulator</h2>
            <p className="text-xs text-gray-400 mt-0.5">What-if planning · {getMonthLabelFull(selectedMonth)}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {savedAt && <p className="text-[10px] text-gray-300">Saved {savedLabel()}</p>}
            <button onClick={handleSavePlan} disabled={saving}
              className="flex items-center gap-1.5 bg-black text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-gray-800 disabled:opacity-50 transition-all">
              {saving ? <div className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" /> : <Check size={12} />}
              Save plan
            </button>
            <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-black transition-all"><X size={16} /></button>
          </div>
        </div>

        {/* Profile bar */}
        <div className="flex items-center gap-2 px-5 mt-3 shrink-0">
          {namingMode ? (
            <div className="flex items-center gap-1.5 flex-1">
              <input autoFocus value={nameDraft} onChange={e => setNameDraft(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') submitName(); if (e.key === 'Escape') { setNamingMode(null); setNameDraft('') } }}
                placeholder={namingMode === 'new' ? 'New profile name…' : 'Rename profile…'}
                className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-xs text-black focus:outline-none focus:border-black transition" />
              <button onClick={submitName} className="flex items-center justify-center bg-black text-white w-8 h-8 rounded-lg hover:bg-gray-800 transition-all"><Check size={13} /></button>
              <button onClick={() => { setNamingMode(null); setNameDraft('') }} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-black transition-all"><X size={14} /></button>
            </div>
          ) : (<>
            <div className="relative flex-1">
              <button onClick={() => setProfileMenuOpen(v => !v)}
                className="w-full flex items-center justify-between gap-2 border border-gray-200 rounded-lg px-3 py-1.5 text-xs text-black hover:border-black transition-all">
                <span className="flex items-center gap-1.5 truncate"><Calculator size={12} className="text-gray-400 shrink-0" />{activeProfile ? activeProfile.name : 'Unsaved plan'}</span>
                <ChevronDown size={12} className={`text-gray-300 transition-transform shrink-0 ${profileMenuOpen ? 'rotate-180' : ''}`} />
              </button>
              {profileMenuOpen && (<>
                <div className="fixed inset-0 z-40" onClick={() => setProfileMenuOpen(false)} />
                <div className="absolute left-0 right-0 mt-1 bg-white border border-gray-100 rounded-xl shadow-xl py-1 z-50 max-h-60 overflow-y-auto">
                  {profiles.length === 0 && <p className="px-3 py-2 text-xs text-gray-300">No saved profiles yet — Save plan to create one</p>}
                  {profiles.map(p => (
                    <button key={p.id} onClick={() => handleSelectProfile(p.id)}
                      className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-xs transition-colors hover:bg-gray-50 ${p.id === activeProfileId ? 'text-black font-medium' : 'text-gray-600'}`}>
                      <span className="truncate">{p.name}</span>
                      {p.id === activeProfileId && <Check size={12} className="text-black shrink-0" />}
                    </button>
                  ))}
                </div>
              </>)}
            </div>
            <button onClick={() => { setNamingMode('new'); setNameDraft('') }}
              className="flex items-center gap-1 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-500 hover:border-black hover:text-black transition-all shrink-0">
              <Plus size={12} /> New
            </button>
            <RowMenu items={[
              { label: 'Rename', icon: <Pencil size={13} />, onClick: () => { setNamingMode('rename'); setNameDraft(activeProfile?.name || '') }, disabled: !activeProfileId },
              { label: 'Delete', icon: <Trash2 size={13} />, onClick: handleDeleteProfile, danger: true, disabled: !activeProfileId },
            ]} />
          </>)}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mx-5 mt-3 bg-gray-100 p-1 rounded-lg shrink-0">
          {(['plan', 'scenarios', 'goals'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-1 rounded-md text-[11px] font-medium transition-all ${tab === t ? 'bg-white text-black shadow-sm' : 'text-gray-400 hover:text-black'}`}>
              {t === 'plan' ? 'Planner' : t === 'scenarios' ? 'Compare' : 'Goals'}
            </button>
          ))}
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-5 pb-5 pt-4 space-y-4">

          {/* ── TAB 1: PLANNER ── */}
          {tab === 'plan' && (<>
            {/* Income */}
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Monthly income (Rp)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-medium select-none">Rp</span>
                <input type="text" inputMode="numeric" value={groupId(simIncome)} placeholder="0"
                  onChange={e => setSimIncome(parseRp(e.target.value))}
                  className="w-full border border-gray-200 rounded-lg pl-10 pr-3 py-2.5 text-sm text-black focus:outline-none focus:border-black transition font-medium" />
              </div>
            </div>

            {/* Fixed costs */}
            <div className="bg-gray-50 rounded-xl px-3 py-2.5">
              <div className="flex justify-between items-center mb-2">
                <p className="text-xs font-medium text-gray-500">Fixed costs <span className="text-gray-300 font-normal">(from recurring bills)</span></p>
                <p className="text-xs font-semibold text-gray-800">{fmt(simFixedTotal)}</p>
              </div>
              {recurring.length === 0
                ? <p className="text-xs text-gray-300">No recurring bills set up yet</p>
                : <div className="flex flex-col gap-1.5">
                  {recurring.map(r => {
                    const monthly = r.frequency === 'daily' ? r.amount * 30 : r.frequency === 'weekly' ? r.amount * 4.33 : r.amount
                    return (
                      <div key={r.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${CATEGORY_CONFIG[r.category].bg} ${CATEGORY_CONFIG[r.category].text}`}>{FREQ_LABELS[r.frequency]}</span>
                          <span className="text-xs text-gray-600 truncate max-w-[160px]">{r.title}</span>
                        </div>
                        <span className="text-xs text-gray-500 shrink-0">{fmt(Math.round(monthly))}/mo</span>
                      </div>
                    )
                  })}
                </div>
              }
            </div>

            {/* Category budgets */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium text-gray-500">Variable spending budgets</p>
                <div className="flex gap-1.5">
                  <button onClick={handleResetFromActuals} className="text-[10px] px-2 py-1 border border-gray-200 rounded-lg text-gray-500 hover:border-black hover:text-black transition-all">Reset actuals</button>
                  <button onClick={handleAutoAllocate5030} className="text-[10px] px-2 py-1 border border-gray-200 rounded-lg text-gray-500 hover:border-black hover:text-black transition-all">50/30/20</button>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                {(Object.keys(CATEGORY_CONFIG) as Category[]).map(cat => {
                  const cfg      = CATEGORY_CONFIG[cat]
                  const budget   = simCategoryBudgets[cat] || 0
                  const actual   = categoryTotals[cat] || 0
                  const avgVal   = threeMonthCatAvg[cat] || 0
                  const barPct   = simIncome > 0 ? Math.min((budget / simIncome) * 100, 100) : 0
                  return (
                    <div key={cat}>
                      <div className="flex items-center gap-2">
                        <div className={`w-6 h-6 ${cfg.bg} rounded-lg flex items-center justify-center shrink-0`}>
                          <span className={cfg.text}>{cfg.icon}</span>
                        </div>
                        <span className="text-xs text-gray-600 flex-1">{cfg.label}</span>
                        <div className="relative w-32 shrink-0">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 select-none">Rp</span>
                          <input type="text" inputMode="numeric" value={groupId(budget)} placeholder="0"
                            onChange={e => updateCatBudget(cat, e.target.value)}
                            className="w-full border border-gray-200 rounded-lg pl-6 pr-2 py-1.5 text-xs text-black focus:outline-none focus:border-black transition text-right" />
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-1 ml-8">
                        <div className="flex-1 bg-gray-100 rounded-full h-1 overflow-hidden">
                          <div className="h-full bg-black rounded-full transition-all duration-300" style={{ width: `${barPct}%` }} />
                        </div>
                        <span className="text-[10px] text-gray-300 shrink-0">
                          {actual > 0 && `spent ${fmt(actual)}`}{avgVal > 0 && actual === 0 && `avg ${fmt(avgVal)}`}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Waterfall summary */}
            <div className="border border-gray-100 rounded-xl px-4 py-3 space-y-2">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Monthly breakdown</p>
              <div className="flex justify-between text-sm"><span className="text-gray-600">Income</span><span className="font-semibold text-black">{fmt(simIncome)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-400">− Fixed costs</span><span className="text-gray-500">−{fmt(Math.round(simFixedTotal))}</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-400">− Variable budgets</span><span className="text-gray-500">−{fmt(simVariableTotal)}</span></div>
              <div className="h-px bg-gray-100" />
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">= Surplus / Savings</span>
                <div className="flex items-center gap-2">
                  <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${simSavingsRate >= 20 ? 'bg-emerald-50 text-emerald-700' : simSavingsRate >= 10 ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-600'}`}>
                    {simSavingsRate.toFixed(0)}% saved
                  </span>
                  <span className={`text-sm font-bold ${simSurplus >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {simSurplus >= 0 ? '+' : ''}{fmt(Math.round(simSurplus))}
                  </span>
                </div>
              </div>
              {simSurplus < 0 && (
                <div className="flex items-center gap-1.5 bg-red-50 rounded-lg px-2.5 py-2">
                  <AlertTriangle size={12} className="text-red-500 shrink-0" />
                  <p className="text-xs text-red-600">Budget exceeds income by {fmt(Math.abs(simSurplus))}</p>
                </div>
              )}
            </div>
          </>)}

          {/* ── TAB 2: SCENARIOS ── */}
          {tab === 'scenarios' && (<>
            <p className="text-xs text-gray-400">Compare budget scenarios — apply one to load it into the Planner.</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <ScenarioCard
                name="Frugal" scenarioKey="frugal" budgetSet={frugalBudgets}
                icon={<TrendingDown size={13} />}
                desc="−30% across all variable budgets. Maximize savings." />
              <ScenarioCard
                name="Normal" scenarioKey="normal" budgetSet={normalBudgets}
                icon={<BarChart2 size={13} />}
                desc="Last month's actual spending. Steady and realistic." />
              <ScenarioCard
                name="Ambitious" scenarioKey="ambitious" budgetSet={ambitiousBudgets}
                icon={<Target size={13} />}
                desc="Optimized around your savings goals. Goal-focused." />
            </div>
            <div className="bg-gray-50 rounded-xl px-3 py-2.5">
              <p className="text-xs text-gray-500 mb-1">Your current custom plan</p>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-black">{fmt(simVariableTotal)} variable</p>
                  <p className={`text-xs ${simSurplus >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                    {simSurplus >= 0 ? '+' : ''}{fmt(Math.abs(Math.round(simSurplus)))} surplus · {simSavingsRate.toFixed(0)}% saved
                  </p>
                </div>
                {activeScenario !== 'custom' && (
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium capitalize ${activeScenario === 'frugal' ? 'bg-emerald-50 text-emerald-700' : activeScenario === 'normal' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'}`}>
                    {activeScenario} applied
                  </span>
                )}
              </div>
            </div>
          </>)}

          {/* ── TAB 4: GOALS ── */}
          {tab === 'goals' && (<>
            {savingsGoals.length === 0 ? (
              <div className="text-center py-8">
                <Flag size={28} className="mx-auto mb-2 text-gray-200" />
                <p className="text-xs text-gray-400 font-medium mb-0.5">No savings goals set up</p>
                <p className="text-xs text-gray-300">Add goals from the dashboard to simulate here</p>
              </div>
            ) : (<>
              {goalAllocExceedsSurplus && (
                <div className="flex items-center gap-2 bg-red-50 rounded-xl px-3 py-2.5">
                  <AlertTriangle size={13} className="text-red-500 shrink-0" />
                  <p className="text-xs text-red-600">Total allocations exceed your projected surplus of {fmt(Math.max(simSurplus, 0))}</p>
                </div>
              )}
              <div className="flex flex-col gap-3">
                {savingsGoals.map(goal => {
                  const alloc   = goalAllocations[goal.id] || 0
                  const months  = monthsToReach(goal, alloc)
                  const pct     = Math.min((goal.current_amount / goal.target_amount) * 100, 100)
                  const done    = goal.current_amount >= goal.target_amount
                  const sliderMax = Math.max(simSurplus, 0)
                  let deadlineChip: { label: string; cls: string } | null = null
                  if (goal.deadline && months !== null && months > 0) {
                    const deadlineMonths = Math.ceil((new Date(goal.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30))
                    deadlineChip = months <= deadlineMonths
                      ? { label: `On track (${deadlineMonths}mo left)`, cls: 'bg-emerald-50 text-emerald-700' }
                      : { label: `Behind (need ${months}mo, have ${deadlineMonths})`, cls: 'bg-red-50 text-red-600' }
                  }
                  return (
                    <div key={goal.id} className="border border-gray-100 rounded-xl p-3.5 space-y-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{goal.title}</p>
                          <p className="text-xs text-gray-400">{fmt(goal.current_amount)} / {fmt(goal.target_amount)}</p>
                        </div>
                        <div className="text-right shrink-0">
                          {done ? <span className="text-xs text-emerald-500 font-medium">Reached!</span>
                          : months === null ? <span className="text-xs text-gray-300">Set allocation</span>
                          : months === 0 ? <span className="text-xs text-emerald-500">Already done!</span>
                          : <span className="text-sm font-bold text-black">{months}<span className="text-xs font-normal text-gray-400"> months</span></span>}
                        </div>
                      </div>
                      <div className="bg-gray-100 rounded-full h-1.5 overflow-hidden">
                        <div className="h-full bg-black rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                      {!done && (<>
                        <div className="flex items-center justify-between text-xs text-gray-400">
                          <span>Monthly allocation</span>
                          <span className="font-medium text-black">{fmt(alloc)}</span>
                        </div>
                        <input type="range" min={0} max={sliderMax || 1000000} step={10000} value={alloc}
                          onChange={e => setGoalAllocations(prev => ({ ...prev, [goal.id]: parseInt(e.target.value) }))}
                          disabled={sliderMax === 0}
                          className="w-full accent-black" />
                        {deadlineChip && <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${deadlineChip.cls}`}>{deadlineChip.label}</span>}
                      </>)}
                    </div>
                  )
                })}
              </div>
              <div className="bg-gray-50 rounded-xl px-3 py-2.5 flex justify-between items-center">
                <span className="text-xs text-gray-500">Total monthly allocations</span>
                <div className="text-right">
                  <span className={`text-sm font-bold ${goalAllocExceedsSurplus ? 'text-red-600' : 'text-black'}`}>{fmt(totalGoalAllocations)}</span>
                  <p className="text-[10px] text-gray-400">of {fmt(Math.max(simSurplus, 0))} surplus</p>
                </div>
              </div>
            </>)}
          </>)}

        </div>
      </div>
    </div>
  )
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function Dashboard() {
  const [expenses, setExpenses]               = useState<Expense[]>([])
  const [income, setIncome]                   = useState<Income[]>([])
  const [budgets, setBudgets]                 = useState<Budget[]>([])
  const [savingsGoals, setSavingsGoals]       = useState<SavingsGoal[]>([])
  const [goalHistories, setGoalHistories]     = useState<Record<string, GoalHistory[]>>({})
  const [recurring, setRecurring]             = useState<RecurringExpense[]>([])
  const [activeFilter, setActiveFilter]       = useState<Category | 'all'>('all')
  const [activeTab, setActiveTab]             = useState<'expenses' | 'income' | 'bills'>('expenses')
  const [selectedMonth, setSelectedMonth]     = useState(currentMonth())
  const [userEmail, setUserEmail]             = useState('')
  const [fullName, setFullName]               = useState('')
  const [showTotalBalance, setShowTotalBalance]     = useState(false)
  const [showMonthlyBalance, setShowMonthlyBalance] = useState(false)
  const [loading, setLoading]                 = useState(true)
  const [searchQuery, setSearchQuery]         = useState('')
  const [showSearch, setShowSearch]           = useState(false)
  const [showFilters, setShowFilters]         = useState(false)
  const [sortOrder, setSortOrder]             = useState<SortOrder>('date-desc')
  const [minAmount, setMinAmount]             = useState('')
  const [maxAmount, setMaxAmount]             = useState('')
  const [chartView, setChartView]             = useState<'monthly' | 'weekly'>('monthly')
  const [showAddExpense, setShowAddExpense]   = useState(false)
  const [editingExpense, setEditingExpense]   = useState<Expense | null>(null)
  const [deletingExpense, setDeletingExpense] = useState<Expense | null>(null)
  const [isDeleting, setIsDeleting]           = useState(false)
  const [showAddIncome, setShowAddIncome]     = useState(false)
  const [editingIncome, setEditingIncome]     = useState<Income | null>(null)
  const [showAddGoal, setShowAddGoal]         = useState(false)
  const [openGoal, setOpenGoal]               = useState<SavingsGoal | null>(null)
  const [showAddBill, setShowAddBill]         = useState(false)
  const [editingBill, setEditingBill]         = useState<RecurringExpense | null>(null)
  const [deletingBillId, setDeletingBillId]   = useState<string | null>(null)
  const [payingBillId, setPayingBillId]       = useState<string | null>(null)
  const [localPaidBills, setLocalPaidBills]   = useState<Record<string, string>>({})
  const [expensePools, setExpensePools]       = useState<ExpensePool[]>([])
  const [poolEntries, setPoolEntries]         = useState<ExpensePoolEntry[]>([])
  const [showAddPool, setShowAddPool]         = useState(false)
  const [loggingPool, setLoggingPool]         = useState<ExpensePool | null>(null)
  const [openPool, setOpenPool]               = useState<ExpensePool | null>(null)
  const [splitBills, setSplitBills]           = useState<SplitBill[]>([])
  const [billParticipants, setBillParticipants] = useState<SplitBillParticipant[]>([])
  const [showAddSplitBill, setShowAddSplitBill] = useState(false)
  const [openSplitBill, setOpenSplitBill]     = useState<SplitBill | null>(null)
  const [showSimulator, setShowSimulator]     = useState(false)
  const [menuOpen, setMenuOpen]               = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const router  = useRouter()

  useEffect(() => { init() }, [])
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const init = async () => {
    const { data: userData } = await supabase.auth.getUser()
    const user = userData.user
    if (!user) { router.push('/login'); return }
    setUserEmail(user.email ?? '')
    const rawName = user.user_metadata?.full_name ?? user.email?.split('@')[0] ?? ''
    setFullName(rawName.split(' ')[0])
    await Promise.all([fetchExpenses(user.id), fetchIncome(user.id), fetchBudgets(user.id), fetchGoals(user.id), fetchRecurring(user.id), fetchPools(user.id), fetchSplitBills(user.id)])
    setLoading(false)
  }

  const fetchExpenses  = async (uid: string) => { const { data } = await supabase.from('expenses').select('*').eq('user_id', uid).order('created_at', { ascending: false }); setExpenses(data || []) }
  const fetchIncome    = async (uid: string) => { const { data } = await supabase.from('income').select('*').eq('user_id', uid).order('created_at', { ascending: false }); setIncome(data || []) }
  const fetchBudgets   = async (uid: string) => { const { data } = await supabase.from('budgets').select('*').eq('user_id', uid).eq('month', currentMonth() + '-01'); setBudgets(data || []) }
  const fetchGoals     = async (uid: string) => {
    const { data } = await supabase.from('savings_goals').select('*').eq('user_id', uid).order('created_at', { ascending: true })
    setSavingsGoals(data || [])
    if (data && data.length > 0) {
      const ids = data.map((g: SavingsGoal) => g.id)
      const { data: hist } = await supabase.from('savings_goal_history').select('*').in('goal_id', ids).order('created_at', { ascending: false })
      const map: Record<string, GoalHistory[]> = {}
      ids.forEach((id: string) => { map[id] = [] })
      ;(hist || []).forEach((h: GoalHistory) => { if (map[h.goal_id]) map[h.goal_id].push(h) })
      setGoalHistories(map)
    }
  }
  const fetchRecurring = async (uid: string) => {
    const { data } = await supabase.from('recurring_expenses').select('*').eq('user_id', uid).order('next_due', { ascending: true })
    setRecurring(data || [])
    const thisMonth = currentMonth()
    const rehydrated: Record<string, string> = {}
    ;(data || []).forEach((r: RecurringExpense) => {
      if (r.last_paid_date && r.last_paid_date.slice(0, 7) === thisMonth) {
        rehydrated[r.id] = 'persisted'
      }
    })
    setLocalPaidBills(rehydrated)
  }
  const fetchPools = async (uid: string) => {
    const { data: pools } = await supabase.from('expense_pools').select('*').eq('user_id', uid).eq('is_archived', false).order('created_at', { ascending: true })
    setExpensePools(pools || [])
    if (pools && pools.length > 0) {
      const { data: entries } = await supabase.from('expense_pool_entries').select('*').eq('user_id', uid).order('created_at', { ascending: false })
      setPoolEntries(entries || [])
    }
  }
  const fetchSplitBills = async (uid: string) => {
    const { data: bills } = await supabase.from('split_bills').select('*').eq('user_id', uid).eq('is_archived', false).order('created_at', { ascending: false })
    setSplitBills(bills || [])
    if (bills && bills.length > 0) {
      const { data: parts } = await supabase.from('split_bill_participants').select('*').eq('user_id', uid).order('created_at', { ascending: true })
      setBillParticipants(parts || [])
    }
  }

  const handleLogout = async () => { await supabase.auth.signOut(); router.push('/login') }

  const handleAddExpense = async (data: { title: string; amount: number; category: Category; note: string }) => {
    const { data: ud } = await supabase.auth.getUser(); const user = ud.user; if (!user) return
    const { data: inserted, error } = await supabase.from('expenses').insert({ ...data, user_id: user.id, created_at: localISOString() }).select().single()
    if (!error && inserted) setExpenses(prev => [inserted, ...prev])
    setShowAddExpense(false)
  }
  const handleSaveEdit = async (updated: Partial<Expense>) => {
    if (!editingExpense) return
    const { error } = await supabase.from('expenses').update(updated).eq('id', editingExpense.id)
    if (!error) setExpenses(prev => prev.map(e => e.id === editingExpense.id ? { ...e, ...updated } : e))
    setEditingExpense(null)
  }
  const handleConfirmDelete = async () => {
    if (!deletingExpense) return
    setIsDeleting(true)
    const { error } = await supabase.from('expenses').delete().eq('id', deletingExpense.id)
    if (!error) setExpenses(prev => prev.filter(e => e.id !== deletingExpense.id))
    setIsDeleting(false); setDeletingExpense(null)
  }
  const handleAddIncome = async (data: { title: string; amount: number; category: IncomeCategory; note: string }) => {
    const { data: ud } = await supabase.auth.getUser(); const user = ud.user; if (!user) return
    const { data: inserted, error } = await supabase.from('income').insert({ ...data, user_id: user.id, created_at: localISOString() }).select().single()
    if (!error && inserted) setIncome(prev => [inserted, ...prev])
    setShowAddIncome(false)
  }
  const handleSaveEditIncome = async (updated: Partial<Income>) => {
    if (!editingIncome) return
    const { error } = await supabase.from('income').update(updated).eq('id', editingIncome.id)
    if (!error) setIncome(prev => prev.map(i => i.id === editingIncome.id ? { ...i, ...updated } : i))
    setEditingIncome(null)
  }
  const handleDeleteIncome = async (id: string) => {
    const { error } = await supabase.from('income').delete().eq('id', id)
    if (!error) setIncome(prev => prev.filter(i => i.id !== id))
  }
  const handleAddGoal = async (data: { title: string; target_amount: number; current_amount: number; deadline: string }) => {
    const { data: ud } = await supabase.auth.getUser(); const user = ud.user; if (!user) return
    const { data: inserted, error } = await supabase.from('savings_goals').insert({ ...data, user_id: user.id }).select().single()
    if (!error && inserted) { setSavingsGoals(prev => [...prev, inserted]); setGoalHistories(prev => ({ ...prev, [inserted.id]: [] })) }
    setShowAddGoal(false)
  }
  const handleAddFunds = async (goalId: string, amount: number, note: string) => {
    const { data: ud } = await supabase.auth.getUser(); const user = ud.user; if (!user) return
    const goal = savingsGoals.find(g => g.id === goalId); if (!goal) return
    const newCurrent = goal.current_amount + amount
    const { data: savingsExp, error: savingsError } = await supabase.from('expenses').insert({
      title: `Savings: ${goal.title}`, amount, category: 'savings',
      note: note || `Added to goal: ${goal.title}`, user_id: user.id, created_at: localISOString()
    }).select().single()
    const [{ error: e1 }, { data: histRow, error: e2 }] = await Promise.all([
      supabase.from('savings_goals').update({ current_amount: newCurrent }).eq('id', goalId),
      supabase.from('savings_goal_history').insert({ goal_id: goalId, user_id: user.id, amount, note, created_at: localISOString() }).select().single()
    ])
    if (!savingsError && savingsExp) setExpenses(prev => [savingsExp, ...prev])
    if (!e1) setSavingsGoals(prev => prev.map(g => g.id === goalId ? { ...g, current_amount: newCurrent } : g))
    if (!e2 && histRow) setGoalHistories(prev => ({ ...prev, [goalId]: [histRow, ...(prev[goalId] || [])] }))
    setOpenGoal(prev => prev?.id === goalId ? { ...prev, current_amount: newCurrent } : prev)
  }
  const handleDeleteGoalHistory = async (goalId: string, histId: string) => {
    const hist = goalHistories[goalId]?.find(h => h.id === histId); if (!hist) return
    const goal = savingsGoals.find(g => g.id === goalId); if (!goal) return
    const newCurrent = Math.max(0, goal.current_amount - hist.amount)
    const { data: ud } = await supabase.auth.getUser(); const user = ud.user
    if (user) {
      const { data: matchingExp } = await supabase.from('expenses')
        .select('*').eq('user_id', user.id).eq('category', 'savings').eq('amount', hist.amount)
        .like('title', `Savings: ${goal.title}%`).order('created_at', { ascending: false }).limit(1)
      if (matchingExp && matchingExp.length > 0) {
        await supabase.from('expenses').delete().eq('id', matchingExp[0].id)
        setExpenses(prev => prev.filter(e => e.id !== matchingExp[0].id))
      }
    }
    await Promise.all([supabase.from('savings_goal_history').delete().eq('id', histId), supabase.from('savings_goals').update({ current_amount: newCurrent }).eq('id', goalId)])
    setGoalHistories(prev => ({ ...prev, [goalId]: (prev[goalId] || []).filter(h => h.id !== histId) }))
    setSavingsGoals(prev => prev.map(g => g.id === goalId ? { ...g, current_amount: newCurrent } : g))
    setOpenGoal(prev => prev?.id === goalId ? { ...prev, current_amount: newCurrent } : prev)
  }
  const handleEditGoalHistory = async (goalId: string, histId: string, newAmount: number, note: string) => {
    const oldHist = goalHistories[goalId]?.find(h => h.id === histId); if (!oldHist) return
    const goal = savingsGoals.find(g => g.id === goalId); if (!goal) return
    const diff = newAmount - oldHist.amount; const newCurrent = Math.max(0, goal.current_amount + diff)
    await Promise.all([supabase.from('savings_goal_history').update({ amount: newAmount, note }).eq('id', histId), supabase.from('savings_goals').update({ current_amount: newCurrent }).eq('id', goalId)])
    setGoalHistories(prev => ({ ...prev, [goalId]: (prev[goalId] || []).map(h => h.id === histId ? { ...h, amount: newAmount, note } : h) }))
    setSavingsGoals(prev => prev.map(g => g.id === goalId ? { ...g, current_amount: newCurrent } : g))
    setOpenGoal(prev => prev?.id === goalId ? { ...prev, current_amount: newCurrent } : prev)
  }
  const handleEditGoal = async (goalId: string, updated: Partial<SavingsGoal>) => {
    const { error } = await supabase.from('savings_goals').update(updated).eq('id', goalId)
    if (!error) { setSavingsGoals(prev => prev.map(g => g.id === goalId ? { ...g, ...updated } : g)); setOpenGoal(prev => prev?.id === goalId ? { ...prev, ...updated } : prev) }
  }
  const handleDeleteGoal = async (goalId: string) => {
    await supabase.from('savings_goals').delete().eq('id', goalId)
    setSavingsGoals(prev => prev.filter(g => g.id !== goalId))
    setGoalHistories(prev => { const n = { ...prev }; delete n[goalId]; return n })
    setOpenGoal(null)
  }
  const handleAddBill = async (data: { title: string; amount: number; category: Category; frequency: Frequency; next_due: string; note: string }) => {
    const { data: ud } = await supabase.auth.getUser(); const user = ud.user; if (!user) return
    const { data: inserted, error } = await supabase.from('recurring_expenses').insert({ ...data, user_id: user.id }).select().single()
    if (!error && inserted) setRecurring(prev => [...prev, inserted].sort((a, b) => new Date(a.next_due).getTime() - new Date(b.next_due).getTime()))
    setShowAddBill(false)
  }
  const handleSaveEditBill = async (updated: Partial<RecurringExpense>) => {
    if (!editingBill) return
    const { error } = await supabase.from('recurring_expenses').update(updated).eq('id', editingBill.id)
    if (!error) setRecurring(prev => prev.map(r => r.id === editingBill.id ? { ...r, ...updated } : r))
    setEditingBill(null)
  }
  const handleDeleteBill = async (id: string) => {
    setDeletingBillId(id)
    const { error } = await supabase.from('recurring_expenses').delete().eq('id', id)
    if (!error) setRecurring(prev => prev.filter(r => r.id !== id))
    setDeletingBillId(null)
  }
  const handlePayBill = async (r: RecurringExpense) => {
    if (localPaidBills[r.id]) return
    setPayingBillId(r.id)
    const { data: ud } = await supabase.auth.getUser()
    const user = ud.user; if (!user) { setPayingBillId(null); return }
    const today  = new Date().toISOString().slice(0, 10)
    const newDue = nextDueDate(r.next_due, r.frequency)
    const [{ error: e1 }, { data: newExp, error: e2 }] = await Promise.all([
      supabase.from('recurring_expenses').update({ next_due: newDue, last_paid_date: today }).eq('id', r.id),
      supabase.from('expenses').insert({ title: r.title, amount: r.amount, category: r.category, note: `${FREQ_LABELS[r.frequency]} bill`, user_id: user.id, created_at: localISOString() }).select().single()
    ])
    if (!e1) setRecurring(prev => prev.map(rec => rec.id === r.id ? { ...rec, next_due: newDue, last_paid_date: today } : rec).sort((a, b) => new Date(a.next_due).getTime() - new Date(b.next_due).getTime()))
    if (!e2 && newExp) { setExpenses(prev => [newExp, ...prev]); setLocalPaidBills(prev => ({ ...prev, [r.id]: newExp.id })) }
    setPayingBillId(null)
  }
  const handleUndoPayBill = async (r: RecurringExpense) => {
    const expId = localPaidBills[r.id]
    if (!expId || expId === 'persisted') return
    const d = new Date(r.next_due)
    if (r.frequency === 'daily')   d.setDate(d.getDate() - 1)
    if (r.frequency === 'weekly')  d.setDate(d.getDate() - 7)
    if (r.frequency === 'monthly') d.setMonth(d.getMonth() - 1)
    const originalDue = d.toISOString().slice(0, 10)
    await Promise.all([
      supabase.from('recurring_expenses').update({ next_due: originalDue, last_paid_date: null }).eq('id', r.id),
      supabase.from('expenses').delete().eq('id', expId)
    ])
    setRecurring(prev => prev.map(rec => rec.id === r.id ? { ...rec, next_due: originalDue, last_paid_date: undefined } : rec).sort((a, b) => new Date(a.next_due).getTime() - new Date(b.next_due).getTime()))
    setExpenses(prev => prev.filter(e => e.id !== expId))
    setLocalPaidBills(prev => { const n = { ...prev }; delete n[r.id]; return n })
  }

  const handleAddPool = async (data: { title: string; budget_amount: number; category: Category; note: string }) => {
    const { data: ud } = await supabase.auth.getUser(); const user = ud.user; if (!user) return
    const { data: inserted, error } = await supabase.from('expense_pools').insert({ ...data, user_id: user.id, is_archived: false }).select().single()
    if (!error && inserted) setExpensePools(prev => [...prev, inserted])
    setShowAddPool(false)
  }
  const handleLogPoolEntry = async (pool: ExpensePool, amount: number, note: string) => {
    const { data: ud } = await supabase.auth.getUser(); const user = ud.user; if (!user) return
    const { data: newExp, error: e1 } = await supabase.from('expenses').insert({
      title: pool.title, amount, category: pool.category,
      note: note || `Pool: ${pool.title}`, user_id: user.id, created_at: localISOString()
    }).select().single()
    if (e1) return
    const { data: newEntry, error: e2 } = await supabase.from('expense_pool_entries').insert({
      pool_id: pool.id, user_id: user.id, amount, month: selectedMonth,
      note: note.trim(), expense_id: newExp.id, created_at: localISOString()
    }).select().single()
    if (!e2 && newEntry) setPoolEntries(prev => [newEntry, ...prev])
    if (newExp) setExpenses(prev => [newExp, ...prev])
    setLoggingPool(null)
  }
  const handleDeletePoolEntry = async (entry: ExpensePoolEntry) => {
    await supabase.from('expense_pool_entries').delete().eq('id', entry.id)
    if (entry.expense_id) {
      await supabase.from('expenses').delete().eq('id', entry.expense_id)
      setExpenses(prev => prev.filter(e => e.id !== entry.expense_id))
    }
    setPoolEntries(prev => prev.filter(e => e.id !== entry.id))
  }
  const handleEditPool = async (poolId: string, updated: Partial<Pick<ExpensePool, 'title' | 'budget_amount' | 'category' | 'note'>>) => {
    const { error } = await supabase.from('expense_pools').update(updated).eq('id', poolId)
    if (!error) {
      setExpensePools(prev => prev.map(p => p.id === poolId ? { ...p, ...updated } : p))
      setOpenPool(prev => prev?.id === poolId ? { ...prev, ...updated } : prev)
    }
  }
  const handleArchivePool = async (poolId: string) => {
    await supabase.from('expense_pools').update({ is_archived: true }).eq('id', poolId)
    setExpensePools(prev => prev.filter(p => p.id !== poolId))
    setOpenPool(prev => prev?.id === poolId ? null : prev)
  }

  // ── Split bills ────────────────────────────────────────────────────────────
  const handleAddSplitBill = async (
    data: { title: string; total_amount: number; category: Category; note: string },
    participants: { name: string; share_amount: number }[]
  ) => {
    const { data: ud } = await supabase.auth.getUser(); const user = ud.user; if (!user) return
    const { data: bill, error } = await supabase.from('split_bills')
      .insert({ ...data, user_id: user.id, is_archived: false }).select().single()
    if (error || !bill) return
    const rows = participants.map(p => ({ bill_id: bill.id, user_id: user.id, name: p.name, share_amount: p.share_amount, is_paid: false }))
    const { data: inserted } = await supabase.from('split_bill_participants').insert(rows).select()
    setSplitBills(prev => [bill, ...prev])
    if (inserted) setBillParticipants(prev => [...prev, ...inserted])
    setShowAddSplitBill(false)
  }
  const handleToggleParticipantPaid = async (p: SplitBillParticipant) => {
    const next = !p.is_paid
    const { error } = await supabase.from('split_bill_participants').update({ is_paid: next }).eq('id', p.id)
    if (!error) setBillParticipants(prev => prev.map(x => x.id === p.id ? { ...x, is_paid: next } : x))
  }
  const handleAddParticipant = async (billId: string, name: string, share: number) => {
    const { data: ud } = await supabase.auth.getUser(); const user = ud.user; if (!user) return
    const { data: inserted, error } = await supabase.from('split_bill_participants')
      .insert({ bill_id: billId, user_id: user.id, name, share_amount: share, is_paid: false }).select().single()
    if (!error && inserted) setBillParticipants(prev => [...prev, inserted])
  }
  const handleDeleteParticipant = async (p: SplitBillParticipant) => {
    await supabase.from('split_bill_participants').delete().eq('id', p.id)
    setBillParticipants(prev => prev.filter(x => x.id !== p.id))
  }
  const handleEditSplitBill = async (billId: string, updated: Partial<Pick<SplitBill, 'title' | 'total_amount' | 'category' | 'note'>>) => {
    const { error } = await supabase.from('split_bills').update(updated).eq('id', billId)
    if (!error) {
      setSplitBills(prev => prev.map(b => b.id === billId ? { ...b, ...updated } : b))
      setOpenSplitBill(prev => prev?.id === billId ? { ...prev, ...updated } : prev)
    }
  }
  const handleDeleteSplitBill = async (billId: string) => {
    await supabase.from('split_bills').update({ is_archived: true }).eq('id', billId)
    setSplitBills(prev => prev.filter(b => b.id !== billId))
    setOpenSplitBill(prev => prev?.id === billId ? null : prev)
  }

  // ── Derived ──────────────────────────────────────────────────────────────────
  const thisMonthExpenses = useMemo(() => expenses.filter(e => inMonth(e.created_at, selectedMonth)), [expenses, selectedMonth])
  const poolsThisMonth = useMemo<ExpensePoolWithStats[]>(() =>
    expensePools.map(pool => {
      const entries = poolEntries.filter(e => e.pool_id === pool.id && e.month === selectedMonth)
      const spent   = entries.reduce((s, e) => s + e.amount, 0)
      const remaining = pool.budget_amount - spent
      return { pool, entries, spent, remaining, pct: Math.min(pool.budget_amount > 0 ? (spent / pool.budget_amount) * 100 : 0, 100) }
    }), [expensePools, poolEntries, selectedMonth])
  const billsWithStats = useMemo<SplitBillWithStats[]>(() =>
    splitBills.map(bill => {
      const participants = billParticipants.filter(p => p.bill_id === bill.id)
      const owed      = participants.filter(p => !p.is_paid).reduce((s, p) => s + p.share_amount, 0)
      const collected = participants.filter(p => p.is_paid).reduce((s, p) => s + p.share_amount, 0)
      const paidCount = participants.filter(p => p.is_paid).length
      const settled   = participants.length > 0 && paidCount === participants.length
      return { bill, participants, owed, collected, paidCount, settled }
    }), [splitBills, billParticipants])
  const lastMonthExpenses = useMemo(() => {
    const now = new Date(selectedMonth + '-02'); now.setMonth(now.getMonth() - 1)
    const key = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    return expenses.filter(e => inMonth(e.created_at, key))
  }, [expenses, selectedMonth])
  const thisMonthIncome    = useMemo(() => income.filter(i => inMonth(i.created_at, selectedMonth)), [income, selectedMonth])
  const thisMonthTotal     = useMemo(() => thisMonthExpenses.reduce((s, e) => s + e.amount, 0), [thisMonthExpenses])
  const lastMonthTotal     = useMemo(() => lastMonthExpenses.reduce((s, e) => s + e.amount, 0), [lastMonthExpenses])
  const thisMonthIncomeTot = useMemo(() => thisMonthIncome.reduce((s, i) => s + i.amount, 0), [thisMonthIncome])
  const netSavings         = thisMonthIncomeTot - thisMonthTotal

  const allTimeIncome   = useMemo(() => income.reduce((s, i) => s + i.amount, 0), [income])
  const allTimeExpenses = useMemo(() => expenses.reduce((s, e) => s + e.amount, 0), [expenses])
  const cumulativeBalance = allTimeIncome - allTimeExpenses

  const avgPerDay = useMemo(() => {
    const now = new Date()
    const [yr, mo] = selectedMonth.split('-').map(Number)
    const isCurrentMonth = yr === now.getFullYear() && mo === now.getMonth() + 1
    const daysElapsed = isCurrentMonth ? now.getDate() : new Date(yr, mo, 0).getDate()
    return thisMonthTotal / daysElapsed
  }, [thisMonthTotal, selectedMonth])

  const monthOverMonthPct  = lastMonthTotal === 0 ? 0 : ((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100
  const spendingRate = thisMonthIncomeTot > 0 ? Math.min((thisMonthTotal / thisMonthIncomeTot) * 100, 999) : 0

  const last6Months = useMemo(() => {
    const result = []; const now = new Date(); const yr = now.getFullYear(); const mo = now.getMonth()
    for (let i = 5; i >= 0; i--) {
      let m = mo - i; let y = yr
      if (m < 0) { m += 12; y -= 1 }
      const key = `${y}-${String(m + 1).padStart(2, '0')}`
      const total = expenses.filter(e => inMonth(e.created_at, key)).reduce((s, e) => s + e.amount, 0)
      result.push({ key, label: MONTHS_SHORT[m], total })
    }
    return result
  }, [expenses])

  const weeklyData = useMemo(() => {
    const weeks: { label: string; total: number }[] = []
    const [yr, mo] = selectedMonth.split('-').map(Number)
    const daysInMonth = new Date(yr, mo, 0).getDate()
    const weekCount = Math.ceil(daysInMonth / 7)
    for (let w = 0; w < weekCount; w++) {
      const startDay = w * 7 + 1
      const endDay   = Math.min(startDay + 6, daysInMonth)
      const total = thisMonthExpenses.filter(e => {
        const d = new Date(e.created_at).getDate()
        return d >= startDay && d <= endDay
      }).reduce((s, e) => s + e.amount, 0)
      weeks.push({ label: `W${w + 1}`, total })
    }
    return weeks
  }, [thisMonthExpenses, selectedMonth])

  const maxMonthly = Math.max(...last6Months.map(m => m.total), 1)
  const maxWeekly  = Math.max(...weeklyData.map(w => w.total), 1)

  const categoryTotals = useMemo(() => {
    const totals: Partial<Record<Category, number>> = {}
    thisMonthExpenses.forEach(e => { totals[e.category] = (totals[e.category] || 0) + e.amount })
    return totals
  }, [thisMonthExpenses])
  const budgetSpend = useMemo(() => {
    const map: Partial<Record<Category, number>> = {}
    thisMonthExpenses.forEach(e => { map[e.category] = (map[e.category] || 0) + e.amount })
    return map
  }, [thisMonthExpenses])

  const filteredExpenses = useMemo(() => {
    let list = activeFilter === 'all' ? thisMonthExpenses : thisMonthExpenses.filter(e => e.category === activeFilter)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      list = list.filter(e => e.title.toLowerCase().includes(q) || e.note?.toLowerCase().includes(q))
    }
    if (minAmount) list = list.filter(e => e.amount >= parseFloat(minAmount))
    if (maxAmount) list = list.filter(e => e.amount <= parseFloat(maxAmount))
    switch (sortOrder) {
      case 'date-asc':    return [...list].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      case 'amount-desc': return [...list].sort((a, b) => b.amount - a.amount)
      case 'amount-asc':  return [...list].sort((a, b) => a.amount - b.amount)
      default:            return list
    }
  }, [thisMonthExpenses, activeFilter, searchQuery, minAmount, maxAmount, sortOrder])

  const filteredIncome = useMemo(() => {
    if (!searchQuery.trim()) return thisMonthIncome
    const q = searchQuery.toLowerCase()
    return thisMonthIncome.filter(i => i.title.toLowerCase().includes(q) || i.note?.toLowerCase().includes(q))
  }, [thisMonthIncome, searchQuery])

  const activeFilterCount = [minAmount, maxAmount, sortOrder !== 'date-desc'].filter(Boolean).length
  const billsDueSoon = useMemo(() => recurring.filter(r => Math.ceil((new Date(r.next_due).getTime() - Date.now()) / 86_400_000) <= 7).length, [recurring])

  const monthIndex = last6Months.findIndex(m => m.key === selectedMonth)
  const canGoPrev  = monthIndex > 0
  const canGoNext  = monthIndex < last6Months.length - 1

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-gray-200 border-t-black rounded-full animate-spin" />
          <p className="text-sm text-gray-400">Loading your finances...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <style>{`
        @keyframes slideUp { from { transform: translateY(14px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        .animate-slide-up { animation: slideUp 0.2s ease both; }
        .stat-card { animation: slideUp 0.3s ease both; }
        .stat-card:nth-child(1){animation-delay:0.03s} .stat-card:nth-child(2){animation-delay:0.07s}
        .stat-card:nth-child(3){animation-delay:0.11s} .stat-card:nth-child(4){animation-delay:0.15s}
        .row-item { animation: slideUp 0.22s ease both; }
      `}</style>

      <div className="min-h-screen bg-white">
        <div className="max-w-2xl mx-auto px-4 sm:px-5 py-5 sm:py-7">

          {/* ── Header ── */}
          <div className="flex justify-between items-center mb-5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0"><img src="/logo.png" alt="logo" className="w-full h-full object-cover" /></div>
              <div>
                <h1 className="text-base font-medium text-black leading-none tracking-tight">ExpenseFlow</h1>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-2">
              <button onClick={() => setShowSearch(v => !v)}
                className={`p-1.5 border rounded-lg transition-all ${showSearch ? 'bg-black border-black text-white' : 'border-gray-200 text-gray-600 hover:border-black hover:bg-gray-50'}`}>
                <Search size={14} />
              </button>
              <button onClick={() => setShowSimulator(true)}
                className="flex items-center gap-1.5 border border-gray-200 hover:border-black hover:bg-gray-50 text-gray-600 hover:text-black px-3 py-1.5 rounded-lg text-sm font-medium transition-all active:scale-[.98]">
                <Calculator size={14} /> Simulate
              </button>
              <button onClick={() => setShowAddIncome(true)}
                className="flex items-center gap-1.5 border border-gray-200 hover:border-black hover:bg-gray-50 text-gray-600 hover:text-black px-3 py-1.5 rounded-lg text-sm font-medium transition-all active:scale-[.98]">
                <ArrowUpCircle size={14} /> Income
              </button>
              <button onClick={() => setShowAddExpense(true)}
                className="flex items-center gap-1.5 bg-black hover:bg-gray-800 active:scale-[.98] text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-all">
                <ArrowDownCircle size={14} /> Expenses
              </button>
              <button onClick={handleLogout}
                className="flex items-center border border-gray-200 hover:border-black hover:bg-gray-50 active:scale-[.98] text-gray-600 hover:text-black p-1.5 rounded-lg transition-all">
                <LogOut size={15} />
              </button>
            </div>
            <div className="flex sm:hidden items-center gap-1.5" ref={menuRef}>
              <button onClick={() => setShowSearch(v => !v)}
                className={`p-1.5 rounded-lg border transition-all ${showSearch ? 'bg-black border-black text-white' : 'border-gray-200 text-gray-600'}`}>
                <Search size={15} />
              </button>
              <div className="relative">
                <button onClick={() => setMenuOpen(v => !v)}
                  className={`p-1.5 border rounded-lg transition-all ${menuOpen ? 'bg-black border-black text-white' : 'border-gray-200 text-gray-600'}`}>
                  <Menu size={15} />
                </button>
                {menuOpen && (
                  <div className="absolute right-0 top-full mt-1.5 w-44 bg-white border border-gray-100 rounded-xl shadow-lg z-[200] py-1.5 animate-slide-up">
                    <button onClick={() => { exportCSV(expenses, income, selectedMonth); setMenuOpen(false) }} className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-gray-700 hover:bg-gray-50"><Download size={14} className="text-gray-500" /> Export CSV</button>
                    <button onClick={() => { setShowAddIncome(true); setMenuOpen(false) }} className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-gray-700 hover:bg-gray-50"><ArrowUpCircle size={14} className="text-green-600" /> Add Income</button>
                    <button onClick={() => { setShowAddExpense(true); setMenuOpen(false) }} className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-gray-700 hover:bg-gray-50"><ArrowDownCircle size={14} /> Add Expense</button>
                    <button onClick={() => { setShowAddBill(true); setMenuOpen(false) }} className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-gray-700 hover:bg-gray-50"><CreditCard size={14} className="text-blue-500" /> Add Bill</button>
                    <button onClick={() => { setShowSimulator(true); setMenuOpen(false) }} className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-gray-700 hover:bg-gray-50"><Calculator size={14} className="text-purple-500" /> Budget Simulator</button>
                    <div className="h-px bg-gray-100 my-1" />
                    <button onClick={() => { handleLogout(); setMenuOpen(false) }} className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-red-500 hover:bg-red-50"><LogOut size={14} /> Logout</button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Search */}
          {showSearch && (
            <div className="relative mb-4 animate-slide-up">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input autoFocus value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search expenses, income, notes..."
                className="w-full border border-gray-200 rounded-lg pl-9 pr-9 py-2.5 text-sm text-black focus:outline-none focus:border-black transition" />
              {searchQuery && <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black"><X size={14} /></button>}
            </div>
          )}

          {/* ── Welcome + Balance Card ── */}
          <div className="mb-4">
            {fullName && (
              <p className="text-xl font-semibold text-black mb-3 tracking-tight">
                Welcome back, <span className="text-gray-400 font-normal">{fullName}</span> 
              </p>
            )}

            {/* Month picker — dropdown on left, arrow buttons grouped on right */}
            <div className="flex items-center gap-2 mb-2.5">
              <MonthPickerDropdown months={last6Months} selected={selectedMonth} onChange={setSelectedMonth} />
              <div className="flex items-center gap-1 ml-auto">
                <button
                  onClick={() => canGoPrev && setSelectedMonth(last6Months[monthIndex - 1].key)}
                  disabled={!canGoPrev}
                  className="w-7 h-7 flex items-center justify-center rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-black transition-all disabled:opacity-25 disabled:cursor-not-allowed"
                >
                  <ChevronLeft size={13} />
                </button>
                <button
                  onClick={() => canGoNext && setSelectedMonth(last6Months[monthIndex + 1].key)}
                  disabled={!canGoNext}
                  className="w-7 h-7 flex items-center justify-center rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-black transition-all disabled:opacity-25 disabled:cursor-not-allowed"
                >
                  <ChevronRight size={13} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5 mb-2.5">
              {/* Total balance card */}
              <div className="bg-black rounded-xl px-4 py-3.5">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[11px] text-white/60 font-medium uppercase tracking-wide">Total balance</p>
                  <button
                    onClick={() => setShowTotalBalance(v => !v)}
                    className="text-white/50 hover:text-white transition-colors"
                    title={showTotalBalance ? 'Hide' : 'Show'}
                  >
                    {showTotalBalance ? <EyeOff size={13} /> : <Eye size={13} />}
                  </button>
                </div>
                <p className={`text-lg font-bold leading-none tracking-tight ${cumulativeBalance >= 0 ? 'text-white' : 'text-red-400'}`}>
                  {showTotalBalance
                    ? fmtFull(Math.abs(cumulativeBalance))
                    : <span className="tracking-widest text-white/30 select-none text-base">••••••</span>
                  }
                </p>
                {showTotalBalance && cumulativeBalance < 0 && (
                  <p className="text-[10px] text-red-400 mt-1">deficit</p>
                )}
                {showTotalBalance && cumulativeBalance >= 0 && (
                  <p className="text-[10px] text-white/40 mt-1">All time</p>
                )}
              </div>

              {/* Monthly balance card */}
              <div className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-3.5">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wide">This month</p>
                  <button
                    onClick={() => setShowMonthlyBalance(v => !v)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                    title={showMonthlyBalance ? 'Hide' : 'Show'}
                  >
                    {showMonthlyBalance ? <EyeOff size={13} /> : <Eye size={13} />}
                  </button>
                </div>
                <p className={`text-lg font-bold leading-none tracking-tight ${netSavings >= 0 ? 'text-black' : 'text-red-600'}`}>
                  {showMonthlyBalance
                    ? fmtFull(Math.abs(netSavings))
                    : <span className="tracking-widest text-gray-300 select-none text-base">••••••</span>
                  }
                </p>
                {showMonthlyBalance && netSavings < 0 && (
                  <p className="text-[10px] text-red-500 mt-1">deficit</p>
                )}
                {showMonthlyBalance && netSavings >= 0 && (
                  <p className="text-[10px] text-gray-400 mt-1">Remaining</p>
                )}
              </div>
            </div>
          </div>
          {/* ── END BALANCE SECTION ── */}

          {/* ── Stat Cards ── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-5">
            {[
              {
                label: 'Income',
                value: fmtShort(thisMonthIncomeTot),
                sub: `${thisMonthIncome.length} entr${thisMonthIncome.length === 1 ? 'y' : 'ies'}`,
                color: 'text-green-700',
                icon: <ArrowUpCircle size={11} />
              },
              {
                label: 'Expenses',
                value: fmtShort(thisMonthTotal),
                sub: lastMonthTotal > 0 ? `${monthOverMonthPct > 0 ? '↑' : '↓'} ${Math.abs(monthOverMonthPct).toFixed(0)}% vs last month` : 'No prior data',
                color: monthOverMonthPct > 0 ? 'text-red-600' : 'text-green-700',
                icon: <ArrowDownCircle size={11} />
              },
              {
                label: 'Spending rate',
                value: thisMonthIncomeTot > 0 ? `${spendingRate.toFixed(0)}%` : '—',
                sub: thisMonthIncomeTot > 0
                  ? spendingRate >= 100 ? 'Over budget!' : spendingRate >= 80 ? 'Getting close' : 'Of income used'
                  : 'Add income first',
                color: spendingRate >= 100 ? 'text-red-600' : spendingRate >= 80 ? 'text-amber-600' : 'text-green-700',
                icon: spendingRate >= 100 ? <AlertTriangle size={11} /> : <TrendingUp size={11} />
              },
              {
                label: 'Avg / day',
                value: fmtShort(avgPerDay),
                sub: 'This month',
                color: 'text-gray-400',
                icon: null
              },
            ].map((s, i) => (
              <div key={i} className="stat-card bg-gray-50 rounded-xl p-3 sm:p-3.5">
                <p className="text-xs text-gray-400 mb-1">{s.label}</p>
                <p className="text-base sm:text-lg font-medium text-black">{s.value}</p>
                <p className={`text-xs mt-1 flex items-center gap-1 ${s.color}`}>{s.icon}<span className="truncate">{s.sub}</span></p>
              </div>
            ))}
          </div>

          {/* ── Charts ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            <div className="border border-gray-100 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                  {chartView === 'monthly' ? 'Last 6 months' : 'Weekly breakdown'}
                </p>
                <div className="flex rounded-lg overflow-hidden border border-gray-200">
                  <button onClick={() => setChartView('monthly')}
                    className={`px-2.5 py-1 text-xs font-medium transition-all ${chartView === 'monthly' ? 'bg-black text-white' : 'text-gray-400 hover:text-black bg-white'}`}>
                    Monthly
                  </button>
                  <button onClick={() => setChartView('weekly')}
                    className={`px-2.5 py-1 text-xs font-medium transition-all border-l border-gray-200 ${chartView === 'weekly' ? 'bg-black text-white' : 'text-gray-400 hover:text-black bg-white'}`}>
                    Weekly
                  </button>
                </div>
              </div>
              {chartView === 'monthly' ? (
                <div className="flex flex-col gap-2">
                  {last6Months.map(m => (
                    <div key={m.key} className="flex items-center gap-2">
                      <span className="text-xs text-gray-400 w-6 shrink-0">{m.label}</span>
                      <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-700 ${m.key === selectedMonth ? 'bg-black' : 'bg-gray-400'}`}
                          style={{ width: m.total ? `${(m.total / maxMonthly) * 100}%` : '0%' }} />
                      </div>
                      <span className="text-xs text-gray-400 w-14 text-right shrink-0">{m.total ? fmtShort(m.total) : '—'}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {weeklyData.map((w, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="text-xs text-gray-400 w-6 shrink-0">{w.label}</span>
                      <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                        <div className="h-full rounded-full bg-black transition-all duration-700"
                          style={{ width: w.total ? `${(w.total / maxWeekly) * 100}%` : '0%' }} />
                      </div>
                      <span className="text-xs text-gray-400 w-14 text-right shrink-0">{w.total ? fmtShort(w.total) : '—'}</span>
                    </div>
                  ))}
                  {weeklyData.every(w => w.total === 0) && (
                    <p className="text-xs text-gray-300 text-center mt-4">No expenses this month</p>
                  )}
                </div>
              )}
            </div>

            <div className="border border-gray-100 rounded-xl p-4">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">By category</p>
              {thisMonthTotal === 0 ? <p className="text-xs text-gray-300 text-center mt-6">No data this month</p> : (
                <div className="flex flex-col gap-2">
                  {(Object.keys(CATEGORY_CONFIG) as Category[]).map(cat => {
                    const spent = categoryTotals[cat] || 0
                    const pct   = thisMonthTotal > 0 ? (spent / thisMonthTotal) * 100 : 0
                    if (spent === 0) return null
                    return (
                      <div key={cat} className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 w-16 shrink-0 truncate">{CATEGORY_CONFIG[cat].label.split(' ')[0]}</span>
                        <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                          <div className="h-full bg-black rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs text-gray-400 w-7 text-right shrink-0">{pct.toFixed(0)}%</span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Smart Insights */}
          <CollapsibleSection title="Smart insights" icon={<Lightbulb size={13} />} defaultOpen={true}>
            <SmartInsightsContent thisMonthTotal={thisMonthTotal} lastMonthTotal={lastMonthTotal} avgPerDay={avgPerDay}
              categoryTotals={categoryTotals} thisMonthIncomeTot={thisMonthIncomeTot} netSavings={netSavings} budgets={budgets} budgetSpend={budgetSpend} />
          </CollapsibleSection>

          {/* Budget Tracker */}
          {budgets.length > 0 && (
            <div className="border border-gray-100 rounded-xl p-4 mb-4">
              <div className="flex items-center gap-2 mb-3">
                <Target size={13} className="text-gray-400" />
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Budget tracker</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                {budgets.map(b => {
                  const spent = budgetSpend[b.category] || 0
                  const pct   = Math.min((spent / b.limit_amount) * 100, 100)
                  const over  = spent > b.limit_amount
                  const warn  = !over && pct >= 80
                  return (
                    <div key={b.id}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="flex items-center gap-1 text-xs text-gray-500">
                          {CATEGORY_CONFIG[b.category].label}
                          {over && <AlertTriangle size={11} className="text-red-500" />}
                          {warn && <AlertTriangle size={11} className="text-amber-500" />}
                        </span>
                        <span className={`text-xs font-medium ${over ? 'text-red-600' : warn ? 'text-amber-600' : 'text-gray-500'}`}>
                          {fmtShort(spent)} / {fmtShort(b.limit_amount)}
                        </span>
                      </div>
                      <div className="bg-gray-100 rounded-full h-1.5 overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-700 ${over ? 'bg-red-500' : warn ? 'bg-amber-500' : 'bg-black'}`} style={{ width: `${pct}%` }} />
                      </div>
                      {over && <p className="text-xs text-red-500 mt-0.5">Over by {fmtShort(spent - b.limit_amount)}</p>}
                      {warn && <p className="text-xs text-amber-500 mt-0.5">{pct.toFixed(0)}% used — approaching limit</p>}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* ── Expense Pools ── */}
          <CollapsibleSection
            title="Expense pools" icon={<Wallet size={13} />}
            defaultOpen={expensePools.length > 0}
            badge={expensePools.length} badgeColor="bg-red-500"
            headerRight={
              <button onClick={e => { e.stopPropagation(); setShowAddPool(true) }}
                className="flex items-center gap-1 text-xs text-gray-400 hover:text-black transition-colors">
                <Plus size={12} /> Add
              </button>
            }
          >
            {expensePools.length === 0 ? (
              <div className="text-center py-6">
                <Wallet size={28} className="mx-auto mb-2 text-gray-200" />
                <p className="text-xs text-gray-400 font-medium mb-0.5">No expense pools yet</p>
                <p className="text-xs text-gray-300 mb-3">Set a monthly budget and log daily usage</p>
                <button onClick={() => setShowAddPool(true)}
                  className="inline-flex items-center gap-1.5 bg-black text-white text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-gray-800 transition-all">
                  <Plus size={12} /> Create first pool
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {poolsThisMonth.map(({ pool, spent, remaining, pct }) => {
                  const over = spent > pool.budget_amount
                  const warn = !over && pct >= 80
                  const cfg  = CATEGORY_CONFIG[pool.category]
                  return (
                    <div key={pool.id} onClick={() => setOpenPool(pool)}
                      className="border border-gray-100 rounded-xl p-3.5 hover:border-gray-300 hover:bg-gray-50/50 transition-all cursor-pointer group">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className={`w-6 h-6 ${cfg.bg} rounded-lg flex items-center justify-center shrink-0`}>
                            <span className={cfg.text}>{cfg.icon}</span>
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{pool.title}</p>
                            <p className="text-xs text-gray-400">{fmtShort(pool.budget_amount)} / month</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={e => { e.stopPropagation(); setLoggingPool(pool) }}
                            className="flex items-center gap-1 px-2 py-1 rounded-lg border border-gray-200 text-xs text-gray-600 hover:border-black hover:text-black transition-all">
                            <Plus size={11} /> Log
                          </button>
                          <RowMenu items={[
                            { label: 'Details', icon: <History size={13} />, onClick: () => setOpenPool(pool) },
                            { label: 'Archive', icon: <Trash2 size={13} />, onClick: () => handleArchivePool(pool.id), danger: true },
                          ]} />
                        </div>
                      </div>
                      <div className="bg-gray-100 rounded-full h-1.5 overflow-hidden mb-1.5">
                        <div className={`h-full rounded-full transition-all duration-700 ${over ? 'bg-red-500' : warn ? 'bg-amber-500' : 'bg-black'}`} style={{ width: `${pct}%` }} />
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500">{fmtShort(spent)} used</span>
                        {over
                          ? <span className="text-red-500 font-medium">Over by {fmtShort(spent - pool.budget_amount)}</span>
                          : warn
                          ? <span className="text-amber-500">{fmtShort(remaining)} left · {pct.toFixed(0)}% used</span>
                          : <span className="text-gray-400">{fmtShort(remaining)} remaining</span>
                        }
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CollapsibleSection>

          {/* ── Split Bills ── */}
          <CollapsibleSection
            title="Split bills" icon={<Users size={13} />}
            defaultOpen={splitBills.length > 0}
            badge={splitBills.length} badgeColor="bg-red-500"
            headerRight={
              <button onClick={e => { e.stopPropagation(); setShowAddSplitBill(true) }}
                className="flex items-center gap-1 text-xs text-gray-400 hover:text-black transition-colors">
                <Plus size={12} /> Add
              </button>
            }
          >
            {splitBills.length === 0 ? (
              <div className="text-center py-6">
                <Users size={28} className="mx-auto mb-2 text-gray-200" />
                <p className="text-xs text-gray-400 font-medium mb-0.5">No split bills yet</p>
                <p className="text-xs text-gray-300 mb-3">Split a bill and track who owes you</p>
                <button onClick={() => setShowAddSplitBill(true)}
                  className="inline-flex items-center gap-1.5 bg-black text-white text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-gray-800 transition-all">
                  <Plus size={12} /> Create first split
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {billsWithStats.map(({ bill, participants, owed, collected, paidCount, settled }) => {
                  const cfg = CATEGORY_CONFIG[bill.category]
                  const pct = bill.total_amount > 0 ? Math.min((collected / bill.total_amount) * 100, 100) : 0
                  return (
                    <div key={bill.id} onClick={() => setOpenSplitBill(bill)}
                      className="border border-gray-100 rounded-xl p-3.5 hover:border-gray-300 hover:bg-gray-50/50 transition-all cursor-pointer group">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className={`w-6 h-6 ${cfg.bg} rounded-lg flex items-center justify-center shrink-0`}>
                            <span className={cfg.text}>{cfg.icon}</span>
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{bill.title}</p>
                            <p className="text-xs text-gray-400">{fmt(bill.total_amount)} · {participants.length} {participants.length === 1 ? 'person' : 'people'}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {settled
                            ? <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-medium">Settled</span>
                            : <span className="text-[10px] text-gray-400">{paidCount}/{participants.length} paid</span>}
                          <RowMenu items={[
                            { label: 'Details', icon: <Users size={13} />, onClick: () => setOpenSplitBill(bill) },
                            { label: 'Delete', icon: <Trash2 size={13} />, onClick: () => handleDeleteSplitBill(bill.id), danger: true },
                          ]} />
                        </div>
                      </div>
                      <div className="bg-gray-100 rounded-full h-1.5 overflow-hidden mb-1.5">
                        <div className={`h-full rounded-full transition-all duration-700 ${settled ? 'bg-emerald-500' : 'bg-black'}`} style={{ width: `${pct}%` }} />
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500">{fmt(collected)} collected</span>
                        {settled
                          ? <span className="text-emerald-500 font-medium">All settled up</span>
                          : <span className="text-gray-400">{fmt(owed)} owed to you</span>}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CollapsibleSection>

          {/* ── Savings Goals ── */}
          <CollapsibleSection
            title="Savings goals" icon={<Flag size={13} />} defaultOpen={false}
            badge={savingsGoals.length} badgeColor="bg-red-500"
            headerRight={
              <button onClick={e => { e.stopPropagation(); setShowAddGoal(true) }}
                className="flex items-center gap-1 text-xs text-gray-400 hover:text-black transition-colors">
                <Plus size={12} /> Add
              </button>
            }
          >
            {savingsGoals.length === 0 ? (
              <div className="text-center py-6">
                <PiggyBank size={28} className="mx-auto mb-2 text-gray-200" />
                <p className="text-xs text-gray-400 font-medium mb-0.5">No savings goals yet</p>
                <p className="text-xs text-gray-300 mb-3">Set a target and track your progress</p>
                <button onClick={() => setShowAddGoal(true)}
                  className="inline-flex items-center gap-1.5 bg-black text-white text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-gray-800 transition-all">
                  <Plus size={12} /> Create first goal
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {savingsGoals.map(goal => {
                  const pct       = Math.min((goal.current_amount / goal.target_amount) * 100, 100)
                  const done      = goal.current_amount >= goal.target_amount
                  const remaining = goal.target_amount - goal.current_amount
                  let daysLeft: number | null = null
                  if (goal.deadline) daysLeft = Math.ceil((new Date(goal.deadline).getTime() - Date.now()) / 86_400_000)
                  const fillClass = done
                    ? 'bg-gradient-to-r from-emerald-400 to-green-500'
                    : pct >= 75 ? 'bg-gradient-to-r from-blue-500 to-indigo-500'
                    : pct >= 40 ? 'bg-gradient-to-r from-amber-400 to-orange-400'
                    : 'bg-gradient-to-r from-rose-300 to-pink-400'
                  const dotColor = done ? 'bg-emerald-500' : pct >= 75 ? 'bg-blue-500' : pct >= 40 ? 'bg-amber-400' : 'bg-rose-300'
                  return (
                    <div key={goal.id} onClick={() => setOpenGoal(goal)}
                      className="border border-gray-100 rounded-xl p-3.5 hover:border-gray-300 hover:bg-gray-50/50 transition-all cursor-pointer group">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className={`w-2 h-2 rounded-full shrink-0 ${dotColor}`} />
                          <p className="text-sm font-medium text-gray-900 truncate">{goal.title}</p>
                          {done && <span className="text-xs text-emerald-500 shrink-0">✓ Done</span>}
                        </div>
                        <span className={`text-xs font-semibold shrink-0 ${done ? 'text-emerald-600' : pct >= 75 ? 'text-blue-600' : pct >= 40 ? 'text-amber-600' : 'text-rose-400'}`}>{pct.toFixed(0)}%</span>
                      </div>
                      <div className="bg-gray-100 rounded-full h-2 overflow-hidden mb-2">
                        <div className={`h-full rounded-full transition-all duration-700 ${fillClass}`} style={{ width: `${pct}%` }} />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <span className="font-medium text-gray-800">{fmtShort(goal.current_amount)}</span>
                          <span className="text-gray-300">/</span>
                          <span>{fmtShort(goal.target_amount)}</span>
                          {!done && <span className="text-gray-300 ml-1">· {fmtShort(remaining)} left</span>}
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          {daysLeft !== null && !done && (
                            <span className={`${daysLeft <= 7 ? 'text-red-500' : 'text-gray-400'}`}>
                              {daysLeft > 0 ? `${daysLeft}d` : 'Overdue'}
                            </span>
                          )}
                          {done && <span className="text-emerald-500">Goal reached! 🎉</span>}
                          <span className="text-gray-300 hidden group-hover:inline text-[10px]">Tap to manage →</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CollapsibleSection>

          {/* Transactions Tabs */}
          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
                <button onClick={() => setActiveTab('expenses')}
                  className={`px-2.5 sm:px-3 py-1 rounded-md text-xs font-medium transition-all whitespace-nowrap ${activeTab === 'expenses' ? 'bg-white text-black shadow-sm' : 'text-gray-400 hover:text-black'}`}>
                  <span className="flex items-center gap-1.5"><Receipt size={11} /> Expenses</span>
                </button>
                <button onClick={() => setActiveTab('income')}
                  className={`px-2.5 sm:px-3 py-1 rounded-md text-xs font-medium transition-all whitespace-nowrap ${activeTab === 'income' ? 'bg-white text-black shadow-sm' : 'text-gray-400 hover:text-black'}`}>
                  <span className="flex items-center gap-1.5"><ArrowUpCircle size={11} /> Income</span>
                </button>
                <button onClick={() => setActiveTab('bills')}
                  className={`px-2.5 sm:px-3 py-1 rounded-md text-xs font-medium transition-all whitespace-nowrap ${activeTab === 'bills' ? 'bg-white text-black shadow-sm' : 'text-gray-400 hover:text-black'}`}>
                  <span className="flex items-center gap-1.5">
                    <CreditCard size={11} /> Bills
                    {billsDueSoon > 0 && <span className="bg-red-500 text-white rounded-full text-[9px] w-3.5 h-3.5 flex items-center justify-center">{billsDueSoon}</span>}
                  </span>
                </button>
              </div>
              {activeTab === 'bills' && (
                <button onClick={() => setShowAddBill(true)}
                  className="flex items-center gap-1 text-xs text-gray-400 hover:text-black border border-gray-200 hover:border-black px-2.5 py-1.5 rounded-lg transition-all whitespace-nowrap">
                  <Plus size={12} /> Add bill
                </button>
              )}
            </div>

            {activeTab === 'expenses' && (
              <>
                <div className="flex gap-2 mb-2" style={{ alignItems: 'center' }}>
                  <div className="flex gap-1.5 overflow-x-auto pb-0.5 flex-1 min-w-0 no-scrollbar">
                    {(['all', ...Object.keys(CATEGORY_CONFIG)] as (Category | 'all')[]).map(f => {
                      const isAll = f === 'all'; const active = activeFilter === f; const cfg = isAll ? null : CATEGORY_CONFIG[f as Category]
                      return (
                        <button key={f} onClick={() => setActiveFilter(f)}
                          className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap border transition-all shrink-0 ${active ? 'bg-black text-white border-black' : 'text-gray-500 border-gray-200 hover:border-gray-400 bg-white'}`}>
                          {!isAll && <span className={active ? 'text-white' : cfg!.text}>{cfg!.icon}</span>}
                          {isAll ? 'All' : cfg!.label.split(' ')[0]}
                        </button>
                      )
                    })}
                  </div>
                  <button
                    onClick={() => setShowFilters(v => !v)}
                    className={`relative flex items-center justify-center w-7 h-7 rounded-lg border transition-all shrink-0 self-start mt-0.5 ${showFilters || activeFilterCount > 0 ? 'bg-black text-white border-black' : 'border-gray-200 text-gray-500 hover:border-gray-400 bg-white'}`}>
                    <SlidersHorizontal size={12} />
                    {activeFilterCount > 0 && !showFilters && (
                      <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 text-white rounded-full text-[8px] flex items-center justify-center font-medium">{activeFilterCount}</span>
                    )}
                  </button>
                </div>

                {showFilters && (
                  <div className="border border-gray-100 rounded-xl p-3 mb-3 animate-slide-up">
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      <div>
                        <label className="text-[10px] text-gray-400 mb-1 block uppercase tracking-wide">Min amount</label>
                        <div className="relative">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400 select-none">Rp</span>
                          <input type="text" inputMode="numeric" value={minAmount}
                            onChange={e => setMinAmount(e.target.value.replace(/[^0-9]/g, ''))} placeholder="0"
                            className="w-full border border-gray-200 rounded-lg pl-8 pr-2 py-1.5 text-xs text-black focus:outline-none focus:border-black transition" />
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] text-gray-400 mb-1 block uppercase tracking-wide">Max amount</label>
                        <div className="relative">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400 select-none">Rp</span>
                          <input type="text" inputMode="numeric" value={maxAmount}
                            onChange={e => setMaxAmount(e.target.value.replace(/[^0-9]/g, ''))} placeholder="∞"
                            className="w-full border border-gray-200 rounded-lg pl-8 pr-2 py-1.5 text-xs text-black focus:outline-none focus:border-black transition" />
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-400 mb-1 block uppercase tracking-wide">Sort by</label>
                      <div className="flex gap-1.5 flex-wrap">
                        {([
                          { val: 'date-desc',   label: 'Newest' },
                          { val: 'date-asc',    label: 'Oldest' },
                          { val: 'amount-desc', label: 'Highest' },
                          { val: 'amount-asc',  label: 'Lowest' },
                        ] as { val: SortOrder; label: string }[]).map(s => (
                          <button key={s.val} onClick={() => setSortOrder(s.val)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${sortOrder === s.val ? 'bg-black text-white border-black' : 'border-gray-200 text-gray-500 hover:border-gray-400'}`}>
                            {s.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    {(minAmount || maxAmount || sortOrder !== 'date-desc') && (
                      <button onClick={() => { setMinAmount(''); setMaxAmount(''); setSortOrder('date-desc') }}
                        className="mt-2 text-[10px] text-gray-400 hover:text-black transition-colors flex items-center gap-1">
                        <X size={10} /> Clear filters
                      </button>
                    )}
                  </div>
                )}
              </>
            )}

            {/* Expenses list */}
            {activeTab === 'expenses' && (
              filteredExpenses.length === 0 ? (
                <div className="text-center py-16 text-gray-300">
                  <Wallet size={28} className="mx-auto mb-3 opacity-30" />
                  <p className="text-sm">{searchQuery ? 'No results found' : 'No expenses yet'}</p>
                  <p className="text-xs mt-1">{searchQuery ? `No matches for "${searchQuery}"` : 'Start by adding an expense'}</p>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {(minAmount || maxAmount || sortOrder !== 'date-desc' || searchQuery) && (
                    <p className="text-xs text-gray-400 mb-1">{filteredExpenses.length} result{filteredExpenses.length !== 1 ? 's' : ''}</p>
                  )}
                  {filteredExpenses.map((exp, idx) => {
                    const cfg = CATEGORY_CONFIG[exp.category]
                    return (
                      <div key={exp.id} className="row-item flex items-center gap-3 border border-gray-100 rounded-xl px-3 sm:px-4 py-3 hover:bg-gray-50 transition-all" style={{ animationDelay: `${idx * 0.03}s` }}>
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${cfg.bg}`}><span className={cfg.text}>{cfg.icon}</span></div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{exp.title}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className={`text-xs px-1.5 py-0.5 rounded-full ${cfg.bg} ${cfg.text}`}>{cfg.label}</span>
                            {exp.note && <span className="text-xs text-gray-400 truncate hidden sm:inline">{exp.note}</span>}
                          </div>
                        </div>
                        <div className="text-right shrink-0 mr-1">
                          <p className="text-sm font-medium text-black">{fmt(exp.amount)}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{new Date(exp.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                        </div>
                        <RowMenu items={[
                          { label: 'Edit',   icon: <Pencil size={13} />, onClick: () => setEditingExpense(exp) },
                          { label: 'Delete', icon: <Trash2 size={13} />, onClick: () => setDeletingExpense(exp), danger: true },
                        ]} />
                      </div>
                    )
                  })}
                </div>
              )
            )}

            {/* Income list */}
            {activeTab === 'income' && (
              filteredIncome.length === 0 ? (
                <div className="text-center py-16 text-gray-300">
                  <ArrowUpCircle size={28} className="mx-auto mb-3 opacity-30" />
                  <p className="text-sm">No income yet</p>
                  <p className="text-xs mt-1">Tap "Income" in the header to add</p>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {filteredIncome.map((inc, idx) => {
                    const cfg = INCOME_CONFIG[inc.category]
                    return (
                      <div key={inc.id} className="row-item flex items-center gap-3 border border-gray-100 rounded-xl px-3 sm:px-4 py-3 hover:bg-gray-50 transition-all" style={{ animationDelay: `${idx * 0.03}s` }}>
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-green-50"><span className="text-green-700">{cfg.icon}</span></div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{inc.title}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs px-1.5 py-0.5 rounded-full bg-green-50 text-green-700">{cfg.label}</span>
                            {inc.note && <span className="text-xs text-gray-400 truncate hidden sm:inline">{inc.note}</span>}
                          </div>
                        </div>
                        <div className="text-right shrink-0 mr-1">
                          <p className="text-sm font-medium text-green-700">+{fmt(inc.amount)}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{new Date(inc.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                        </div>
                        <RowMenu items={[
                          { label: 'Edit',   icon: <Pencil size={13} />, onClick: () => setEditingIncome(inc) },
                          { label: 'Delete', icon: <Trash2 size={13} />, onClick: () => handleDeleteIncome(inc.id), danger: true },
                        ]} />
                      </div>
                    )
                  })}
                </div>
              )
            )}

            {/* Bills list */}
            {activeTab === 'bills' && (
              recurring.length === 0 ? (
                <div className="text-center py-16 text-gray-300">
                  <CreditCard size={28} className="mx-auto mb-3 opacity-30" />
                  <p className="text-sm">No bills yet</p>
                  <p className="text-xs mt-1">Add recurring costs like rent, subscriptions, etc.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {recurring.map((r, idx) => {
                    const cfg        = CATEGORY_CONFIG[r.category]
                    const dueDate    = new Date(r.next_due)
                    const daysLeft   = Math.ceil((dueDate.getTime() - Date.now()) / 86_400_000)
                    const isPaid     = !!localPaidBills[r.id]
                    const localExpId = localPaidBills[r.id]
                    const overdue    = daysLeft < 0 && !isPaid
                    const dueSoon    = !isPaid && daysLeft >= 0 && daysLeft <= 3
                    const paying     = payingBillId === r.id
                    return (
                      <div key={r.id} className={`row-item flex items-center gap-3 border rounded-xl px-3 sm:px-4 py-3 transition-all ${
                        isPaid ? 'border-green-200 bg-green-50/30' : overdue ? 'border-red-200 bg-red-50/30' : dueSoon ? 'border-amber-200 bg-amber-50/20' : 'border-gray-100 hover:bg-gray-50'
                      }`} style={{ animationDelay: `${idx * 0.03}s` }}>
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${cfg.bg}`}>
                          <span className={cfg.text}>{cfg.icon}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{r.title}</p>
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            <span className={`text-xs px-1.5 py-0.5 rounded-full ${cfg.bg} ${cfg.text}`}>{FREQ_LABELS[r.frequency]}</span>
                            {isPaid ? (
                              <span className="text-xs font-medium text-green-600">Paid ✓ next due {new Date(r.next_due).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                            ) : (
                              <span className={`text-xs font-medium ${overdue ? 'text-red-600' : dueSoon ? 'text-amber-600' : 'text-gray-400'}`}>
                                {overdue ? `${Math.abs(daysLeft)}d overdue` : daysLeft === 0 ? 'Due today!' : `Due in ${daysLeft}d`}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-medium text-black">{fmt(r.amount)}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                        </div>
                        {isPaid ? (
                          <div className="flex items-center gap-1 shrink-0">
                            <span className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium bg-green-100 text-green-700"><Check size={11} /> Paid</span>
                            {localExpId && localExpId !== 'persisted' && (
                              <button onClick={() => handleUndoPayBill(r)} title="Undo payment" className="p-1.5 rounded-lg text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-all"><Undo2 size={13} /></button>
                            )}
                          </div>
                        ) : (
                          <button onClick={() => handlePayBill(r)} disabled={paying}
                            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-all shrink-0 ${
                              overdue || daysLeft <= 0 ? 'bg-black text-white hover:bg-gray-800' : 'border border-gray-200 text-gray-600 hover:border-black hover:text-black'
                            } disabled:opacity-50`}>
                            {paying ? <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" /> : <><Check size={11} /> Pay</>}
                          </button>
                        )}
                        <RowMenu items={[
                          { label: 'Edit',   icon: <Pencil size={13} />, onClick: () => setEditingBill(r) },
                          { label: 'Delete', icon: <Trash2 size={13} />, onClick: () => handleDeleteBill(r.id), danger: true, disabled: deletingBillId === r.id },
                        ]} />
                      </div>
                    )
                  })}
                </div>
              )
            )}
          </div>

          <div className="hidden sm:flex justify-center mt-8 pt-6 border-t border-gray-100">
            <button onClick={() => exportCSV(expenses, income, selectedMonth)}
              className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-black transition-colors">
              <Download size={12} /> Export {getMonthLabelFull(selectedMonth)} as CSV
            </button>
          </div>

        </div>
      </div>

      {/* Modals */}
      {showAddExpense  && <AddExpenseModal  onClose={() => setShowAddExpense(false)}  onSave={handleAddExpense} />}
      {editingExpense  && <EditExpenseModal expense={editingExpense} onClose={() => setEditingExpense(null)} onSave={handleSaveEdit} />}
      {deletingExpense && <DeleteConfirm   title={deletingExpense.title} onConfirm={handleConfirmDelete} onCancel={() => setDeletingExpense(null)} deleting={isDeleting} />}
      {showAddIncome   && <AddIncomeModal  onClose={() => setShowAddIncome(false)}   onSave={handleAddIncome} />}
      {editingIncome   && <EditIncomeModal income={editingIncome} onClose={() => setEditingIncome(null)} onSave={handleSaveEditIncome} />}
      {showAddGoal     && <AddGoalModal    onClose={() => setShowAddGoal(false)}     onSave={handleAddGoal} />}
      {openGoal        && <GoalDetailModal
          goal={openGoal} history={goalHistories[openGoal.id] || []}
          onClose={() => setOpenGoal(null)}
          onAddFunds={(amt, note) => handleAddFunds(openGoal.id, amt, note)}
          onDeleteHistory={(hid) => handleDeleteGoalHistory(openGoal.id, hid)}
          onEditHistory={(hid, amt, note) => handleEditGoalHistory(openGoal.id, hid, amt, note)}
          onEditGoal={(updated) => handleEditGoal(openGoal.id, updated)}
          onDeleteGoal={() => handleDeleteGoal(openGoal.id)}
        />}
      {showAddBill    && <AddBillModal    onClose={() => setShowAddBill(false)}    onSave={handleAddBill} />}
      {editingBill    && <EditBillModal   item={editingBill} onClose={() => setEditingBill(null)} onSave={handleSaveEditBill} />}
      {showSimulator  && <BudgetSimulatorModal
          thisMonthIncomeTot={thisMonthIncomeTot}
          categoryTotals={categoryTotals} last6Months={last6Months} expenses={expenses}
          recurring={recurring} budgets={budgets} savingsGoals={savingsGoals}
          selectedMonth={selectedMonth} onClose={() => setShowSimulator(false)} />}
      {showAddPool    && <AddPoolModal    onClose={() => setShowAddPool(false)}   onSave={handleAddPool} />}
      {loggingPool    && (() => { const stats = poolsThisMonth.find(s => s.pool.id === loggingPool.id); return stats ? <LogPoolEntryModal pool={loggingPool} remaining={stats.remaining} onClose={() => setLoggingPool(null)} onSave={(amt, note) => handleLogPoolEntry(loggingPool, amt, note)} /> : null })()}
      {openPool       && (() => { const stats = poolsThisMonth.find(s => s.pool.id === openPool.id); return stats ? <PoolDetailModal stats={stats} selectedMonth={selectedMonth} onClose={() => setOpenPool(null)} onLogEntry={() => {}} onDeleteEntry={handleDeletePoolEntry} onEditPool={(u) => handleEditPool(openPool.id, u)} onArchivePool={() => handleArchivePool(openPool.id)} onOpenLog={() => { setLoggingPool(openPool); setOpenPool(null) }} /> : null })()}
      {showAddSplitBill && <AddSplitBillModal onClose={() => setShowAddSplitBill(false)} onSave={handleAddSplitBill} />}
      {openSplitBill  && (() => { const stats = billsWithStats.find(s => s.bill.id === openSplitBill.id); return stats ? <SplitBillDetailModal stats={stats} onClose={() => setOpenSplitBill(null)} onTogglePaid={handleToggleParticipantPaid} onAddParticipant={(name, share) => handleAddParticipant(openSplitBill.id, name, share)} onDeleteParticipant={handleDeleteParticipant} onEditBill={(u) => handleEditSplitBill(openSplitBill.id, u)} onDeleteBill={() => handleDeleteSplitBill(openSplitBill.id)} /> : null })()}
    </>
  )
}