'use client'

// ─── Expert View — full multi-section dashboard with dark sidebar ─────────────
// Every feature of the Beginner view is available here, organized into real
// sections: Dashboard · Expenses · Income · Bills · Budgets · Goals ·
// Splits & Debts · Reports. All data/handlers come from page.tsx via props.

import { useEffect, useMemo, useState } from 'react'
import {
  Plus, LogOut, Wallet, Receipt, Pencil, Trash2, X,
  Check, BarChart2, PiggyBank, ArrowUpCircle, Lightbulb, AlertTriangle, Flag,
  Search, User, Menu, ChevronLeft, ChevronRight, History, CreditCard, Undo2,
  Download, SlidersHorizontal, Eye, EyeOff, Calculator, Users, Settings,
  LayoutGrid, Target, Timer, Info, ArrowRight
} from 'lucide-react'
import {
  Category, SortOrder, Expense, Income, Budget, SavingsGoal,
  RecurringExpense, ExpensePool, ExpensePoolWithStats, SplitBill,
  SplitBillWithStats, Debt, DebtWithStats,
  CATEGORY_CONFIG, CATEGORY_COLOR, INCOME_CONFIG, FREQ_LABELS,
  fmtFull, inMonth, daysLeftInMonth, getMonthLabelFull, exportCSV,
  RowMenu, MonthPickerDropdown, SmartInsightsContent, Sparkline, Ring, CatIcon,
  scrollHorizontally
} from './shared'

type Section = 'dashboard' | 'expenses' | 'income' | 'bills' | 'budgets' | 'goals' | 'shared' | 'reports'

const GREEN = '#059669', RED = '#dc2626', BLUE = '#2563eb'

const btnPrimary = 'flex items-center gap-1.5 bg-black text-white text-sm font-medium px-3.5 py-2 rounded-xl hover:bg-gray-800 active:scale-[.98] transition-all'
const btnOutline = 'flex items-center gap-1.5 border border-gray-200 bg-white text-gray-600 hover:text-black hover:border-black text-sm font-medium px-3.5 py-2 rounded-xl active:scale-[.98] transition-all'

const fmtDate = (iso: string) => new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

// ─── Small building blocks ────────────────────────────────────────────────────

function SectionHead({ title, sub, children }: {
  title: string; sub?: React.ReactNode; children?: React.ReactNode
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3 mb-5">
      <div className="min-w-0">
        <h1 className="text-xl sm:text-2xl font-semibold text-black tracking-tight">{title}</h1>
        {sub && <p className="text-sm text-gray-400 mt-0.5">{sub}</p>}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  )
}

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`bg-white border border-gray-100 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.03)] ${className}`}>{children}</div>
}

function CardLabel({ children, right }: { children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <p className="text-xs font-medium text-gray-400 uppercase tracking-wide flex items-center gap-1.5">{children}</p>
      {right}
    </div>
  )
}

function EmptyState({ icon, title, sub, actionLabel, onAction }: {
  icon: React.ReactNode; title: string; sub: string; actionLabel?: string; onAction?: () => void
}) {
  return (
    <div className="text-center py-12">
      <div className="mx-auto mb-3 text-gray-200 [&>svg]:mx-auto">{icon}</div>
      <p className="text-sm text-gray-400 font-medium mb-0.5">{title}</p>
      <p className="text-xs text-gray-300 mb-4">{sub}</p>
      {actionLabel && onAction && (
        <button onClick={onAction}
          className="inline-flex items-center gap-1.5 bg-black text-white text-xs font-medium px-3.5 py-2 rounded-xl hover:bg-gray-800 transition-all">
          <Plus size={12} /> {actionLabel}
        </button>
      )}
    </div>
  )
}

// ─── Charts ───────────────────────────────────────────────────────────────────

// Vertical bar chart (spending overview) — hover tooltip, click bar to select month
function BarsChart({ data, max, selectedKey, onSelectKey, height = 208 }: {
  data: { label: string; total: number; key?: string }[]
  max: number
  selectedKey?: string
  onSelectKey?: (key: string) => void
  height?: number
}) {
  const [hover, setHover] = useState<number | null>(null)
  return (
    <div className="relative">
      {hover !== null && data[hover] && (
        <div className="absolute -top-1 z-10 bg-black text-white text-[11px] font-medium px-2 py-1 rounded-md whitespace-nowrap pointer-events-none -translate-x-1/2"
          style={{ left: `${Math.min(Math.max(((hover + 0.5) / data.length) * 100, 14), 86)}%` }}>
          {data[hover].label} · {fmtFull(data[hover].total)}
        </div>
      )}
      {/* Recessive gridlines behind the bars; last line is the baseline */}
      <div className="absolute inset-x-0 top-0 bottom-[21px] pointer-events-none flex flex-col justify-between">
        <div className="border-t border-gray-100" />
        <div className="border-t border-gray-100" />
        <div className="border-t border-gray-100" />
        <div className="border-t border-gray-200" />
      </div>
      <div className="relative flex items-end gap-2" style={{ height }}>
        {data.map((m, i) => {
          const h = m.total ? Math.max((m.total / max) * 88, 4) : 2
          const isCurrent = !!m.key && m.key === selectedKey
          const isHover = hover === i
          return (
            <div key={i} className={`flex-1 h-full flex flex-col justify-end items-center gap-1.5 ${m.key && onSelectKey ? 'cursor-pointer' : ''}`}
              onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}
              onClick={() => { if (m.key && onSelectKey) onSelectKey(m.key) }}>
              {isCurrent && hover === null && m.total > 0 && (
                <span className="text-[10px] font-semibold text-emerald-700 tabular-nums whitespace-nowrap">{fmtFull(m.total)}</span>
              )}
              <div className={`w-full max-w-[42px] rounded-t-lg transition-all duration-300 ${
                isCurrent || isHover ? 'bg-gradient-to-t from-emerald-600 to-emerald-400' : 'bg-emerald-200/70 hover:bg-emerald-200'
              }`} style={{ height: `${h}%` }} />
              <span className={`text-[10px] ${isCurrent ? 'text-black font-medium' : 'text-gray-400'}`}>{m.label}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// Grouped income-vs-expense bars (Reports) — emerald + near-black pairing keeps
// the two series distinguishable for color-blind readers; identity is also
// carried by the legend and hover tooltip.
function GroupedBars({ rows, height = 208 }: {
  rows: { label: string; income: number; expense: number }[]
  height?: number
}) {
  const [hover, setHover] = useState<number | null>(null)
  const max = Math.max(...rows.flatMap(r => [r.income, r.expense]), 1)
  return (
    <div className="relative">
      {hover !== null && rows[hover] && (
        <div className="absolute -top-2 z-10 bg-black text-white text-[11px] px-2.5 py-1.5 rounded-md whitespace-nowrap pointer-events-none -translate-x-1/2"
          style={{ left: `${Math.min(Math.max(((hover + 0.5) / rows.length) * 100, 18), 82)}%` }}>
          <span className="font-medium">{rows[hover].label}</span>
          <span className="flex items-center gap-1.5 mt-0.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" /> {fmtFull(rows[hover].income)}</span>
          <span className="flex items-center gap-1.5 mt-0.5"><span className="w-1.5 h-1.5 rounded-full bg-gray-300 inline-block" /> {fmtFull(rows[hover].expense)}</span>
        </div>
      )}
      <div className="flex items-end gap-3" style={{ height }}>
        {rows.map((r, i) => {
          const hInc = r.income ? Math.max((r.income / max) * 100, 3) : 1.5
          const hExp = r.expense ? Math.max((r.expense / max) * 100, 3) : 1.5
          const dim = hover !== null && hover !== i
          return (
            <div key={i} className="flex-1 h-full flex flex-col justify-end items-center gap-1.5 cursor-default"
              onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
              <div className={`w-full h-full flex items-end justify-center gap-[3px] transition-opacity duration-200 ${dim ? 'opacity-40' : ''}`}>
                <div className="w-full max-w-[16px] rounded-t bg-emerald-500 transition-all duration-300" style={{ height: `${hInc}%` }} />
                <div className="w-full max-w-[16px] rounded-t bg-gray-900 transition-all duration-300" style={{ height: `${hExp}%` }} />
              </div>
              <span className="text-[10px] text-gray-400">{r.label}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// Category donut with interactive legend
function Donut({ categoryTotals, total }: {
  categoryTotals: Partial<Record<Category, number>>; total: number
}) {
  const [hover, setHover] = useState<number | null>(null)
  const slices = (Object.keys(CATEGORY_CONFIG) as Category[])
    .map(cat => ({ cat, spent: categoryTotals[cat] || 0, pct: total > 0 ? (categoryTotals[cat] || 0) / total * 100 : 0 }))
    .filter(s => s.spent > 0).sort((a, b) => b.spent - a.spent)
  let offset = 0
  return (
    <div className="flex items-center gap-5">
      <div className="relative shrink-0 animate-pop-in">
        <svg width="140" height="140" viewBox="0 0 36 36" className="-rotate-90">
          <circle cx="18" cy="18" r="15.915" fill="none" stroke="#f3f4f6" strokeWidth="3.6" />
          {slices.map((s, i) => {
            const dash = s.pct
            const active = hover === i
            const el = <circle key={s.cat} cx="18" cy="18" r="15.915" fill="none" stroke={CATEGORY_COLOR[s.cat]}
              strokeWidth={active ? 4.6 : 3.6} strokeDasharray={`${Math.max(dash - 1, 0.5)} ${100 - Math.max(dash - 1, 0.5)}`} strokeDashoffset={-offset} pathLength={100}
              className="transition-all duration-300 cursor-pointer" style={{ opacity: hover === null || active ? 1 : 0.3 }}
              onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} />
            offset += dash
            return el
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-5">
          {hover !== null && slices[hover] ? (
            <>
              <span className="text-[10px] text-gray-500 truncate max-w-full">{CATEGORY_CONFIG[slices[hover].cat].label.split(' ')[0]}</span>
              <span className="text-[11px] font-semibold text-black leading-tight">{fmtFull(slices[hover].spent)}</span>
              <span className="text-[10px] text-gray-400">{slices[hover].pct.toFixed(0)}%</span>
            </>
          ) : (
            <>
              <span className="text-[9px] text-gray-400 uppercase tracking-wide">Total</span>
              <span className="text-[11px] font-semibold text-black leading-tight">{fmtFull(total)}</span>
            </>
          )}
        </div>
      </div>
      <div className="flex-1 w-full flex flex-col gap-2 min-w-0">
        {slices.slice(0, 6).map((s, i) => (
          <div key={s.cat} className="legend-row flex items-center gap-2 cursor-pointer rounded-md px-1 -mx-1 transition-colors hover:bg-gray-50"
            style={{ animationDelay: `${0.04 * i}s`, opacity: hover === null || hover === i ? 1 : 0.4 }}
            onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: CATEGORY_COLOR[s.cat] }} />
            <span className="text-xs text-gray-600 flex-1 truncate">{CATEGORY_CONFIG[s.cat].label.split(' ')[0]}</span>
            <span className="text-[11px] text-gray-400 shrink-0 tabular-nums hidden sm:inline">{fmtFull(s.spent)}</span>
            <span className="text-xs font-medium text-gray-600 w-9 text-right shrink-0 tabular-nums">{s.pct.toFixed(0)}%</span>
          </div>
        ))}
        {slices.length > 6 && <span className="text-[10px] text-gray-300 px-1">+{slices.length - 6} more</span>}
      </div>
    </div>
  )
}

// ─── Row / card pieces ────────────────────────────────────────────────────────

function ExpenseRow({ e, i, onEdit, onDelete }: {
  e: Expense; i: number; onEdit: () => void; onDelete: () => void
}) {
  const cfg = CATEGORY_CONFIG[e.category]
  return (
    <div className="row-item flex items-center gap-3 border border-gray-100 rounded-xl px-3 py-2.5 hover:bg-gray-50 hover:border-gray-200 transition-all" style={{ animationDelay: `${Math.min(i, 12) * 0.03}s` }}>
      <CatIcon category={e.category} size={36} />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-gray-900 truncate">{e.title}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className={`text-xs px-1.5 py-0.5 rounded-full ${cfg.bg} ${cfg.text}`}>{cfg.label}</span>
          {e.note && <span className="text-xs text-gray-400 truncate hidden sm:inline">{e.note}</span>}
        </div>
      </div>
      <div className="text-right shrink-0">
        <p className="text-sm font-semibold text-black tabular-nums">{fmtFull(e.amount)}</p>
        <p className="text-xs text-gray-400 mt-0.5">{fmtDate(e.created_at)}</p>
      </div>
      <RowMenu items={[
        { label: 'Edit', icon: <Pencil size={13} />, onClick: onEdit },
        { label: 'Delete', icon: <Trash2 size={13} />, onClick: onDelete, danger: true },
      ]} />
    </div>
  )
}

function IncomeRow({ inc, i, onEdit, onDelete }: {
  inc: Income; i: number; onEdit: () => void; onDelete: () => void
}) {
  const cfg = INCOME_CONFIG[inc.category]
  return (
    <div className="row-item flex items-center gap-3 border border-gray-100 rounded-xl px-3 py-2.5 hover:bg-gray-50 hover:border-gray-200 transition-all" style={{ animationDelay: `${Math.min(i, 12) * 0.03}s` }}>
      <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-emerald-50 text-emerald-700">{cfg.icon}</div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-gray-900 truncate">{inc.title}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700">{cfg.label}</span>
          {inc.note && <span className="text-xs text-gray-400 truncate hidden sm:inline">{inc.note}</span>}
        </div>
      </div>
      <div className="text-right shrink-0">
        <p className="text-sm font-semibold text-emerald-700 tabular-nums">+{fmtFull(inc.amount)}</p>
        <p className="text-xs text-gray-400 mt-0.5">{fmtDate(inc.created_at)}</p>
      </div>
      <RowMenu items={[
        { label: 'Edit', icon: <Pencil size={13} />, onClick: onEdit },
        { label: 'Delete', icon: <Trash2 size={13} />, onClick: onDelete, danger: true },
      ]} />
    </div>
  )
}

function BillRow({ r, i, isPaid, localExpId, paying, deleting, onPay, onUndo, onEdit, onDelete }: {
  r: RecurringExpense; i: number; isPaid: boolean; localExpId?: string
  paying: boolean; deleting: boolean
  onPay: () => void; onUndo: () => void; onEdit: () => void; onDelete: () => void
}) {
  const cfg = CATEGORY_CONFIG[r.category]
  const dueDate = new Date(r.next_due)
  const daysLeft = Math.ceil((dueDate.getTime() - Date.now()) / 86_400_000)
  const overdue = daysLeft < 0 && !isPaid
  const dueSoon = !isPaid && daysLeft >= 0 && daysLeft <= 3
  return (
    <div className={`row-item flex flex-wrap sm:flex-nowrap items-center gap-2 sm:gap-3 border rounded-xl px-3 sm:px-4 py-3 transition-all ${
      isPaid ? 'border-emerald-200 bg-emerald-50/30' : overdue ? 'border-red-200 bg-red-50/30' : dueSoon ? 'border-amber-200 bg-amber-50/20' : 'border-gray-100 hover:bg-gray-50'
    }`} style={{ animationDelay: `${Math.min(i, 12) * 0.03}s` }}>
      <div className="flex items-center gap-3 w-full sm:w-auto sm:flex-1 min-w-0">
        <CatIcon category={r.category} size={36} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">{r.title}</p>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <span className={`text-xs px-1.5 py-0.5 rounded-full whitespace-nowrap ${cfg.bg} ${cfg.text}`}>{FREQ_LABELS[r.frequency]}</span>
            {isPaid ? (
              <span className="text-xs font-medium text-emerald-600 whitespace-nowrap">Paid ✓ next due {fmtDate(r.next_due)}</span>
            ) : (
              <span className={`text-xs font-medium whitespace-nowrap ${overdue ? 'text-red-600' : dueSoon ? 'text-amber-600' : 'text-gray-400'}`}>
                {overdue ? `${Math.abs(daysLeft)}d overdue` : daysLeft === 0 ? 'Due today!' : `Due in ${daysLeft}d`}
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between w-full sm:w-auto pl-12 sm:pl-0 gap-2">
        <div className="text-left sm:text-right shrink-0">
          <p className="text-sm font-semibold text-black tabular-nums">{fmtFull(r.amount)}</p>
          <p className="text-xs text-gray-400 mt-0.5">{fmtDate(r.next_due)}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {isPaid ? (
            <div className="flex items-center gap-1 shrink-0">
              <span className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium bg-emerald-100 text-emerald-700"><Check size={11} /> Paid</span>
              {localExpId && localExpId !== 'persisted' && (
                <button onClick={onUndo} title="Undo payment" className="p-1.5 rounded-lg text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-all"><Undo2 size={13} /></button>
              )}
            </div>
          ) : (
            <button onClick={onPay} disabled={paying}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 ${
                overdue || daysLeft <= 0 ? 'bg-black text-white hover:bg-gray-800' : 'border border-gray-200 text-gray-600 hover:border-black hover:text-black'
              } disabled:opacity-50`}>
              {paying ? <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" /> : <><Check size={11} /> Pay</>}
            </button>
          )}
          <RowMenu items={[
            { label: 'Edit', icon: <Pencil size={13} />, onClick: onEdit },
            { label: 'Delete', icon: <Trash2 size={13} />, onClick: onDelete, danger: true, disabled: deleting },
          ]} />
        </div>
      </div>
    </div>
  )
}

function PoolCard({ stats, selectedMonth, onOpen, onLog, onArchive }: {
  stats: ExpensePoolWithStats; selectedMonth: string
  onOpen: () => void; onLog: () => void; onArchive: () => void
}) {
  const { pool, spent, remaining, pct } = stats
  const over = spent > pool.budget_amount
  const warn = !over && pct >= 80
  const days = daysLeftInMonth(selectedMonth)
  return (
    <div onClick={onOpen} className="border border-gray-100 rounded-xl p-4 hover:border-gray-300 hover:bg-gray-50/50 transition-all cursor-pointer bg-white">
      <div className="flex items-start justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <CatIcon category={pool.category} size={32} />
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{pool.title}</p>
            <p className="text-xs text-gray-400">{fmtFull(pool.budget_amount)} / month</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button onClick={e => { e.stopPropagation(); onLog() }}
            className="flex items-center gap-1 px-2 py-1 rounded-lg border border-gray-200 text-xs text-gray-600 hover:border-black hover:text-black transition-all">
            <Plus size={11} /> Log
          </button>
          <RowMenu items={[
            { label: 'Details', icon: <History size={13} />, onClick: onOpen },
            { label: 'Archive', icon: <Trash2 size={13} />, onClick: onArchive, danger: true },
          ]} />
        </div>
      </div>
      <div className="bg-gray-100 rounded-full h-1.5 overflow-hidden mb-1.5">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: over ? '#ef4444' : warn ? '#f59e0b' : CATEGORY_COLOR[pool.category] }} />
      </div>
      <div className="flex items-center justify-between gap-2 text-xs">
        {spent === 0
          ? <span className="text-gray-300 italic truncate">Not logged yet this month</span>
          : <span className="text-gray-500 truncate">{fmtFull(spent)} used</span>}
        {over
          ? <span className="text-red-500 font-medium text-right shrink-0">Over by {fmtFull(spent - pool.budget_amount)}</span>
          : warn
          ? <span className="text-amber-500 text-right shrink-0">{fmtFull(remaining)} left</span>
          : <span className="text-gray-400 text-right shrink-0">{fmtFull(remaining)} remaining</span>}
      </div>
      {days !== null && <p className="text-[10px] text-gray-300 mt-1 text-right">{days}d left in the month</p>}
    </div>
  )
}

function SplitCard({ stats, onOpen, onDelete }: {
  stats: SplitBillWithStats; onOpen: () => void; onDelete: () => void
}) {
  const { bill, participants, owed, collected, paidCount, settled } = stats
  const totalOwed = owed + collected
  const pct = totalOwed > 0 ? Math.min((collected / totalOwed) * 100, 100) : 0
  const myShare = Math.max(bill.total_amount - totalOwed, 0)
  return (
    <div onClick={onOpen} className="border border-gray-100 rounded-xl p-4 hover:border-gray-300 hover:bg-gray-50/50 transition-all cursor-pointer">
      <div className="flex items-start justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <CatIcon category={bill.category} size={32} />
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{bill.title}</p>
            <p className="text-xs text-gray-400 truncate">
              {fmtFull(bill.total_amount)} · {participants.length} {participants.length === 1 ? 'person' : 'people'}
              {myShare > 0 && <span className="text-gray-300"> · {fmtFull(myShare)} yours</span>}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {settled
            ? <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-medium">Settled</span>
            : <span className="text-[10px] text-gray-400">{paidCount}/{participants.length} paid</span>}
          <RowMenu items={[
            { label: 'Details', icon: <Users size={13} />, onClick: onOpen },
            { label: 'Delete', icon: <Trash2 size={13} />, onClick: onDelete, danger: true },
          ]} />
        </div>
      </div>
      <div className="bg-gray-100 rounded-full h-1.5 overflow-hidden mb-1.5">
        <div className={`h-full rounded-full transition-all duration-700 ${settled ? 'bg-emerald-500' : 'bg-black'}`} style={{ width: `${pct}%` }} />
      </div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-gray-500">{fmtFull(collected)} collected</span>
        {settled
          ? <span className="text-emerald-500 font-medium">All settled up</span>
          : <span className="text-gray-400">{fmtFull(owed)} owed to you</span>}
      </div>
    </div>
  )
}

function DebtCard({ stats, onOpen, onLog, onDelete }: {
  stats: DebtWithStats; onOpen: () => void; onLog: () => void; onDelete: () => void
}) {
  const { debt, paid, remaining, pct, settled, overdue } = stats
  return (
    <div onClick={onOpen} className="border border-gray-100 rounded-xl p-4 hover:border-gray-300 hover:bg-gray-50/50 transition-all cursor-pointer">
      <div className="flex items-start justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 bg-gray-50 rounded-xl flex items-center justify-center shrink-0 text-gray-600"><CreditCard size={14} /></div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{debt.person_name}</p>
            <p className="text-xs text-gray-400">{fmtFull(debt.amount)} total</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {settled
            ? <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-medium">Settled</span>
            : overdue
            ? <span className="flex items-center gap-0.5 text-[10px] text-red-500 font-medium"><AlertTriangle size={10} /> Overdue</span>
            : null}
          <RowMenu items={[
            ...(!settled ? [{ label: 'Log payment', icon: <Plus size={13} />, onClick: onLog }] : []),
            { label: 'Details', icon: <History size={13} />, onClick: onOpen },
            { label: 'Delete', icon: <Trash2 size={13} />, onClick: onDelete, danger: true },
          ]} />
        </div>
      </div>
      <div className="bg-gray-100 rounded-full h-1.5 overflow-hidden mb-1.5">
        <div className={`h-full rounded-full transition-all duration-700 ${settled ? 'bg-emerald-500' : 'bg-black'}`} style={{ width: `${pct}%` }} />
      </div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-gray-500">{fmtFull(paid)} paid back</span>
        {settled
          ? <span className="text-emerald-500 font-medium">Fully paid</span>
          : <span className={overdue ? 'text-red-500 font-medium' : 'text-gray-400'}>{fmtFull(remaining)} remaining</span>}
      </div>
    </div>
  )
}

function GoalCard({ goal, onOpen }: { goal: SavingsGoal; onOpen: () => void }) {
  const pct = Math.min((goal.current_amount / goal.target_amount) * 100, 100)
  const done = goal.current_amount >= goal.target_amount
  const remaining = goal.target_amount - goal.current_amount
  let daysLeft: number | null = null
  if (goal.deadline) daysLeft = Math.ceil((new Date(goal.deadline).getTime() - Date.now()) / 86_400_000)
  const fillClass = done
    ? 'bg-gradient-to-r from-emerald-400 to-green-500'
    : pct >= 75 ? 'bg-gradient-to-r from-blue-500 to-indigo-500'
    : pct >= 40 ? 'bg-gradient-to-r from-amber-400 to-orange-400'
    : 'bg-gradient-to-r from-rose-300 to-pink-400'
  return (
    <div onClick={onOpen} className="border border-gray-100 rounded-xl p-4 hover:border-gray-300 hover:bg-gray-50/50 transition-all cursor-pointer group bg-white">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${done ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-50 text-gray-500'}`}><Flag size={14} /></div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{goal.title}</p>
            <p className="text-xs text-gray-400 tabular-nums truncate">{fmtFull(goal.current_amount)} / {fmtFull(goal.target_amount)}</p>
          </div>
        </div>
        <span className={`text-sm font-semibold shrink-0 ${done ? 'text-emerald-600' : pct >= 75 ? 'text-blue-600' : pct >= 40 ? 'text-amber-600' : 'text-rose-400'}`}>{pct.toFixed(0)}%</span>
      </div>
      <div className="bg-gray-100 rounded-full h-2 overflow-hidden mb-2">
        <div className={`h-full rounded-full transition-all duration-700 ${fillClass}`} style={{ width: `${pct}%` }} />
      </div>
      <div className="flex items-center justify-between text-xs">
        {done
          ? <span className="text-emerald-500 font-medium">Goal reached!</span>
          : <span className="text-gray-400">{fmtFull(remaining)} to go</span>}
        <div className="flex items-center gap-2">
          {daysLeft !== null && !done && (
            <span className={daysLeft <= 7 ? 'text-red-500 font-medium' : 'text-gray-400'}>{daysLeft > 0 ? `${daysLeft}d left` : 'Overdue'}</span>
          )}
          <span className="text-gray-300 hidden group-hover:inline text-[10px]">Manage →</span>
        </div>
      </div>
    </div>
  )
}

// ─── Props ────────────────────────────────────────────────────────────────────

export interface ExpertViewProps {
  fullName: string
  // month
  selectedMonth: string
  setSelectedMonth: (m: string) => void
  last6Months: { key: string; label: string; total: number }[]
  incomeLast6Months: { key: string; label: string; total: number }[]
  // headline numbers
  cumulativeBalance: number; netSavings: number
  thisMonthIncomeTot: number; thisMonthTotal: number; lastMonthTotal: number
  monthOverMonthPct: number; spendingRate: number; avgPerDay: number
  safeToSpendPerDay: { perDay: number; daysLeft: number; isCurrentMonth: boolean }
  savingsRatePct: number
  dailySeries: number[]
  monthlyProgress: { budget: number; spent: number; pct: number; left: number; basis: 'budget' | 'income' }
  primaryGoal: SavingsGoal | null
  categoryTotals: Partial<Record<Category, number>>
  weeklyData: { label: string; total: number }[]
  maxMonthly: number; maxWeekly: number
  chartView: 'monthly' | 'weekly'
  setChartView: (v: 'monthly' | 'weekly') => void
  budgets: Budget[]; budgetSpend: Partial<Record<Category, number>>
  // raw data
  expenses: Expense[]; income: Income[]
  recurring: RecurringExpense[]
  savingsGoals: SavingsGoal[]
  expensePools: ExpensePool[]; splitBills: SplitBill[]; debts: Debt[]
  // derived lists
  filteredExpenses: Expense[]; filteredIncome: Income[]; thisMonthIncome: Income[]
  poolsThisMonth: ExpensePoolWithStats[]
  splitBillsWithStats: SplitBillWithStats[]
  debtsWithStats: DebtWithStats[]
  billsDueSoon: number
  // filters & privacy (state shared with parent so derived memos keep working)
  activeFilter: Category | 'all'
  setActiveFilter: (c: Category | 'all') => void
  searchQuery: string
  setSearchQuery: (q: string) => void
  showFilters: boolean
  setShowFilters: React.Dispatch<React.SetStateAction<boolean>>
  sortOrder: SortOrder
  setSortOrder: (s: SortOrder) => void
  minAmount: string
  setMinAmount: (v: string) => void
  maxAmount: string
  setMaxAmount: (v: string) => void
  showTotalBalance: boolean
  setShowTotalBalance: React.Dispatch<React.SetStateAction<boolean>>
  // bill payment state
  localPaidBills: Record<string, string>
  payingBillId: string | null
  deletingBillId: string | null
  handlePayBill: (r: RecurringExpense) => void
  handleUndoPayBill: (r: RecurringExpense) => void
  handleDeleteBill: (id: string) => void
  setEditingBill: (r: RecurringExpense) => void
  // modals / handlers
  setShowAddExpense: (v: boolean) => void
  setShowAddIncome: (v: boolean) => void
  setShowAddBill: (v: boolean) => void
  setShowAddPool: (v: boolean) => void
  setShowAddSplitBill: (v: boolean) => void
  setShowAddDebt: (v: boolean) => void
  setShowAddGoal: (v: boolean) => void
  setShowSimulator: (v: boolean) => void
  setShowSettings: (v: boolean) => void
  setEditingExpense: (e: Expense) => void
  setDeletingExpense: (e: Expense) => void
  setEditingIncome: (i: Income) => void
  handleDeleteIncome: (id: string) => void
  setOpenPool: (p: ExpensePool) => void
  setLoggingPool: (p: ExpensePool) => void
  handleArchivePool: (id: string) => void
  setOpenSplitBill: (b: SplitBill) => void
  handleDeleteSplitBill: (id: string) => void
  setOpenDebt: (d: Debt) => void
  setLoggingDebt: (d: Debt) => void
  handleArchiveDebt: (id: string) => void
  setOpenGoal: (g: SavingsGoal) => void
  onLogout: () => void
}

// ─── The Expert View ──────────────────────────────────────────────────────────

export default function ExpertView(p: ExpertViewProps) {
  const [section, setSection] = useState<Section>('dashboard')
  const [drawerOpen, setDrawerOpen] = useState(false)

  useEffect(() => { window.scrollTo({ top: 0 }) }, [section])

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
  const monthLabel = getMonthLabelFull(p.selectedMonth)

  // Month prev/next
  const monthIndex = p.last6Months.findIndex(m => m.key === p.selectedMonth)
  const canGoPrev = monthIndex > 0
  const canGoNext = monthIndex >= 0 && monthIndex < p.last6Months.length - 1

  // Derived (expert-local)
  const monthExpenses = useMemo(() => p.expenses.filter(e => inMonth(e.created_at, p.selectedMonth)), [p.expenses, p.selectedMonth])
  const largestExpense = useMemo(() => monthExpenses.reduce<Expense | null>((mx, e) => (!mx || e.amount > mx.amount ? e : mx), null), [monthExpenses])
  const topExpenses = useMemo(() => [...monthExpenses].sort((a, b) => b.amount - a.amount).slice(0, 5), [monthExpenses])
  const activeFilterCount = [p.minAmount, p.maxAmount, p.sortOrder !== 'date-desc'].filter(Boolean).length
  const filtersActive = !!(p.minAmount || p.maxAmount || p.sortOrder !== 'date-desc' || p.searchQuery || p.activeFilter !== 'all')

  const upcomingBills = useMemo(() =>
    p.recurring.filter(r => !p.localPaidBills[r.id])
      .sort((a, b) => new Date(a.next_due).getTime() - new Date(b.next_due).getTime())
      .slice(0, 3), [p.recurring, p.localPaidBills])

  const monthlyCommitment = useMemo(() => p.recurring.reduce((s, r) =>
    s + (r.frequency === 'monthly' ? r.amount : r.frequency === 'weekly' ? r.amount * 4 : r.amount * 30), 0), [p.recurring])
  const paidBillsCount = Object.keys(p.localPaidBills).length

  const totalOwedToYou = useMemo(() => p.splitBillsWithStats.reduce((s, b) => s + b.owed, 0), [p.splitBillsWithStats])
  const totalDebtRemaining = useMemo(() => p.debtsWithStats.filter(d => !d.settled).reduce((s, d) => s + d.remaining, 0), [p.debtsWithStats])
  const goalsSaved = useMemo(() => p.savingsGoals.reduce((s, g) => s + g.current_amount, 0), [p.savingsGoals])
  const goalsTarget = useMemo(() => p.savingsGoals.reduce((s, g) => s + g.target_amount, 0), [p.savingsGoals])

  // Reports derivations
  const incomeVsExpense = useMemo(() => p.last6Months.map((m, i) => ({
    label: m.label, key: m.key, expense: m.total, income: p.incomeLast6Months[i]?.total || 0,
  })), [p.last6Months, p.incomeLast6Months])
  const savingsRateSeries = useMemo(() => incomeVsExpense.map(r =>
    r.income > 0 ? Math.max(Math.min(((r.income - r.expense) / r.income) * 100, 100), -100) : 0), [incomeVsExpense])
  const activeSpendMonths = p.last6Months.filter(m => m.total > 0)
  const avgMonthlySpend = activeSpendMonths.length ? activeSpendMonths.reduce((s, m) => s + m.total, 0) / activeSpendMonths.length : 0
  const topCategory = useMemo(() => {
    const cats = (Object.keys(p.categoryTotals) as Category[]).sort((a, b) => (p.categoryTotals[b] || 0) - (p.categoryTotals[a] || 0))
    return cats.length && (p.categoryTotals[cats[0]] || 0) > 0 ? cats[0] : null
  }, [p.categoryTotals])
  const categoryTrends = useMemo(() => {
    const keys = p.last6Months.map(m => m.key)
    const byCat = new Map<Category, number[]>()
    p.expenses.forEach(e => {
      const idx = keys.findIndex(k => inMonth(e.created_at, k))
      if (idx === -1) return
      if (!byCat.has(e.category)) byCat.set(e.category, new Array(keys.length).fill(0))
      byCat.get(e.category)![idx] += e.amount
    })
    return [...byCat.entries()]
      .map(([cat, series]) => ({ cat, series, total: series.reduce((s, v) => s + v, 0) }))
      .sort((a, b) => b.total - a.total).slice(0, 5)
  }, [p.expenses, p.last6Months])

  const monthLabels = p.last6Months.map(m => m.label)

  const greetingSub = p.thisMonthIncomeTot > 0
    ? p.netSavings >= 0
      ? <>You&apos;ve saved <span className="text-emerald-600 font-medium">{p.savingsRatePct.toFixed(0)}%</span> of your income this month. You&apos;re on track.</>
      : <>You&apos;ve spent <span className="text-red-500 font-medium">{fmtFull(Math.abs(p.netSavings))}</span> more than you earned this month.</>
    : <>Here&apos;s what&apos;s happening with your money.</>

  const nav: { key: Section; label: string; icon: React.ReactNode }[] = [
    { key: 'dashboard', label: 'Dashboard',     icon: <LayoutGrid size={17} /> },
    { key: 'expenses',  label: 'Expenses',      icon: <Receipt size={17} /> },
    { key: 'income',    label: 'Income',        icon: <ArrowUpCircle size={17} /> },
    { key: 'bills',     label: 'Bills',         icon: <CreditCard size={17} /> },
    { key: 'budgets',   label: 'Budgets',       icon: <Target size={17} /> },
    { key: 'goals',     label: 'Goals',         icon: <Flag size={17} /> },
    { key: 'shared',    label: 'Splits & Debts',icon: <Users size={17} /> },
    { key: 'reports',   label: 'Reports',       icon: <BarChart2 size={17} /> },
  ]
  const goTo = (s: Section) => { setSection(s); setDrawerOpen(false) }

  const onSearchChange = (v: string) => {
    p.setSearchQuery(v)
    // Search filters the expense/income lists — jump somewhere it's visible
    if (v && !['dashboard', 'expenses', 'income'].includes(section)) setSection('expenses')
  }

  const NavList = () => (
    <nav className="flex flex-col gap-1">
      <p className="px-3 pt-1 pb-2 text-[10px] font-semibold text-gray-600 uppercase tracking-widest">Menu</p>
      {nav.map(item => (
        <button key={item.key} onClick={() => goTo(item.key)}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 ${
            section === item.key ? 'bg-white text-black shadow-sm' : 'text-gray-400 hover:text-white hover:bg-white/10'
          }`}>
          <span className={section === item.key ? 'text-black' : 'text-gray-500'}>{item.icon}</span>
          {item.label}
          {item.key === 'bills' && p.billsDueSoon > 0 && (
            <span className={`ml-auto rounded-full text-[9px] min-w-[16px] h-4 px-1 flex items-center justify-center font-semibold ${
              section === item.key ? 'bg-black text-white' : 'bg-amber-500 text-white'
            }`}>{p.billsDueSoon}</span>
          )}
        </button>
      ))}
    </nav>
  )

  const SidebarFooter = () => (
    <div className="px-3 pb-5 pt-3 border-t border-white/10">
      <button onClick={() => { p.setShowSettings(true); setDrawerOpen(false) }}
        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium text-gray-400 hover:text-white hover:bg-white/10 transition-all">
        <Settings size={17} className="text-gray-500" /> Settings
      </button>
      <div className="flex items-center gap-2.5 px-3 py-2.5 mt-2 bg-white/5 rounded-xl">
        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-gray-300 text-xs font-semibold uppercase">
          {p.fullName ? p.fullName[0] : <User size={14} />}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-white truncate">{p.fullName || 'Account'}</p>
          <p className="text-[10px] text-gray-500 uppercase tracking-wider">Pro plan</p>
        </div>
        <button onClick={p.onLogout} title="Logout" className="text-gray-500 hover:text-red-400 transition-colors"><LogOut size={15} /></button>
      </div>
    </div>
  )

  const allChips: (Category | 'all')[] = ['all', ...(Object.keys(CATEGORY_CONFIG) as Category[])]

  const chipsRow = (
    <div className="flex gap-1.5 overflow-x-auto thin-scrollbar pb-0.5 flex-1 min-w-0" onWheel={scrollHorizontally}>
      {allChips.map(c => {
        const isAll = c === 'all'; const active = p.activeFilter === c; const cfg = isAll ? null : CATEGORY_CONFIG[c as Category]
        return (
          <button key={c} onClick={() => p.setActiveFilter(c)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap border transition-all shrink-0 ${
              active ? 'bg-black text-white border-black' : 'text-gray-500 border-gray-200 hover:border-gray-400 bg-white'
            }`}>
            {!isAll && <span className={active ? 'text-white' : cfg!.text}>{cfg!.icon}</span>}
            {isAll ? 'All' : cfg!.label.split(' ')[0]}
          </button>
        )
      })}
    </div>
  )

  const filterPanel = p.showFilters && (
    <div className="border border-gray-100 rounded-xl p-3.5 mb-3 animate-slide-up bg-gray-50/50">
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <label className="text-[10px] text-gray-400 mb-1 block uppercase tracking-wide">Min amount</label>
          <div className="relative">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400 select-none">Rp</span>
            <input type="text" inputMode="numeric" value={p.minAmount}
              onChange={e => p.setMinAmount(e.target.value.replace(/[^0-9]/g, ''))} placeholder="0"
              className="w-full border border-gray-200 bg-white rounded-lg pl-8 pr-2 py-1.5 text-xs text-black focus:outline-none focus:border-black transition" />
          </div>
        </div>
        <div>
          <label className="text-[10px] text-gray-400 mb-1 block uppercase tracking-wide">Max amount</label>
          <div className="relative">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400 select-none">Rp</span>
            <input type="text" inputMode="numeric" value={p.maxAmount}
              onChange={e => p.setMaxAmount(e.target.value.replace(/[^0-9]/g, ''))} placeholder="∞"
              className="w-full border border-gray-200 bg-white rounded-lg pl-8 pr-2 py-1.5 text-xs text-black focus:outline-none focus:border-black transition" />
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
            <button key={s.val} onClick={() => p.setSortOrder(s.val)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                p.sortOrder === s.val ? 'bg-black text-white border-black' : 'border-gray-200 text-gray-500 hover:border-gray-400 bg-white'
              }`}>
              {s.label}
            </button>
          ))}
        </div>
      </div>
      {(p.minAmount || p.maxAmount || p.sortOrder !== 'date-desc') && (
        <button onClick={() => { p.setMinAmount(''); p.setMaxAmount(''); p.setSortOrder('date-desc') }}
          className="mt-2.5 text-[10px] text-gray-400 hover:text-black transition-colors flex items-center gap-1">
          <X size={10} /> Clear filters
        </button>
      )}
    </div>
  )

  return (
    <div className="min-h-screen bg-[#fafafa] lg:flex">
      {/* ── Sidebar (desktop) ── */}
      <aside className="hidden lg:flex flex-col w-60 shrink-0 bg-[#0a0a0a] sticky top-0 h-screen">
        <div className="px-5 pt-6 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl overflow-hidden shrink-0"><img src="/logo2.png" alt="logo" className="w-full h-full object-cover" /></div>
            <div className="min-w-0">
              <p className="text-white font-semibold tracking-tight">ExpenseFlow</p>
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto no-scrollbar px-3 py-3"><NavList /></div>
        <SidebarFooter />
      </aside>

      {/* ── Mobile drawer ── */}
      {drawerOpen && (
        <div className="lg:hidden fixed inset-0 z-[250] flex" onClick={() => setDrawerOpen(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative bg-[#0a0a0a] w-64 max-w-[80%] h-full flex flex-col shadow-xl animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="px-5 pt-6 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl overflow-hidden shrink-0"><img src="/logo2.png" alt="logo" className="w-full h-full object-cover" /></div>
                <div>
                  <p className="text-white font-semibold tracking-tight">ExpenseFlow</p>
                </div>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto no-scrollbar px-3 py-3"><NavList /></div>
            <SidebarFooter />
          </div>
        </div>
      )}

      {/* ── Main ── */}
      <main className="flex-1 min-w-0 pb-24 lg:pb-8">
        {/* Top bar */}
        <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-gray-100">
          <div className="flex items-center gap-2.5 px-4 sm:px-6 lg:px-8 h-16">
            <button onClick={() => setDrawerOpen(true)} className="lg:hidden text-gray-500 hover:text-black shrink-0"><Menu size={20} /></button>
            <div className="hidden md:flex items-center gap-2 flex-1 max-w-sm bg-gray-50 border border-gray-200 rounded-full px-3.5 py-2 focus-within:border-black focus-within:bg-white transition-all">
              <Search size={14} className="text-gray-400 shrink-0" />
              <input value={p.searchQuery} onChange={e => onSearchChange(e.target.value)} placeholder="Search transactions..."
                className="flex-1 min-w-0 text-sm text-black bg-transparent focus:outline-none placeholder:text-gray-400" />
              {p.searchQuery && <button onClick={() => p.setSearchQuery('')} className="text-gray-400 hover:text-black shrink-0"><X size={13} /></button>}
            </div>
            <div className="flex items-center gap-2 ml-auto">
              <div className="flex items-center gap-1">
                <button onClick={() => canGoPrev && p.setSelectedMonth(p.last6Months[monthIndex - 1].key)} disabled={!canGoPrev}
                  className="hidden sm:flex w-8 h-8 items-center justify-center rounded-lg text-gray-400 hover:text-black hover:bg-gray-100 transition-all disabled:opacity-25 disabled:cursor-not-allowed">
                  <ChevronLeft size={15} />
                </button>
                <MonthPickerDropdown months={p.last6Months} selected={p.selectedMonth} onChange={p.setSelectedMonth} />
                <button onClick={() => canGoNext && p.setSelectedMonth(p.last6Months[monthIndex + 1].key)} disabled={!canGoNext}
                  className="hidden sm:flex w-8 h-8 items-center justify-center rounded-lg text-gray-400 hover:text-black hover:bg-gray-100 transition-all disabled:opacity-25 disabled:cursor-not-allowed">
                  <ChevronRight size={15} />
                </button>
              </div>
              <button onClick={() => p.setShowSimulator(true)} title="Budget simulator"
                className="hidden md:flex items-center gap-1.5 h-9 border border-gray-200 bg-white text-gray-600 hover:text-black hover:border-black text-sm font-medium px-3 rounded-xl transition-all">
                <Calculator size={15} /> <span className="hidden xl:inline">Simulate</span>
              </button>
              <button onClick={() => p.setShowAddIncome(true)}
                className="flex items-center gap-1.5 h-9 border border-emerald-200 bg-white text-emerald-700 hover:border-emerald-600 hover:bg-emerald-50/50 text-sm font-medium px-3 rounded-xl transition-all">
                <ArrowUpCircle size={15} /> <span className="hidden sm:inline">Income</span>
              </button>
              <button onClick={() => p.setShowAddExpense(true)}
                className="flex items-center gap-1.5 h-9 bg-black text-white text-sm font-medium px-3.5 rounded-xl hover:bg-gray-800 transition-all shadow-sm">
                <Plus size={15} /> <span className="hidden sm:inline">New Expense</span>
              </button>
              <button onClick={() => p.setShowSettings(true)}
                className="w-9 h-9 rounded-xl border border-gray-200 bg-white flex items-center justify-center text-gray-500 hover:text-black hover:border-black transition-all shrink-0">
                <Settings size={16} />
              </button>
            </div>
          </div>
          {/* Mobile search row */}
          <div className="md:hidden px-4 pb-3">
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-full px-3.5 py-2 focus-within:border-black focus-within:bg-white transition-all">
              <Search size={14} className="text-gray-400 shrink-0" />
              <input value={p.searchQuery} onChange={e => onSearchChange(e.target.value)} placeholder="Search transactions..."
                className="flex-1 min-w-0 text-sm text-black bg-transparent focus:outline-none placeholder:text-gray-400" />
              {p.searchQuery && <button onClick={() => p.setSearchQuery('')} className="text-gray-400 hover:text-black shrink-0"><X size={13} /></button>}
            </div>
          </div>
        </header>

        <div key={section} className="px-4 sm:px-6 lg:px-8 py-6 max-w-[1400px] mx-auto animate-slide-up">

          {/* ════════════════ DASHBOARD ════════════════ */}
          {section === 'dashboard' && (
            <>
              <div className="mb-6">
                <h1 className="text-2xl sm:text-3xl font-semibold text-black tracking-tight">{greeting}, {p.fullName || 'there'}</h1>
                <p className="text-sm text-gray-500 mt-1.5">{greetingSub}</p>
              </div>

              {/* Row 1: Balance + Monthly Progress */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
                <Card className="lg:col-span-2 p-5 sm:p-6 flex flex-col">
                  <div className="flex items-start justify-between mb-1">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Total balance</p>
                        <button onClick={() => p.setShowTotalBalance(v => !v)} className="text-gray-300 hover:text-black transition-colors"
                          title={p.showTotalBalance ? 'Hide balance' : 'Show balance'}>
                          {p.showTotalBalance ? <EyeOff size={13} /> : <Eye size={13} />}
                        </button>
                      </div>
                      <p className={`text-4xl sm:text-5xl font-bold tracking-tight mt-2 ${p.cumulativeBalance >= 0 ? 'text-black' : 'text-red-600'}`}>
                        {p.showTotalBalance
                          ? fmtFull(Math.abs(p.cumulativeBalance))
                          : <span className="tracking-widest text-gray-200 select-none">••••••••</span>}
                      </p>
                      {p.showTotalBalance && p.cumulativeBalance < 0 && <p className="text-xs text-red-400 mt-1.5">All-time deficit</p>}
                    </div>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-lg shrink-0 ${p.netSavings >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
                      {p.netSavings >= 0 ? '↑' : '↓'} {Math.abs(p.savingsRatePct).toFixed(0)}% saved
                    </span>
                  </div>
                  <div className="flex-1 flex flex-col justify-end my-4 min-h-[120px]">
                    <Sparkline data={p.dailySeries.length ? p.dailySeries : [0, 0]} stroke={GREEN} height={120} format={v => fmtFull(v)} />
                  </div>
                  <div className="mt-auto grid grid-cols-2 sm:grid-cols-4 gap-y-3 pt-4 border-t border-gray-100 sm:divide-x sm:divide-gray-100">
                    {[
                      { l: 'Income', v: fmtFull(p.thisMonthIncomeTot), c: 'text-emerald-700' },
                      { l: 'Expenses', v: fmtFull(p.thisMonthTotal), c: 'text-red-600' },
                      { l: 'Savings', v: fmtFull(Math.max(p.netSavings, 0)), c: 'text-gray-900' },
                      { l: 'Balance', v: fmtFull(p.cumulativeBalance), c: 'text-gray-900' },
                    ].map((s, i) => (
                      <div key={s.l} className={`min-w-0 ${i > 0 ? 'sm:pl-4' : ''}`}>
                        <p className="text-[11px] text-gray-400">{s.l}</p>
                        <p className={`text-sm font-semibold tabular-nums truncate ${s.c}`}>{s.v}</p>
                      </div>
                    ))}
                  </div>
                </Card>

                <Card className="p-5 sm:p-6">
                  <CardLabel right={<span title={`Based on ${p.monthlyProgress.basis === 'budget' ? 'your category budgets' : 'this month\'s income'}`} className="text-gray-300 cursor-help"><Info size={14} /></span>}>
                    Monthly progress
                  </CardLabel>
                  <div className="flex items-center justify-center py-2">
                    <Ring pct={p.monthlyProgress.pct} size={132} stroke={12}
                      color={p.monthlyProgress.pct >= 100 ? RED : p.monthlyProgress.pct >= 80 ? '#d97706' : GREEN}>
                      <span className="text-2xl font-bold leading-none"
                        style={{ color: p.monthlyProgress.pct >= 100 ? RED : p.monthlyProgress.pct >= 80 ? '#d97706' : '#047857' }}>
                        {p.monthlyProgress.pct.toFixed(0)}%
                      </span>
                      <span className="text-[9px] text-gray-400 mt-1 uppercase tracking-wide">of {p.monthlyProgress.basis}</span>
                    </Ring>
                  </div>
                  <div className="flex items-start justify-between gap-2 mt-3">
                    <div className="min-w-0">
                      <p className="text-[11px] text-gray-400">Budget left</p>
                      <p className="text-sm font-semibold text-black tabular-nums truncate">{fmtFull(p.monthlyProgress.left)}</p>
                    </div>
                    <div className="min-w-0 text-right">
                      <p className="text-[11px] text-gray-400">Daily average</p>
                      <p className="text-sm font-semibold text-black tabular-nums truncate">{fmtFull(p.avgPerDay)}</p>
                    </div>
                  </div>
                  <div className="bg-gray-100 rounded-full h-1.5 overflow-hidden mt-3">
                    <div className={`h-full rounded-full transition-all duration-700 ${p.monthlyProgress.pct >= 100 ? 'bg-red-500' : p.monthlyProgress.pct >= 80 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                      style={{ width: `${p.monthlyProgress.pct}%` }} />
                  </div>
                  <p className="text-xs text-gray-400 mt-2">Remaining days: <span className="font-medium text-gray-600">{p.safeToSpendPerDay.isCurrentMonth ? `${p.safeToSpendPerDay.daysLeft} days` : '—'}</span></p>
                  {p.primaryGoal && (() => {
                    const gpct = Math.min((p.primaryGoal.current_amount / p.primaryGoal.target_amount) * 100, 100)
                    return (
                      <div className="mt-4 pt-3 border-t border-gray-100">
                        <div className="flex items-center justify-between mb-1.5 gap-2">
                          <span className="text-xs text-gray-500 truncate">Goal · {p.primaryGoal.title}</span>
                          <span className="text-xs text-gray-400 tabular-nums shrink-0">{gpct.toFixed(0)}%</span>
                        </div>
                        <div className="bg-gray-100 rounded-full h-1.5 overflow-hidden">
                          <div className="h-full bg-black rounded-full transition-all duration-700" style={{ width: `${gpct}%` }} />
                        </div>
                      </div>
                    )
                  })()}
                </Card>
              </div>

              {/* Row 2: Stat cards */}
              <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4 mb-4">
                <div className="stat-card bg-white border border-gray-100 rounded-2xl p-4 flex flex-col">
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Income</p>
                  <p className="text-lg sm:text-xl font-semibold text-black mt-1.5 tabular-nums tracking-tight truncate">{fmtFull(p.thisMonthIncomeTot)}</p>
                  <div className="h-9 mt-auto pt-2"><Sparkline data={p.incomeLast6Months.map(m => m.total)} height={36} stroke={GREEN} labels={monthLabels} format={v => fmtFull(v)} /></div>
                </div>
                <div className="stat-card bg-white border border-gray-100 rounded-2xl p-4 flex flex-col">
                  <div className="flex items-center justify-between gap-1">
                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Expenses</p>
                    {p.lastMonthTotal > 0 && (
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${p.monthOverMonthPct > 0 ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-700'}`}>
                        {p.monthOverMonthPct > 0 ? '↑' : '↓'} {Math.abs(p.monthOverMonthPct).toFixed(0)}%
                      </span>
                    )}
                  </div>
                  <p className="text-lg sm:text-xl font-semibold text-black mt-1.5 tabular-nums tracking-tight truncate">{fmtFull(p.thisMonthTotal)}</p>
                  <div className="h-9 mt-auto pt-2"><Sparkline data={p.last6Months.map(m => m.total)} height={36} stroke={RED} labels={monthLabels} format={v => fmtFull(v)} /></div>
                </div>
                <div className="stat-card bg-white border border-gray-100 rounded-2xl p-4 flex flex-col">
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Spending rate</p>
                  <p className="text-lg sm:text-xl font-semibold text-black mt-1.5 tabular-nums tracking-tight">{p.thisMonthIncomeTot > 0 ? `${p.spendingRate.toFixed(0)}%` : '—'}</p>
                  <div className="mt-auto pt-2">
                    <div className="bg-gray-100 rounded-full h-1.5 overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-700 ${p.spendingRate >= 100 ? 'bg-red-500' : p.spendingRate >= 80 ? 'bg-amber-500' : 'bg-blue-600'}`}
                        style={{ width: `${Math.min(p.spendingRate, 100)}%` }} />
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1.5">{p.thisMonthIncomeTot > 0 ? 'of income used' : 'add income first'}</p>
                  </div>
                </div>
                <div className="stat-card bg-white border border-blue-100 rounded-2xl p-4 relative overflow-hidden flex flex-col">
                  <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide">Safe to spend</p>
                  <p className="text-lg sm:text-xl font-semibold text-black mt-1.5 tabular-nums tracking-tight truncate">
                    {p.safeToSpendPerDay.isCurrentMonth ? <>{fmtFull(p.safeToSpendPerDay.perDay)}<span className="text-xs font-normal text-gray-400">/day</span></> : '—'}
                  </p>
                  <p className="flex items-center gap-1 text-[10px] font-semibold text-blue-600 uppercase tracking-wide mt-auto pt-2">
                    <Timer size={11} /> {p.safeToSpendPerDay.isCurrentMonth ? `${p.safeToSpendPerDay.daysLeft}d left in period` : 'Period ended'}
                  </p>
                </div>
              </div>

              {/* Row 3: Spending chart + Donut */}
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-4">
                <Card className="lg:col-span-3 p-5">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm font-semibold text-black">Spending <span className="text-gray-300 font-normal">·</span> <span className="text-gray-400 font-normal">{p.chartView === 'monthly' ? '6 Months' : 'Weekly'}</span></p>
                    <div className="flex rounded-lg overflow-hidden border border-gray-200">
                      <button onClick={() => p.setChartView('monthly')} className={`px-2.5 py-1 text-xs font-medium transition-all ${p.chartView === 'monthly' ? 'bg-black text-white' : 'text-gray-400 hover:text-black bg-white'}`}>Monthly</button>
                      <button onClick={() => p.setChartView('weekly')} className={`px-2.5 py-1 text-xs font-medium transition-all border-l border-gray-200 ${p.chartView === 'weekly' ? 'bg-black text-white' : 'text-gray-400 hover:text-black bg-white'}`}>Weekly</button>
                    </div>
                  </div>
                  {p.chartView === 'monthly'
                    ? <BarsChart data={p.last6Months} max={p.maxMonthly} selectedKey={p.selectedMonth} onSelectKey={p.setSelectedMonth} height={210} />
                    : <BarsChart data={p.weeklyData} max={p.maxWeekly} height={210} />}
                </Card>
                <Card className="lg:col-span-2 p-5 relative">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm font-semibold text-black">Expenses by Category</p>
                    <button onClick={() => p.setShowAddExpense(true)} title="Add expense"
                      className="w-9 h-9 rounded-full bg-black text-white flex items-center justify-center shadow-lg hover:bg-gray-800 hover:scale-105 active:scale-95 transition-all">
                      <Plus size={16} />
                    </button>
                  </div>
                  {p.thisMonthTotal === 0
                    ? <p className="text-xs text-gray-300 text-center py-12">No data this month</p>
                    : <Donut categoryTotals={p.categoryTotals} total={p.thisMonthTotal} />}
                </Card>
              </div>

              {/* Row 4: Insights column + Recent transactions */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="space-y-4">
                  <Card className="p-5">
                    <CardLabel><Lightbulb size={13} /> Smart insights</CardLabel>
                    <SmartInsightsContent thisMonthTotal={p.thisMonthTotal} lastMonthTotal={p.lastMonthTotal} avgPerDay={p.avgPerDay}
                      categoryTotals={p.categoryTotals} thisMonthIncomeTot={p.thisMonthIncomeTot} netSavings={p.netSavings} budgets={p.budgets} budgetSpend={p.budgetSpend} />
                  </Card>

                  <Card className="p-5">
                    <CardLabel right={
                      <button onClick={() => goTo('bills')} className="text-xs text-gray-400 hover:text-black flex items-center gap-1 transition-colors">View all <ArrowRight size={11} /></button>
                    }><CreditCard size={13} /> Upcoming bills</CardLabel>
                    {upcomingBills.length === 0 ? (
                      <p className="text-xs text-gray-300 text-center py-4">{p.recurring.length === 0 ? 'No bills yet — add rent, subscriptions…' : 'All bills paid — nice! ✓'}</p>
                    ) : (
                      <div className="flex flex-col gap-2">
                        {upcomingBills.map(r => {
                          const daysLeft = Math.ceil((new Date(r.next_due).getTime() - Date.now()) / 86_400_000)
                          const overdue = daysLeft < 0
                          const dueSoon = daysLeft >= 0 && daysLeft <= 3
                          return (
                            <div key={r.id} className="flex items-center gap-2.5 border border-gray-100 rounded-xl px-3 py-2 hover:bg-gray-50 transition-all">
                              <CatIcon category={r.category} size={30} />
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-medium text-gray-900 truncate">{r.title}</p>
                                <p className={`text-[10px] ${overdue ? 'text-red-500 font-medium' : dueSoon ? 'text-amber-600 font-medium' : 'text-gray-400'}`}>
                                  {overdue ? `${Math.abs(daysLeft)}d overdue` : daysLeft === 0 ? 'Due today' : `Due in ${daysLeft}d`}
                                </p>
                              </div>
                              <p className="text-xs font-semibold text-black tabular-nums shrink-0">{fmtFull(r.amount)}</p>
                              <button onClick={() => p.handlePayBill(r)} disabled={p.payingBillId === r.id}
                                className="text-[10px] font-medium px-2 py-1 rounded-lg border border-gray-200 text-gray-600 hover:border-black hover:text-black transition-all disabled:opacity-50 shrink-0">
                                {p.payingBillId === r.id ? '…' : 'Pay'}
                              </button>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </Card>

                  {p.budgets.length > 0 && (
                    <Card className="p-5">
                      <CardLabel right={
                        <button onClick={() => goTo('budgets')} className="text-xs text-gray-400 hover:text-black flex items-center gap-1 transition-colors">View all <ArrowRight size={11} /></button>
                      }><Target size={13} /> Budget tracker</CardLabel>
                      <div className="flex flex-col gap-3">
                        {[...p.budgets]
                          .sort((a, b) => ((p.budgetSpend[b.category] || 0) / b.limit_amount) - ((p.budgetSpend[a.category] || 0) / a.limit_amount))
                          .slice(0, 4).map(b => {
                            const spent = p.budgetSpend[b.category] || 0
                            const pct = Math.min((spent / b.limit_amount) * 100, 100)
                            const over = spent > b.limit_amount
                            const warn = !over && pct >= 80
                            return (
                              <div key={b.id}>
                                <div className="flex justify-between items-center mb-1 gap-2">
                                  <span className="flex items-center gap-1 text-xs text-gray-500 truncate">
                                    {CATEGORY_CONFIG[b.category].label}
                                    {(over || warn) && <AlertTriangle size={11} className={over ? 'text-red-500' : 'text-amber-500'} />}
                                  </span>
                                  <span className={`text-[11px] font-medium tabular-nums shrink-0 ${over ? 'text-red-600' : warn ? 'text-amber-600' : 'text-gray-400'}`}>{pct.toFixed(0)}%</span>
                                </div>
                                <div className="bg-gray-100 rounded-full h-1.5 overflow-hidden">
                                  <div className={`h-full rounded-full transition-all duration-700 ${over ? 'bg-red-500' : warn ? 'bg-amber-500' : 'bg-black'}`} style={{ width: `${pct}%` }} />
                                </div>
                              </div>
                            )
                          })}
                      </div>
                    </Card>
                  )}
                </div>

                <Card className="lg:col-span-2 p-5">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-semibold text-black">Recent transactions</p>
                    <button onClick={() => goTo('expenses')} className="text-xs text-gray-400 hover:text-black flex items-center gap-1 transition-colors">View all <ArrowRight size={11} /></button>
                  </div>
                  <div className="flex gap-1.5 overflow-x-auto thin-scrollbar mb-3 pb-0.5" onWheel={scrollHorizontally}>
                    {allChips.map(c => (
                      <button key={c} onClick={() => p.setActiveFilter(c)}
                        className={`px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all shrink-0 ${p.activeFilter === c ? 'bg-black text-white' : 'bg-gray-100 text-gray-500 hover:text-black'}`}>
                        {c === 'all' ? 'All' : CATEGORY_CONFIG[c as Category].label.split(' ')[0]}
                      </button>
                    ))}
                  </div>
                  {p.filteredExpenses.length === 0 ? (
                    <EmptyState icon={<Wallet size={28} />} title={p.searchQuery ? 'No results found' : 'No transactions yet'}
                      sub={p.searchQuery ? `No matches for "${p.searchQuery}"` : 'Add your first expense to get started'}
                      actionLabel={p.searchQuery ? undefined : 'Add expense'} onAction={() => p.setShowAddExpense(true)} />
                  ) : (
                    <div className="flex flex-col gap-2">
                      {p.filteredExpenses.slice(0, 8).map((e, i) => (
                        <ExpenseRow key={e.id} e={e} i={i} onEdit={() => p.setEditingExpense(e)} onDelete={() => p.setDeletingExpense(e)} />
                      ))}
                      {p.filteredExpenses.length > 8 && (
                        <button onClick={() => goTo('expenses')}
                          className="text-xs text-gray-400 hover:text-black py-2 border border-dashed border-gray-200 rounded-xl hover:border-gray-400 transition-all">
                          Show {p.filteredExpenses.length - 8} more transactions
                        </button>
                      )}
                    </div>
                  )}
                </Card>
              </div>
            </>
          )}

          {/* ════════════════ EXPENSES ════════════════ */}
          {section === 'expenses' && (
            <>
              <SectionHead title="Expenses" sub={`${monthExpenses.length} transaction${monthExpenses.length === 1 ? '' : 's'} · ${monthLabel}`}>
                <button onClick={() => exportCSV(p.expenses, p.income, p.selectedMonth)} className={btnOutline}><Download size={14} /> Export CSV</button>
                <button onClick={() => p.setShowAddExpense(true)} className={btnPrimary}><Plus size={14} /> Add Expense</button>
              </SectionHead>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-4">
                <div className="stat-card bg-white border border-gray-100 rounded-2xl p-4">
                  <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">Total spent</p>
                  <p className="text-lg font-semibold text-black mt-1 tabular-nums truncate">{fmtFull(p.thisMonthTotal)}</p>
                </div>
                <div className="stat-card bg-white border border-gray-100 rounded-2xl p-4">
                  <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">Daily average</p>
                  <p className="text-lg font-semibold text-black mt-1 tabular-nums truncate">{fmtFull(p.avgPerDay)}</p>
                </div>
                <div className="stat-card bg-white border border-gray-100 rounded-2xl p-4">
                  <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">Largest expense</p>
                  {largestExpense
                    ? <p className="text-lg font-semibold text-black mt-1 tabular-nums truncate">{fmtFull(largestExpense.amount)} <span className="text-xs font-normal text-gray-400">· {largestExpense.title}</span></p>
                    : <p className="text-lg font-semibold text-gray-300 mt-1">—</p>}
                </div>
              </div>

              <Card className="p-4 sm:p-5">
                <div className="flex gap-2 mb-3 items-center">
                  {chipsRow}
                  <button onClick={() => p.setShowFilters(v => !v)}
                    className={`relative flex items-center justify-center w-8 h-8 rounded-lg border transition-all shrink-0 ${
                      p.showFilters || activeFilterCount > 0 ? 'bg-black text-white border-black' : 'border-gray-200 text-gray-500 hover:border-gray-400 bg-white'
                    }`}>
                    <SlidersHorizontal size={13} />
                    {activeFilterCount > 0 && !p.showFilters && (
                      <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 text-white rounded-full text-[8px] flex items-center justify-center font-medium">{activeFilterCount}</span>
                    )}
                  </button>
                </div>
                {filterPanel}
                {p.filteredExpenses.length === 0 ? (
                  <EmptyState icon={<Wallet size={28} />}
                    title={filtersActive ? 'No results found' : 'No expenses yet'}
                    sub={filtersActive ? 'Try adjusting your filters or search' : 'Start by adding your first expense'}
                    actionLabel={filtersActive ? undefined : 'Add expense'} onAction={() => p.setShowAddExpense(true)} />
                ) : (
                  <div className="flex flex-col gap-2">
                    {filtersActive && (
                      <p className="text-xs text-gray-400 mb-1">{p.filteredExpenses.length} result{p.filteredExpenses.length !== 1 ? 's' : ''} · {fmtFull(p.filteredExpenses.reduce((s, e) => s + e.amount, 0))}</p>
                    )}
                    {p.filteredExpenses.map((e, i) => (
                      <ExpenseRow key={e.id} e={e} i={i} onEdit={() => p.setEditingExpense(e)} onDelete={() => p.setDeletingExpense(e)} />
                    ))}
                  </div>
                )}
              </Card>
            </>
          )}

          {/* ════════════════ INCOME ════════════════ */}
          {section === 'income' && (
            <>
              <SectionHead title="Income" sub={`${p.thisMonthIncome.length} entr${p.thisMonthIncome.length === 1 ? 'y' : 'ies'} · ${monthLabel}`}>
                <button onClick={() => exportCSV(p.expenses, p.income, p.selectedMonth)} className={btnOutline}><Download size={14} /> Export CSV</button>
                <button onClick={() => p.setShowAddIncome(true)} className="flex items-center gap-1.5 bg-emerald-600 text-white text-sm font-medium px-3.5 py-2 rounded-xl hover:bg-emerald-700 active:scale-[.98] transition-all">
                  <Plus size={14} /> Add Income
                </button>
              </SectionHead>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-4">
                <div className="stat-card bg-white border border-gray-100 rounded-2xl p-4">
                  <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">Total income</p>
                  <p className="text-lg font-semibold text-emerald-700 mt-1 tabular-nums truncate">{fmtFull(p.thisMonthIncomeTot)}</p>
                  <div className="h-8 mt-2"><Sparkline data={p.incomeLast6Months.map(m => m.total)} height={32} stroke={GREEN} labels={monthLabels} format={v => fmtFull(v)} /></div>
                </div>
                <div className="stat-card bg-white border border-gray-100 rounded-2xl p-4">
                  <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">Net savings</p>
                  <p className={`text-lg font-semibold mt-1 tabular-nums truncate ${p.netSavings >= 0 ? 'text-black' : 'text-red-600'}`}>{fmtFull(p.netSavings)}</p>
                  <p className="text-[11px] text-gray-400 mt-1.5">{p.thisMonthIncomeTot > 0 ? `${p.savingsRatePct.toFixed(0)}% of income kept` : 'no income yet'}</p>
                </div>
                <div className="stat-card bg-white border border-gray-100 rounded-2xl p-4">
                  <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">Top source</p>
                  {p.thisMonthIncome.length > 0 ? (() => {
                    const top = [...p.thisMonthIncome].sort((a, b) => b.amount - a.amount)[0]
                    return <p className="text-lg font-semibold text-black mt-1 tabular-nums truncate">{fmtFull(top.amount)} <span className="text-xs font-normal text-gray-400">· {top.title}</span></p>
                  })() : <p className="text-lg font-semibold text-gray-300 mt-1">—</p>}
                </div>
              </div>

              <Card className="p-4 sm:p-5">
                {p.filteredIncome.length === 0 ? (
                  <EmptyState icon={<ArrowUpCircle size={28} />}
                    title={p.searchQuery ? 'No results found' : 'No income yet'}
                    sub={p.searchQuery ? `No matches for "${p.searchQuery}"` : 'Record your salary, freelance work, or other earnings'}
                    actionLabel={p.searchQuery ? undefined : 'Add income'} onAction={() => p.setShowAddIncome(true)} />
                ) : (
                  <div className="flex flex-col gap-2">
                    {p.filteredIncome.map((inc, i) => (
                      <IncomeRow key={inc.id} inc={inc} i={i} onEdit={() => p.setEditingIncome(inc)} onDelete={() => p.handleDeleteIncome(inc.id)} />
                    ))}
                  </div>
                )}
              </Card>
            </>
          )}

          {/* ════════════════ BILLS ════════════════ */}
          {section === 'bills' && (
            <>
              <SectionHead title="Bills & Subscriptions" sub={`${p.recurring.length} recurring bill${p.recurring.length === 1 ? '' : 's'}`}>
                <button onClick={() => p.setShowAddBill(true)} className={btnPrimary}><Plus size={14} /> Add Bill</button>
              </SectionHead>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-4">
                <div className="stat-card bg-white border border-gray-100 rounded-2xl p-4">
                  <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">Monthly commitment</p>
                  <p className="text-lg font-semibold text-black mt-1 tabular-nums truncate">{fmtFull(monthlyCommitment)}</p>
                  <p className="text-[11px] text-gray-400 mt-1.5">approx. per month, all bills</p>
                </div>
                <div className="stat-card bg-white border border-gray-100 rounded-2xl p-4">
                  <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">Due within 7 days</p>
                  <p className={`text-lg font-semibold mt-1 tabular-nums ${p.billsDueSoon > 0 ? 'text-amber-600' : 'text-black'}`}>{p.billsDueSoon}</p>
                  <p className="text-[11px] text-gray-400 mt-1.5">{p.billsDueSoon > 0 ? 'needs your attention' : 'nothing due soon'}</p>
                </div>
                <div className="stat-card bg-white border border-gray-100 rounded-2xl p-4">
                  <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">Paid this month</p>
                  <p className="text-lg font-semibold text-emerald-700 mt-1 tabular-nums">{paidBillsCount} <span className="text-xs font-normal text-gray-400">of {p.recurring.length}</span></p>
                  <p className="text-[11px] text-gray-400 mt-1.5">bills settled</p>
                </div>
              </div>

              <Card className="p-4 sm:p-5">
                {p.recurring.length === 0 ? (
                  <EmptyState icon={<CreditCard size={28} />} title="No bills yet"
                    sub="Add recurring costs like rent, subscriptions, utilities"
                    actionLabel="Add first bill" onAction={() => p.setShowAddBill(true)} />
                ) : (
                  <div className="flex flex-col gap-2">
                    {p.recurring.map((r, i) => (
                      <BillRow key={r.id} r={r} i={i}
                        isPaid={!!p.localPaidBills[r.id]} localExpId={p.localPaidBills[r.id]}
                        paying={p.payingBillId === r.id} deleting={p.deletingBillId === r.id}
                        onPay={() => p.handlePayBill(r)} onUndo={() => p.handleUndoPayBill(r)}
                        onEdit={() => p.setEditingBill(r)} onDelete={() => p.handleDeleteBill(r.id)} />
                    ))}
                  </div>
                )}
              </Card>
            </>
          )}

          {/* ════════════════ BUDGETS ════════════════ */}
          {section === 'budgets' && (
            <>
              <SectionHead title="Budgets" sub={`${p.expensePools.length} budget pool${p.expensePools.length === 1 ? '' : 's'} · ${monthLabel}`}>
                <button onClick={() => p.setShowAddPool(true)} className={btnPrimary}><Plus size={14} /> New Budget</button>
              </SectionHead>

              {p.budgets.length > 0 && (
                <Card className="p-5 mb-4">
                  <CardLabel><Target size={13} /> Category budgets</CardLabel>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
                    {p.budgets.map(b => {
                      const spent = p.budgetSpend[b.category] || 0
                      const pct = Math.min((spent / b.limit_amount) * 100, 100)
                      const over = spent > b.limit_amount
                      const warn = !over && pct >= 80
                      return (
                        <div key={b.id}>
                          <div className="flex justify-between items-center mb-1.5 gap-2">
                            <span className="flex items-center gap-1.5 text-xs text-gray-600 font-medium truncate">
                              {CATEGORY_CONFIG[b.category].label}
                              {over && <AlertTriangle size={11} className="text-red-500" />}
                              {warn && <AlertTriangle size={11} className="text-amber-500" />}
                            </span>
                            <span className={`text-xs font-medium tabular-nums shrink-0 ${over ? 'text-red-600' : warn ? 'text-amber-600' : 'text-gray-500'}`}>
                              {fmtFull(spent)} / {fmtFull(b.limit_amount)}
                            </span>
                          </div>
                          <div className="bg-gray-100 rounded-full h-1.5 overflow-hidden">
                            <div className={`h-full rounded-full transition-all duration-700 ${over ? 'bg-red-500' : warn ? 'bg-amber-500' : 'bg-black'}`} style={{ width: `${pct}%` }} />
                          </div>
                          {over && <p className="text-xs text-red-500 mt-1">Over by {fmtFull(spent - b.limit_amount)}</p>}
                          {warn && <p className="text-xs text-amber-500 mt-1">{pct.toFixed(0)}% used — approaching limit</p>}
                        </div>
                      )
                    })}
                  </div>
                </Card>
              )}

              {p.expensePools.length === 0 ? (
                <Card>
                  <EmptyState icon={<Wallet size={28} />} title="No budget pools yet"
                    sub="Set a monthly budget for a category and log daily usage against it"
                    actionLabel="Create first budget" onAction={() => p.setShowAddPool(true)} />
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
                  {p.poolsThisMonth.map(stats => (
                    <PoolCard key={stats.pool.id} stats={stats} selectedMonth={p.selectedMonth}
                      onOpen={() => p.setOpenPool(stats.pool)} onLog={() => p.setLoggingPool(stats.pool)}
                      onArchive={() => p.handleArchivePool(stats.pool.id)} />
                  ))}
                </div>
              )}
            </>
          )}

          {/* ════════════════ GOALS ════════════════ */}
          {section === 'goals' && (
            <>
              <SectionHead title="Savings Goals"
                sub={p.savingsGoals.length > 0 ? <>Saved <span className="font-medium text-gray-600">{fmtFull(goalsSaved)}</span> of {fmtFull(goalsTarget)} across {p.savingsGoals.length} goal{p.savingsGoals.length === 1 ? '' : 's'}</> : 'Set targets and track your progress'}>
                <button onClick={() => p.setShowAddGoal(true)} className={btnPrimary}><Plus size={14} /> New Goal</button>
              </SectionHead>

              {p.savingsGoals.length > 0 && goalsTarget > 0 && (
                <Card className="p-5 mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Overall progress</p>
                    <span className="text-xs font-semibold text-black tabular-nums">{Math.min((goalsSaved / goalsTarget) * 100, 100).toFixed(0)}%</span>
                  </div>
                  <div className="bg-gray-100 rounded-full h-2.5 overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-green-400 transition-all duration-700" style={{ width: `${Math.min((goalsSaved / goalsTarget) * 100, 100)}%` }} />
                  </div>
                </Card>
              )}

              {p.savingsGoals.length === 0 ? (
                <Card>
                  <EmptyState icon={<PiggyBank size={28} />} title="No savings goals yet"
                    sub="Set a target — a trip, an emergency fund, a new laptop — and watch it grow"
                    actionLabel="Create first goal" onAction={() => p.setShowAddGoal(true)} />
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                  {p.savingsGoals.map(g => <GoalCard key={g.id} goal={g} onOpen={() => p.setOpenGoal(g)} />)}
                  <button onClick={() => p.setShowAddGoal(true)}
                    className="border border-dashed border-gray-200 rounded-xl p-4 min-h-[120px] flex flex-col items-center justify-center gap-2 text-gray-300 hover:text-gray-500 hover:border-gray-400 transition-all">
                    <Plus size={20} />
                    <span className="text-xs font-medium">New goal</span>
                  </button>
                </div>
              )}
            </>
          )}

          {/* ════════════════ SPLITS & DEBTS ════════════════ */}
          {section === 'shared' && (
            <>
              <SectionHead title="Splits & Debts" sub="Shared bills and money owed to you">
                <button onClick={() => p.setShowAddSplitBill(true)} className={btnOutline}><Users size={14} /> New Split</button>
                <button onClick={() => p.setShowAddDebt(true)} className={btnPrimary}><Plus size={14} /> New Debt</button>
              </SectionHead>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4">
                <div className="stat-card bg-white border border-gray-100 rounded-2xl p-4">
                  <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">Owed from split bills</p>
                  <p className="text-lg font-semibold text-black mt-1 tabular-nums truncate">{fmtFull(totalOwedToYou)}</p>
                  <p className="text-[11px] text-gray-400 mt-1.5">{p.splitBillsWithStats.filter(b => !b.settled).length} unsettled split{p.splitBillsWithStats.filter(b => !b.settled).length === 1 ? '' : 's'}</p>
                </div>
                <div className="stat-card bg-white border border-gray-100 rounded-2xl p-4">
                  <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">Outstanding debts</p>
                  <p className="text-lg font-semibold text-black mt-1 tabular-nums truncate">{fmtFull(totalDebtRemaining)}</p>
                  <p className="text-[11px] text-gray-400 mt-1.5">{p.debtsWithStats.filter(d => !d.settled).length} open debt{p.debtsWithStats.filter(d => !d.settled).length === 1 ? '' : 's'}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card className="p-4 sm:p-5">
                  <CardLabel right={
                    <button onClick={() => p.setShowAddSplitBill(true)} className="text-gray-400 hover:text-black transition-colors"><Plus size={15} /></button>
                  }><Users size={13} /> Split bills</CardLabel>
                  {p.splitBillsWithStats.length === 0 ? (
                    <EmptyState icon={<Users size={26} />} title="No split bills yet" sub="Split a dinner or trip and track who has paid you back"
                      actionLabel="Create first split" onAction={() => p.setShowAddSplitBill(true)} />
                  ) : (
                    <div className="flex flex-col gap-2.5">
                      {p.splitBillsWithStats.map(stats => (
                        <SplitCard key={stats.bill.id} stats={stats}
                          onOpen={() => p.setOpenSplitBill(stats.bill)} onDelete={() => p.handleDeleteSplitBill(stats.bill.id)} />
                      ))}
                    </div>
                  )}
                </Card>

                <Card className="p-4 sm:p-5">
                  <CardLabel right={
                    <button onClick={() => p.setShowAddDebt(true)} className="text-gray-400 hover:text-black transition-colors"><Plus size={15} /></button>
                  }><CreditCard size={13} /> Money owed to you</CardLabel>
                  {p.debtsWithStats.length === 0 ? (
                    <EmptyState icon={<CreditCard size={26} />} title="No debts yet" sub="Track money friends or family owe you"
                      actionLabel="Add first debt" onAction={() => p.setShowAddDebt(true)} />
                  ) : (
                    <div className="flex flex-col gap-2.5">
                      {p.debtsWithStats.map(stats => (
                        <DebtCard key={stats.debt.id} stats={stats}
                          onOpen={() => p.setOpenDebt(stats.debt)} onLog={() => p.setLoggingDebt(stats.debt)}
                          onDelete={() => p.handleArchiveDebt(stats.debt.id)} />
                      ))}
                    </div>
                  )}
                </Card>
              </div>
            </>
          )}

          {/* ════════════════ REPORTS ════════════════ */}
          {section === 'reports' && (
            <>
              <SectionHead title="Reports" sub="Your money across the last 6 months">
                <button onClick={() => p.setShowSimulator(true)} className={btnOutline}><Calculator size={14} /> Budget Simulator</button>
                <button onClick={() => exportCSV(p.expenses, p.income, p.selectedMonth)} className={btnOutline}><Download size={14} /> Export CSV</button>
              </SectionHead>

              {/* KPI row */}
              <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4 mb-4">
                <div className="stat-card bg-white border border-gray-100 rounded-2xl p-4">
                  <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">Avg monthly spend</p>
                  <p className="text-base sm:text-lg font-semibold text-black mt-1 tabular-nums truncate">{fmtFull(avgMonthlySpend)}</p>
                  <p className="text-[11px] text-gray-400 mt-1.5">last 6 months</p>
                </div>
                <div className="stat-card bg-white border border-gray-100 rounded-2xl p-4">
                  <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">Savings rate</p>
                  <p className={`text-base sm:text-lg font-semibold mt-1 tabular-nums ${p.savingsRatePct >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                    {p.thisMonthIncomeTot > 0 ? `${p.savingsRatePct.toFixed(0)}%` : '—'}
                  </p>
                  <p className="text-[11px] text-gray-400 mt-1.5">{monthLabel}</p>
                </div>
                <div className="stat-card bg-white border border-gray-100 rounded-2xl p-4">
                  <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">Top category</p>
                  {topCategory ? (
                    <>
                      <p className="text-base sm:text-lg font-semibold text-black mt-1 truncate">{CATEGORY_CONFIG[topCategory].label}</p>
                      <p className="text-[11px] text-gray-400 mt-1.5 tabular-nums">{fmtFull(p.categoryTotals[topCategory] || 0)} this month</p>
                    </>
                  ) : <p className="text-base sm:text-lg font-semibold text-gray-300 mt-1">—</p>}
                </div>
                <div className="stat-card bg-white border border-gray-100 rounded-2xl p-4">
                  <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">vs last month</p>
                  <p className={`text-base sm:text-lg font-semibold mt-1 tabular-nums ${p.monthOverMonthPct > 0 ? 'text-red-600' : 'text-emerald-700'}`}>
                    {p.lastMonthTotal > 0 ? `${p.monthOverMonthPct > 0 ? '+' : ''}${p.monthOverMonthPct.toFixed(0)}%` : '—'}
                  </p>
                  <p className="text-[11px] text-gray-400 mt-1.5">spending change</p>
                </div>
              </div>

              {/* Income vs Expenses + Savings rate */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
                <Card className="lg:col-span-2 p-5">
                  <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                    <p className="text-sm font-semibold text-black">Income vs Expenses</p>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Income</span>
                      <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-gray-900" /> Expenses</span>
                    </div>
                  </div>
                  <GroupedBars rows={incomeVsExpense} height={220} />
                </Card>
                <Card className="p-5">
                  <p className="text-sm font-semibold text-black mb-1">Savings rate trend</p>
                  <p className="text-xs text-gray-400 mb-4">share of income kept each month</p>
                  <div className="h-32">
                    <Sparkline data={savingsRateSeries} height={128} stroke={BLUE} labels={monthLabels} format={v => `${v.toFixed(0)}%`} />
                  </div>
                  <div className="flex justify-between mt-2">
                    {monthLabels.map(l => <span key={l} className="text-[10px] text-gray-400">{l}</span>)}
                  </div>
                  <p className="text-xs text-gray-400 mt-4 pt-3 border-t border-gray-100">
                    This month you&apos;re keeping <span className={`font-semibold ${p.savingsRatePct >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>{p.thisMonthIncomeTot > 0 ? `${p.savingsRatePct.toFixed(0)}%` : '—'}</span> of what you earn.
                  </p>
                </Card>
              </div>

              {/* Category trends + Biggest expenses */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card className="p-5">
                  <p className="text-sm font-semibold text-black mb-1">Category trends</p>
                  <p className="text-xs text-gray-400 mb-4">top categories, monthly spend over 6 months</p>
                  {categoryTrends.length === 0 ? (
                    <p className="text-xs text-gray-300 text-center py-8">No spending recorded yet</p>
                  ) : (
                    <div className="flex flex-col gap-3">
                      {categoryTrends.map(t => (
                        <div key={t.cat} className="flex items-center gap-3">
                          <CatIcon category={t.cat} size={32} />
                          <div className="min-w-0 w-24 sm:w-28 shrink-0">
                            <p className="text-xs font-medium text-gray-900 truncate">{CATEGORY_CONFIG[t.cat].label.split(' ')[0]}</p>
                            <p className="text-[10px] text-gray-400 tabular-nums truncate">{fmtFull(t.total)}</p>
                          </div>
                          <div className="flex-1 h-8">
                            <Sparkline data={t.series} height={32} stroke={CATEGORY_COLOR[t.cat]} labels={monthLabels} format={v => fmtFull(v)} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>

                <Card className="p-5">
                  <p className="text-sm font-semibold text-black mb-1">Biggest expenses</p>
                  <p className="text-xs text-gray-400 mb-4">{monthLabel}</p>
                  {topExpenses.length === 0 ? (
                    <p className="text-xs text-gray-300 text-center py-8">No expenses this month</p>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {topExpenses.map((e, i) => (
                        <div key={e.id} className="flex items-center gap-3 border border-gray-100 rounded-xl px-3 py-2.5 hover:bg-gray-50 transition-all">
                          <span className="text-xs font-semibold text-gray-300 w-4 shrink-0 tabular-nums">{i + 1}</span>
                          <CatIcon category={e.category} size={32} />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-gray-900 truncate">{e.title}</p>
                            <p className="text-[10px] text-gray-400">{fmtDate(e.created_at)} · {CATEGORY_CONFIG[e.category].label}</p>
                          </div>
                          <p className="text-sm font-semibold text-black tabular-nums shrink-0">{fmtFull(e.amount)}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              </div>
            </>
          )}
        </div>

        {/* ── Mobile bottom bar ── */}
        <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-gray-100 flex items-center justify-around px-2 py-2">
          {([
            { key: 'dashboard' as Section, label: 'Home', icon: <LayoutGrid size={19} /> },
            { key: 'expenses' as Section, label: 'Expenses', icon: <Receipt size={19} /> },
          ]).map(t => (
            <button key={t.key} onClick={() => goTo(t.key)}
              className={`flex flex-col items-center gap-0.5 px-2 ${section === t.key ? 'text-black' : 'text-gray-400'}`}>
              {t.icon}<span className="text-[10px]">{t.label}</span>
            </button>
          ))}
          <button onClick={() => p.setShowAddExpense(true)} className="w-12 h-12 -mt-6 rounded-full bg-black text-white flex items-center justify-center shadow-lg active:scale-95 transition-transform"><Plus size={22} /></button>
          {([
            { key: 'bills' as Section, label: 'Bills', icon: <CreditCard size={19} /> },
            { key: 'reports' as Section, label: 'Reports', icon: <BarChart2 size={19} /> },
          ]).map(t => (
            <button key={t.key} onClick={() => goTo(t.key)}
              className={`flex flex-col items-center gap-0.5 px-2 relative ${section === t.key ? 'text-black' : 'text-gray-400'}`}>
              {t.icon}<span className="text-[10px]">{t.label}</span>
              {t.key === 'bills' && p.billsDueSoon > 0 && (
                <span className="absolute -top-1 right-0 w-3.5 h-3.5 bg-amber-500 text-white rounded-full text-[8px] flex items-center justify-center font-semibold">{p.billsDueSoon}</span>
              )}
            </button>
          ))}
        </div>
      </main>
    </div>
  )
}
