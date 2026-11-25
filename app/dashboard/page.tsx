'use client'

import { useEffect, useState, useMemo, useRef, useId } from 'react'
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
  Users, UserPlus, Settings, Bell, LayoutGrid, Lock, LockOpen, CalendarDays,
  BarChart3, PieChart, ShieldCheck, Gauge, Copy, HandCoins, Sun, Moon, HelpCircle, ArrowDown, ArrowUp, FileText, Tag
} from 'lucide-react'

import {
  type Category, type IncomeCategory, type Frequency, type SortOrder,
  type Expense, type Income, type Budget, type BudgetProfile, type SavingsGoal, type GoalHistory,
  type RecurringExpense, type ExpensePool, type ExpensePoolEntry, type ExpensePoolWithStats,
  type SplitBill, type SplitBillParticipant, type SplitBillWithStats, type Debt, type DebtPayment, type DebtWithStats,
  type DaySpend, type DailySpendData, type DowStat, type DailyRecords,
  CATEGORY_CONFIG, CATEGORY_COLOR, INCOME_CONFIG, FREQ_LABELS, MONTHS, MONTHS_SHORT,
  WEEKDAY_LABELS, HEAT_COLORS, SpendingHeatmap, WeekdayBars, SpendingPaceChart,
  fmtFull, fmt, fmtShort, groupId, parseRp, inMonth, currentMonth, daysLeftInMonth,
  getMonthLabelFull, getMonthLabelShort, nextDueDate, localISOString, dateWithCurrentTime,
  exportCSV, scrollHorizontally,
  monthlyEquivalent, pctText, usageTone, savingsTone,
  RowMenu, MonthPickerDropdown, SmartInsightsCard, Sparkline, Ring, CatIcon,
} from './shared'
import ExpertView from './expert'


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
              done ? 'bg-linear-to-r from-emerald-400 to-green-500' :
              pct >= 75 ? 'bg-linear-to-r from-blue-500 to-indigo-500' :
              pct >= 40 ? 'bg-linear-to-r from-amber-400 to-orange-400' :
              'bg-linear-to-r from-rose-400 to-pink-400'
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
function AddExpenseModal({ onClose, onSave, onSaveBatch, pools, pastExpenses, poolEntries }: {
  onClose: () => void; onSave: (data: { title: string; amount: number; category: Category; note: string; date: string }) => Promise<void>
  onSaveBatch: (items: BatchItem[]) => Promise<BatchResult>
  pools: ExpensePool[]; pastExpenses: Expense[]; poolEntries: ExpensePoolEntry[]
}) {
  const [mode, setModeState] = useState<'single' | 'multiple'>(() => {
    try { return localStorage.getItem(ADD_MODE_KEY) === 'multiple' ? 'multiple' : 'single' } catch { return 'single' }
  })
  const setMode = (m: 'single' | 'multiple') => { setModeState(m); try { localStorage.setItem(ADD_MODE_KEY, m) } catch { /* ignore */ } }
  const [title, setTitle]       = useState('')
  const [amount, setAmount]     = useState('')
  const [category, setCategory] = useState<Category>('food')
  const [note, setNote]         = useState('')
  const [date, setDate]         = useState(() => localISOString().slice(0, 10))
  const [saving, setSaving]     = useState(false)

  const handleSave = async () => {
    if (!title.trim() || !amount || parseFloat(amount) <= 0) return
    setSaving(true); await onSave({ title: title.trim(), amount: parseFloat(amount), category, note: note.trim(), date }); setSaving(false)
  }

  if (mode === 'multiple') return (
    <BatchExpenseEditor onClose={onClose} onSave={onSaveBatch} pools={pools} pastExpenses={pastExpenses} poolEntries={poolEntries}
      modeSwitch={<ExpenseModeSwitch mode={mode} onChange={setMode} />} />
  )

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/30 px-4 pb-4 sm:pb-0">
      <div className="bg-white rounded-2xl w-full max-w-sm p-5 shadow-xl max-h-[90vh] overflow-y-auto animate-slide-up" onKeyDown={e => e.key === 'Escape' && onClose()}>
        <div className="flex justify-between items-center mb-5">
          <div><h2 className="text-base font-medium text-black">Add expense</h2><p className="text-xs text-gray-400 mt-0.5">Record a new expense</p></div>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-black transition-all"><X size={16} /></button>
        </div>
        <ExpenseModeSwitch mode={mode} onChange={setMode} />
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
            <label className="text-xs text-gray-400 mb-1 block">Date</label>
            <input type="date" value={date} max={localISOString().slice(0, 10)} onChange={e => setDate(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-black focus:outline-none focus:border-black transition" />
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

// ─── Add Expense: Single | Multiple ──────────────────────────────────────────
type BatchItem = { title: string; amount: number; category: Category; date: string; poolId: string }
type BatchResult = { ok: boolean; message?: string; warning?: string }
type BatchRow = { id: string; date: string; title: string; category: Category; amount: string; poolId: string }

const ADD_MODE_KEY   = 'ef-add-expense-mode'
const BATCH_DRAFT_KEY = 'ef-batch-expense-draft'
const newRowId = () => Math.random().toString(36).slice(2, 10)
const emptyRow = (date: string): BatchRow => ({ id: newRowId(), date, title: '', category: 'food', amount: '', poolId: '' })

function ExpenseModeSwitch({ mode, onChange }: { mode: 'single' | 'multiple'; onChange: (m: 'single' | 'multiple') => void }) {
  return (
    <div className="grid grid-cols-2 bg-gray-100 rounded-full p-1 mb-4" role="tablist" aria-label="Entry mode">
      {(['single', 'multiple'] as const).map(m => (
        <button key={m} type="button" role="tab" aria-selected={mode === m} onClick={() => onChange(m)}
          className={`py-1.5 rounded-full text-xs font-semibold transition-all ${mode === m ? 'bg-black text-white shadow-sm' : 'text-gray-500 hover:text-black'}`}>
          {m === 'single' ? 'Single' : 'Multiple'}
        </button>
      ))}
    </div>
  )
}

function BatchExpenseEditor({ onClose, onSave, pools, pastExpenses, poolEntries, modeSwitch }: {
  onClose: () => void
  onSave: (items: BatchItem[]) => Promise<BatchResult>
  pools: ExpensePool[]
  pastExpenses: Expense[]
  poolEntries: ExpensePoolEntry[]
  modeSwitch: React.ReactNode
}) {
  const today = localISOString().slice(0, 10)
  const [rows, setRows] = useState<BatchRow[]>(() => {
    try {
      const raw = localStorage.getItem(BATCH_DRAFT_KEY)
      const parsed = raw ? JSON.parse(raw) : null
      if (Array.isArray(parsed) && parsed.length > 0 && parsed.every(r => r && typeof r.id === 'string' && typeof r.date === 'string')) {
        // A linked budget decides the category; drop links to budgets that no longer exist
        return (parsed as BatchRow[]).map(r => {
          if (!r.poolId) return r
          const pool = pools.find(p => p.id === r.poolId)
          return pool ? { ...r, category: pool.category } : { ...r, poolId: '' }
        })
      }
    } catch { /* storage unavailable — start fresh */ }
    return [emptyRow(today), emptyRow(today), emptyRow(today)]
  })
  const [activeId, setActiveId] = useState<string>(() => rows[0]?.id ?? '')
  const [showErrors, setShowErrors] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [focusId, setFocusId] = useState<string | null>(null)
  const descRefs = useRef<Record<string, HTMLInputElement | null>>({})
  const listId = useId()

  // Keep an unsent draft so closing by accident never loses the week's entries
  useEffect(() => {
    try {
      const hasContent = rows.some(r => r.title.trim() || r.amount)
      if (hasContent) localStorage.setItem(BATCH_DRAFT_KEY, JSON.stringify(rows))
      else localStorage.removeItem(BATCH_DRAFT_KEY)
    } catch { /* ignore */ }
  }, [rows])

  useEffect(() => {
    if (!focusId) return
    descRefs.current[focusId]?.focus()
    setFocusId(null)
  }, [focusId, rows])

  // Smart suggestions: newest use of each title → its category and (if any) budget
  const suggestions = useMemo(() => {
    const poolByExpense = new Map<string, string>()
    poolEntries.forEach(e => { if (e.expense_id) poolByExpense.set(e.expense_id, e.pool_id) })
    const livePools = new Set(pools.map(p => p.id))
    const map = new Map<string, { title: string; category: Category; poolId: string }>()
    const sorted = [...pastExpenses].sort((a, b) => b.created_at.localeCompare(a.created_at))
    sorted.forEach(e => {
      const key = e.title.trim().toLowerCase()
      if (!key || map.has(key)) return
      const pid = poolByExpense.get(e.id) ?? ''
      map.set(key, { title: e.title.trim(), category: e.category, poolId: livePools.has(pid) ? pid : '' })
    })
    return map
  }, [pastExpenses, poolEntries, pools])
  const suggestionList = useMemo(() => Array.from(suggestions.values()).slice(0, 200), [suggestions])

  // This week's days (Mon–Sun), for one-tap dates
  const weekDays = useMemo(() => {
    const now = new Date()
    const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - ((now.getDay() + 6) % 7))
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i)
      const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      return { iso, label: WEEKDAY_LABELS[i], day: d.getDate(), future: iso > today }
    })
  }, [today])

  const update = (id: string, patch: Partial<BatchRow>) => setRows(prev => prev.map(r => r.id === id ? { ...r, ...patch } : r))
  // Side effects (active row / focus) stay outside the state updater so React
  // StrictMode's double-invoked updaters can't desync them.
  const addRow = (afterId?: string) => {
    const idx = afterId ? rows.findIndex(r => r.id === afterId) : rows.length - 1
    const base = rows[idx] ?? rows[rows.length - 1]
    const row = emptyRow(base?.date ?? today)
    const next = [...rows]; next.splice(idx + 1, 0, row)
    setRows(next); setActiveId(row.id); setFocusId(row.id)
  }
  const duplicateRow = (id: string) => {
    const idx = rows.findIndex(r => r.id === id); if (idx < 0) return
    const copy = { ...rows[idx], id: newRowId() }
    const next = [...rows]; next.splice(idx + 1, 0, copy)
    setRows(next); setActiveId(copy.id)
  }
  const removeRow = (id: string) => {
    if (rows.length === 1) { const fresh = emptyRow(rows[0].date); setRows([fresh]); setActiveId(fresh.id); return }
    const idx = rows.findIndex(r => r.id === id)
    const next = rows.filter(r => r.id !== id)
    const target = next[Math.max(0, idx - 1)]
    setRows(next)
    if (target) { setActiveId(target.id); setFocusId(target.id) }
  }
  // A linked budget always decides the category, so the two can never disagree.
  const poolCategory = (poolId: string) => pools.find(p => p.id === poolId)?.category
  const onTitle = (row: BatchRow, value: string) => {
    const hit = suggestions.get(value.trim().toLowerCase())
    if (!hit || row.poolId) { update(row.id, { title: value }); return }   // already linked: keep its category
    const fromPool = hit.poolId ? poolCategory(hit.poolId) : undefined
    update(row.id, { title: value, poolId: hit.poolId, category: fromPool ?? hit.category })
  }
  const onBudget = (row: BatchRow, poolId: string) => {
    const cat = poolId ? poolCategory(poolId) : undefined
    update(row.id, cat ? { poolId, category: cat } : { poolId })          // "No budget" keeps the current category
  }
  const clearAll = () => { const fresh = [emptyRow(today), emptyRow(today), emptyRow(today)]; setRows(fresh); setActiveId(fresh[0].id); setShowErrors(false); setError(null) }

  const isEmpty   = (r: BatchRow) => !r.title.trim() && !r.amount
  // A budget-linked row names itself after the budget (same as + Log), so its description is optional
  const isLinked  = (r: BatchRow) => !!r.poolId && pools.some(p => p.id === r.poolId)
  const isValid   = (r: BatchRow) => (!!r.title.trim() || isLinked(r)) && parseRp(r.amount) > 0 && !!r.date
  const valid     = rows.filter(isValid)
  const partial   = rows.filter(r => !isEmpty(r) && !isValid(r))
  const total     = valid.reduce((s, r) => s + parseRp(r.amount), 0)
  const byCat = useMemo(() => {
    const m = new Map<Category, number>()
    rows.filter(isValid).forEach(r => m.set(r.category, (m.get(r.category) ?? 0) + parseRp(r.amount)))
    return Array.from(m.entries()).sort((a, b) => b[1] - a[1]).slice(0, 3)
  }, [rows])

  const handleSave = async () => {
    setError(null)
    if (partial.length > 0) {
      setShowErrors(true)
      setError(`${partial.length} ${partial.length === 1 ? 'row is' : 'rows are'} missing a description or amount.`)
      return
    }
    if (valid.length === 0) return
    setSaving(true)
    const res = await onSave(valid.map(r => ({ title: r.title.trim(), amount: parseRp(r.amount), category: r.category, date: r.date, poolId: r.poolId })))
    setSaving(false)
    if (!res.ok) { setError(res.message ?? 'Could not save. Please try again.'); return }
    try { localStorage.removeItem(BATCH_DRAFT_KEY) } catch { /* ignore */ }
    if (res.warning) { clearAll(); setNotice(res.warning); return }
    onClose()
  }

  const yesterday = (() => { const d = new Date(); d.setDate(d.getDate() - 1); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` })()
  const dateLabel = (iso: string) => {
    if (!iso) return 'Pick date'
    if (iso === today) return 'Today'
    if (iso === yesterday) return 'Yesterday'
    return new Date(`${iso}T00:00:00`).toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' })
  }
  // How many filled rows sit on each day — shown as dots on the week strip
  const rowsPerDay = rows.reduce<Record<string, number>>((m, r) => { if (!isEmpty(r)) m[r.date] = (m[r.date] ?? 0) + 1; return m }, {})
  const openPicker = (e: React.MouseEvent<HTMLInputElement>) => { try { e.currentTarget.showPicker?.() } catch { /* not supported */ } }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/30 sm:px-4">
      <div className="bg-white w-full sm:max-w-2xl rounded-t-3xl sm:rounded-2xl shadow-xl h-[92vh] sm:h-auto sm:max-h-[88vh] flex flex-col animate-slide-up"
        onKeyDown={e => e.key === 'Escape' && onClose()}>
        {/* Grabber (mobile sheet) */}
        <div className="sm:hidden flex justify-center pt-2.5"><span className="w-10 h-1 rounded-full bg-gray-200" /></div>

        {/* Header */}
        <div className="px-5 pt-3 sm:pt-5">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-base font-semibold text-black tracking-tight">Add expenses</h2>
              <p className="text-xs text-gray-400 mt-0.5">Log the whole week in one go</p>
            </div>
            <button onClick={onClose} title="Close" className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-black transition-all"><X size={16} /></button>
          </div>
          <div className="sm:max-w-65">{modeSwitch}</div>

          {/* This week — sets the date of the selected row */}
          <div className="flex items-center justify-between gap-2 mb-2">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">This week</p>
            <p className="text-[10px] text-gray-400">Tap a day for the selected row</p>
          </div>
          <div className="grid grid-cols-7 gap-1 sm:gap-1.5 pb-4 border-b border-gray-100">
            {weekDays.map(d => {
              const activeRow = rows.find(r => r.id === activeId)
              const selected = activeRow?.date === d.iso
              const count = rowsPerDay[d.iso] ?? 0
              return (
                <button key={d.iso} type="button" disabled={d.future || !activeRow}
                  onClick={() => activeRow && update(activeRow.id, { date: d.iso })}
                  className={`relative flex flex-col items-center gap-0.5 py-2 rounded-2xl transition-all disabled:opacity-25 disabled:cursor-not-allowed ${
                    selected ? 'bg-black text-white shadow-sm' : 'bg-gray-50 text-gray-700 hover:bg-gray-100'}`}>
                  <span className={`text-[10px] ${selected ? 'text-white/60' : 'text-gray-400'}`}>{d.label}</span>
                  <span className="text-sm font-semibold tabular-nums leading-none">{d.day}</span>
                  <span className="flex gap-0.5 h-1 mt-0.5">
                    {Array.from({ length: Math.min(count, 3) }).map((_, i) => (
                      <span key={i} className={`w-1 h-1 rounded-full ${selected ? 'bg-white' : 'bg-emerald-500'}`} />
                    ))}
                  </span>
                  {d.iso === today && !selected && <span className="absolute top-1 right-1.5 w-1 h-1 rounded-full bg-black" aria-label="Today" />}
                </button>
              )
            })}
          </div>
        </div>

        {/* Rows */}
        <div className="px-3 sm:px-5 overflow-y-auto flex-1 min-h-0 pt-3">
          <datalist id={listId}>
            {suggestionList.map(s => <option key={s.title} value={s.title} />)}
          </datalist>
          <div className="flex flex-col gap-2">
            {rows.map((r, idx) => {
              const cfg = CATEGORY_CONFIG[r.category]
              const bad = showErrors && !isEmpty(r) && !isValid(r)
              const active = r.id === activeId
              const suggested = pools.filter(p => p.category === r.category)
              const others = pools.filter(p => p.category !== r.category)
              const linked = pools.find(p => p.id === r.poolId)
              return (
                <div key={r.id} onFocusCapture={() => setActiveId(r.id)} onClick={() => setActiveId(r.id)}
                  className={`rounded-2xl border px-3.5 py-3 transition-all ${
                    bad ? 'border-red-200 bg-red-50/40'
                    : active ? 'border-gray-200 bg-white shadow-[0_6px_20px_-12px_rgba(16,24,40,0.25)]'
                    : 'border-gray-100 bg-gray-50/50 hover:bg-gray-50'}`}>
                  {/* Line 1 — what + how much */}
                  <div className="flex items-center gap-3">
                    <span className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${cfg.bg} ${cfg.text}`}>{cfg.icon}</span>
                    <input ref={el => { descRefs.current[r.id] = el }} value={r.title} list={listId}
                      placeholder={linked ? `${linked.title} · add a note (optional)` : bad && !r.title.trim() ? 'Add a description' : 'What did you spend on?'}
                      aria-label={`Row ${idx + 1} description`}
                      onChange={e => onTitle(r, e.target.value)}
                      onKeyDown={e => { if (e.key === 'Backspace' && isEmpty(r) && rows.length > 1) { e.preventDefault(); removeRow(r.id) } }}
                      className={`flex-1 min-w-0 bg-transparent text-sm font-medium text-black focus:outline-none ${bad && !r.title.trim() ? 'placeholder:text-red-400' : 'placeholder:text-gray-400'}`} />
                    <div className="flex items-baseline gap-1 shrink-0">
                      <span className="text-[11px] text-gray-400">Rp</span>
                      <input type="text" inputMode="numeric" value={r.amount} placeholder="0" aria-label={`Row ${idx + 1} amount`}
                        onChange={e => { const n = parseRp(e.target.value); update(r.id, { amount: n ? groupId(n) : '' }) }}
                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addRow(r.id) } }}
                        className={`w-24 sm:w-28 bg-transparent text-right text-base font-semibold tabular-nums text-black focus:outline-none ${bad && parseRp(r.amount) <= 0 ? 'placeholder:text-red-400' : 'placeholder:text-gray-300'}`} />
                    </div>
                  </div>

                  {/* Line 2 — date, category, budget, actions */}
                  <div className="flex items-center gap-1.5 mt-2.5 pl-12 flex-wrap">
                    {/* Date pill */}
                    <label className="relative inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full bg-white border border-gray-200 text-[11px] font-medium text-gray-700 cursor-pointer hover:border-gray-400 transition-colors">
                      <Calendar size={11} className="text-gray-400" />
                      {dateLabel(r.date)}
                      <input type="date" value={r.date} max={today} aria-label={`Row ${idx + 1} date`}
                        onClick={openPicker} onChange={e => e.target.value && update(r.id, { date: e.target.value })}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full" />
                    </label>
                    {/* Category pill — locked while a budget is linked (the budget decides it) */}
                    {linked ? (
                      <span title={`Set by the ${linked.title} budget`} aria-label={`Category ${CATEGORY_CONFIG[r.category].label}, set by the ${linked.title} budget`}
                        className={`inline-flex items-center gap-1 h-7 pl-2.5 pr-2 rounded-full text-[11px] font-medium cursor-default ${cfg.bg} ${cfg.text}`}>
                        {CATEGORY_CONFIG[r.category].label.split(' ')[0]}
                        <Lock size={9} className="opacity-60" />
                      </span>
                    ) : (
                      <label className={`relative inline-flex items-center gap-1 h-7 pl-2.5 pr-2 rounded-full text-[11px] font-medium cursor-pointer ${cfg.bg} ${cfg.text}`}>
                        {CATEGORY_CONFIG[r.category].label.split(' ')[0]}
                        <ChevronDown size={11} className="opacity-60" />
                        <select value={r.category} aria-label={`Row ${idx + 1} category`}
                          onChange={e => update(r.id, { category: e.target.value as Category })}
                          className="absolute inset-0 opacity-0 cursor-pointer w-full">
                          {(Object.keys(CATEGORY_CONFIG) as Category[]).map(c => <option key={c} value={c}>{CATEGORY_CONFIG[c].label}</option>)}
                        </select>
                      </label>
                    )}
                    {/* Budget pill */}
                    {pools.length > 0 && (
                      <label className={`relative inline-flex items-center gap-1 h-7 px-2.5 rounded-full text-[11px] font-medium cursor-pointer max-w-42.5 transition-colors ${
                        linked ? 'bg-amber-50 text-amber-800 border border-amber-200' : 'border border-dashed border-gray-300 text-gray-500 hover:border-gray-400'}`}>
                        {linked ? <Lock size={10} className="shrink-0" /> : <Plus size={11} className="shrink-0" />}
                        <span className="truncate">{linked ? linked.title : 'Budget'}</span>
                        <select value={r.poolId} aria-label={`Row ${idx + 1} budget`}
                          onChange={e => onBudget(r, e.target.value)}
                          className="absolute inset-0 opacity-0 cursor-pointer w-full">
                          <option value="">No budget</option>
                          {suggested.map(p => <option key={p.id} value={p.id}>{p.title} (suggested)</option>)}
                          {others.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                        </select>
                      </label>
                    )}
                    <div className="ml-auto flex items-center">
                      <button type="button" onClick={e => { e.stopPropagation(); duplicateRow(r.id) }} title="Duplicate row"
                        className="w-7 h-7 flex items-center justify-center rounded-full text-gray-400 hover:text-black hover:bg-gray-100 transition-all"><Copy size={12} /></button>
                      <button type="button" onClick={e => { e.stopPropagation(); removeRow(r.id) }} title="Remove row"
                        className="w-7 h-7 flex items-center justify-center rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"><Trash2 size={12} /></button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="flex items-center justify-between gap-2 py-3">
            <button type="button" onClick={() => addRow()}
              className="flex items-center gap-1.5 h-9 px-4 rounded-full bg-gray-100 text-xs font-semibold text-black hover:bg-gray-200 transition-all">
              <Plus size={14} /> Add row
            </button>
            <div className="flex items-center gap-3">
              <span className="hidden sm:inline text-[10px] text-gray-400">Enter in amount = new row</span>
              <button type="button" onClick={clearAll} className="text-[11px] text-gray-400 hover:text-red-500 transition-colors">Clear all</button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 px-5 pt-3 pb-4 sm:pb-3.5 bg-white rounded-b-2xl">
          {error && <p className="text-xs text-red-600 mb-2.5 flex items-center gap-1.5"><AlertTriangle size={12} /> {error}</p>}
          {notice && <p className="text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2 mb-2.5">{notice}</p>}
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">{valid.length} {valid.length === 1 ? 'expense' : 'expenses'}</p>
              <p className="text-lg font-semibold text-black tabular-nums leading-tight truncate">{fmt(total)}</p>
              {byCat.length > 0 && (
                <div className="hidden sm:flex items-center gap-1.5 mt-1">
                  {byCat.map(([c, v]) => (
                    <span key={c} className={`text-[10px] px-2 py-0.5 rounded-full ${CATEGORY_CONFIG[c].bg} ${CATEGORY_CONFIG[c].text}`}>
                      {CATEGORY_CONFIG[c].label.split(' ')[0]} {fmt(v)}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button onClick={onClose} className="hidden sm:inline-flex h-10 px-4 items-center rounded-full border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition">{notice ? 'Done' : 'Cancel'}</button>
              <button onClick={handleSave} disabled={saving || valid.length === 0}
                className="h-10 px-5 rounded-full bg-black text-white text-sm font-semibold hover:bg-gray-800 active:scale-[.98] transition-all disabled:opacity-40 flex items-center justify-center gap-2">
                {saving
                  ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  : <><Check size={15} /> Save {valid.length > 0 ? valid.length : ''}</>}
              </button>
            </div>
          </div>
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
  const [date, setDate]         = useState(() => expense.created_at.slice(0, 10))
  const [saving, setSaving]     = useState(false)

  const handleSave = async () => {
    if (!title.trim() || !amount) return
    setSaving(true)
    const updated: Partial<Expense> = { title: title.trim(), amount: parseFloat(amount), category, note: note.trim() }
    if (date !== expense.created_at.slice(0, 10)) updated.created_at = dateWithCurrentTime(date)
    await onSave(updated)
    setSaving(false)
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
            <label className="text-xs text-gray-400 mb-1 block">Date</label>
            <input type="date" value={date} max={localISOString().slice(0, 10)} onChange={e => setDate(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-black focus:outline-none focus:border-black transition" />
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


// ─── Add Pool Modal ───────────────────────────────────────────────────────────
function AddPoolModal({ onClose, onSave }: {
  onClose: () => void
  onSave: (data: { title: string; budget_amount: number; category: Category; note: string; is_reserved: boolean }) => Promise<void>
}) {
  const [isReserved, setIsReserved] = useState(true)
  const [title, setTitle]         = useState('')
  const [amount, setAmount]       = useState('')
  const [category, setCategory]   = useState<Category>('transport')
  const [note, setNote]           = useState('')
  const [saving, setSaving]       = useState(false)

  const handleSave = async () => {
    if (!title.trim() || !amount || parseFloat(amount) <= 0) return
    setSaving(true); await onSave({ title: title.trim(), budget_amount: parseFloat(amount), category, note: note.trim(), is_reserved: isReserved }); setSaving(false)
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
          <button type="button" role="switch" aria-checked={isReserved} onClick={() => setIsReserved(v => !v)}
            className="w-full flex items-center justify-between gap-3 rounded-xl border border-gray-200 px-3 py-2.5 text-left hover:border-gray-300 transition">
            <span className="min-w-0">
              <span className="flex items-center gap-1.5 text-sm text-black"><Lock size={12} className="text-amber-500" /> Reserve this money</span>
              <span className="block text-[11px] text-gray-400 mt-0.5">{isReserved ? 'Unspent budget is set aside, so it is not counted as free money' : 'Flexible: unspent budget stays in your free money'}</span>
            </span>
            <span className={`relative w-9 h-5 rounded-full shrink-0 transition-colors ${isReserved ? 'bg-black' : 'bg-gray-200'}`}>
              <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${isReserved ? 'translate-x-4' : ''}`} />
            </span>
          </button>
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
          {remaining >= 0 ? `${fmt(remaining)} remaining` : `${fmt(Math.abs(remaining))} over budget`}
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
              <p className="text-xs text-gray-500">After logging: <span className={`font-medium ${afterRemaining < 0 ? 'text-red-600' : 'text-black'}`}>{fmt(Math.abs(afterRemaining))} {afterRemaining < 0 ? 'over budget' : 'remaining'}</span></p>
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
  const days = daysLeftInMonth(selectedMonth)

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
            <p className="text-xs text-gray-400 mt-0.5">{fmt(spent)} of {fmt(pool.budget_amount)} used · {getMonthLabelFull(selectedMonth)}</p>
          </div>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-black transition-all shrink-0"><X size={16} /></button>
        </div>
        <div className="px-5 pt-3 pb-0">
          <div className="bg-gray-100 rounded-full h-2.5 overflow-hidden mb-1">
            <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: over ? '#ef4444' : warn ? '#f59e0b' : CATEGORY_COLOR[pool.category] }} />
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className={`text-xs shrink-0 ${over ? 'text-red-500' : warn ? 'text-amber-500' : 'text-gray-400'}`}>{pct.toFixed(0)}% used</span>
            {over ? <span className="text-xs text-red-500 font-medium text-right">Over by {fmt(spent - pool.budget_amount)}</span>
                  : <span className="text-xs text-gray-400 text-right">{fmt(remaining)} remaining</span>}
          </div>
          {days !== null && <p className="text-[10px] text-gray-300 mt-0.5 text-right">{days}d left in the month</p>}
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
                  <p className="text-sm font-semibold text-black">{fmt(pool.budget_amount)}</p>
                  <p className="text-[10px] text-gray-400">per month</p>
                </div>
                <div className={`rounded-xl px-3 py-2.5 ${over ? 'bg-red-50' : 'bg-gray-50'}`}>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">Remaining</p>
                  <p className={`text-sm font-semibold ${over ? 'text-red-600' : 'text-black'}`}>{fmt(Math.abs(remaining))}</p>
                  <p className={`text-[10px] ${over ? 'text-red-400' : 'text-gray-400'}`}>{over ? 'over budget' : 'left'}</p>
                </div>
              </div>
              <div className="bg-gray-50 rounded-xl px-3 py-2.5 flex justify-between items-center">
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">Total used</p>
                  <p className="text-sm font-semibold text-black">{fmt(spent)}</p>
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
              {spent === 0 && <p className="text-xs text-gray-400 italic">You haven't logged anything for this budget yet.</p>}
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

// ─── Day Detail Modal ─────────────────────────────────────────────────────────
function DayDetailModal({
  day, monthKey, dayData, dayExpenses, dayIncome, avgPerDay, maxDay, rank,
  spentDayCount, elapsedDays, onClose, onStepDay, canPrev, canNext, onEditExpense, onDeleteExpense,
}: {
  day: number; monthKey: string; dayData: DaySpend
  dayExpenses: Expense[]; dayIncome: Income[]
  avgPerDay: number; maxDay: number; rank: number | null
  spentDayCount: number; elapsedDays: number
  onClose: () => void; onStepDay: (delta: 1 | -1) => void
  canPrev: boolean; canNext: boolean
  onEditExpense: (e: Expense) => void; onDeleteExpense: (e: Expense) => void
}) {
  const [yr, mo] = monthKey.split('-').map(Number)
  // Construct locally — never parse a date string.
  const fullDate = new Date(yr, mo - 1, day).toLocaleDateString('en-US', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
  const total = dayData.total
  const diffPct = avgPerDay > 0 ? ((total - avgPerDay) / avgPerDay) * 100 : 0
  const incomeTot = dayIncome.reduce((s, i) => s + i.amount, 0)

  const catTotals: Partial<Record<Category, number>> = {}
  dayExpenses.forEach(e => { catTotals[e.category] = (catTotals[e.category] || 0) + e.amount })
  const catSlices = (Object.keys(catTotals) as Category[])
    .map(cat => ({ cat, spent: catTotals[cat] || 0 }))
    .sort((a, b) => b.spent - a.spent)

  const ordinal = (n: number) => {
    const s = ['th', 'st', 'nd', 'rd'], v = n % 100
    return n + (s[(v - 20) % 10] || s[v] || s[0])
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/30 px-4 pb-4 sm:pb-0">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl max-h-[88vh] flex flex-col animate-slide-up">
        <div className="flex items-start justify-between p-5 pb-3 border-b border-gray-100">
          <div className="flex-1 min-w-0 mr-3">
            <p className="text-base font-medium text-black truncate">{fullDate}</p>
            <p className="text-xs text-gray-400 mt-0.5">
              {dayExpenses.length === 0 ? 'No transactions' : `${dayExpenses.length} ${dayExpenses.length === 1 ? 'transaction' : 'transactions'}`}
              {dayData.isToday && ' · Today'}
            </p>
          </div>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-black transition-all shrink-0"><X size={16} /></button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 pb-5 pt-4">
          {total === 0 ? (
            <div className="text-center py-8">
              <PiggyBank size={28} className="mx-auto mb-2 text-gray-200" />
              <p className="text-sm text-gray-400">No spending on this day</p>
              {incomeTot > 0 && <p className="text-xs text-emerald-600 mt-2">Received {fmt(incomeTot)}</p>}
            </div>
          ) : (<>
            <div className="flex items-end justify-between gap-2 mb-3">
              <p className="text-2xl font-semibold text-black">{fmt(total)}</p>
              {avgPerDay > 0 && (
                <span className="text-[11px] px-2 py-1 rounded-full font-medium bg-gray-100 text-gray-600 shrink-0">
                  {Math.abs(diffPct) < 5 ? 'Right on your daily average'
                    : `${pctText(Math.abs(diffPct))} ${diffPct > 0 ? 'above' : 'below'} average`}
                </span>
              )}
            </div>

            <div className="bg-gray-100 rounded-full h-1.5 overflow-hidden mb-1.5">
              <div className="h-full rounded-full bg-black bar-fill" style={{ width: `${maxDay > 0 ? Math.min((total / maxDay) * 100, 100) : 0}%` }} />
            </div>
            <p className="text-[10px] text-gray-400 mb-4">
              Highest day this month: {fmt(maxDay)}
              {rank !== null && spentDayCount >= 3 && <> · {ordinal(rank)} highest of {spentDayCount} days you spent</>}
            </p>

            {catSlices.length > 1 && (
              <div className="flex flex-col gap-2 mb-4">
                {catSlices.slice(0, 5).map((s, i) => (
                  <div key={s.cat} className="legend-row flex items-center gap-2" style={{ animationDelay: `${0.04 * i}s` }}>
                    <span className="text-xs text-gray-500 w-20 shrink-0 truncate">{CATEGORY_CONFIG[s.cat].label.split(' ')[0]}</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                      <div className="h-full rounded-full bar-fill" style={{ width: `${(s.spent / total) * 100}%`, background: CATEGORY_COLOR[s.cat] }} />
                    </div>
                    <span className="text-[11px] text-gray-400 shrink-0 whitespace-nowrap">{fmt(s.spent)}</span>
                  </div>
                ))}
                {catSlices.length > 5 && <p className="text-[10px] text-gray-300 pl-22">+{catSlices.length - 5} more</p>}
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              {dayExpenses.map((e, i) => (
                <div key={e.id} className="row-item flex items-center gap-2.5 bg-gray-50 rounded-xl p-2.5" style={{ animationDelay: `${0.03 * i}s` }}>
                  <CatIcon category={e.category} size={32} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-black truncate">{e.title}</p>
                    <p className="text-[10px] text-gray-400">
                      {new Date(e.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                      {e.note && ` · ${e.note}`}
                    </p>
                  </div>
                  <span className="text-xs font-medium text-black shrink-0">{fmt(e.amount)}</span>
                  <RowMenu items={[
                    { label: 'Edit', icon: <Pencil size={13} />, onClick: () => onEditExpense(e) },
                    { label: 'Delete', icon: <Trash2 size={13} />, onClick: () => onDeleteExpense(e), danger: true },
                  ]} />
                </div>
              ))}
            </div>

            {incomeTot > 0 && (
              <p className="text-[11px] text-emerald-600 mt-3">
                Also received {fmt(incomeTot)}{dayIncome.length === 1 ? ` · ${dayIncome[0].title}` : ''}
              </p>
            )}
          </>)}
        </div>

        <div className="flex items-center justify-between gap-2 px-5 py-3 border-t border-gray-100 shrink-0">
          <button onClick={() => onStepDay(-1)} disabled={!canPrev}
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-black disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
            <ChevronLeft size={14} /> Prev
          </button>
          <span className="text-[11px] text-gray-400">Day {day} of {elapsedDays}</span>
          <button onClick={() => onStepDay(1)} disabled={!canNext}
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-black disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
            Next <ChevronRight size={14} />
          </button>
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
  const totalOwed = owed + collected
  const pct = totalOwed > 0 ? Math.min((collected / totalOwed) * 100, 100) : 0
  const myShare = Math.max(bill.total_amount - totalOwed, 0)

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
            <p className="text-xs text-gray-400 mt-0.5">
              {fmt(bill.total_amount)} total · {participants.length} {participants.length === 1 ? 'person' : 'people'}
              {myShare > 0 && <span className="text-gray-300"> · {fmt(myShare)} is your share</span>}
            </p>
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
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${p.is_paid ? 'bg-emerald-50 text-emerald-600' : `${cfg.bg} ${cfg.text}`}`}>
                    {togglingId === p.id ? <div className="w-3.5 h-3.5 border border-gray-400 border-t-transparent rounded-full animate-spin" /> : p.is_paid ? <Check size={16} /> : <Users size={15} />}
                  </div>
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

// ─── Add Debt Modal ───────────────────────────────────────────────────────────
function AddDebtModal({ onClose, onSave }: {
  onClose: () => void
  onSave: (data: { person_name: string; amount: number; note: string; due_date: string }) => Promise<void>
}) {
  const [personName, setPersonName] = useState('')
  const [amount, setAmount]         = useState('')
  const [note, setNote]             = useState('')
  const [dueDate, setDueDate]       = useState('')
  const [saving, setSaving]         = useState(false)

  const handleSave = async () => {
    if (!personName.trim() || !amount || parseFloat(amount) <= 0) return
    setSaving(true)
    await onSave({ person_name: personName.trim(), amount: parseFloat(amount), note: note.trim(), due_date: dueDate })
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/30 px-4 pb-4 sm:pb-0">
      <div className="bg-white rounded-2xl w-full max-w-sm p-5 shadow-xl max-h-[90vh] overflow-y-auto animate-slide-up">
        <div className="flex justify-between items-center mb-5">
          <div><h2 className="text-base font-medium text-black">New debt</h2><p className="text-xs text-gray-400 mt-0.5">Track money someone owes you</p></div>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-black transition-all"><X size={16} /></button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Who owes you?</label>
            <input value={personName} onChange={e => setPersonName(e.target.value)} placeholder="e.g. Andi" autoFocus
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-black focus:outline-none focus:border-black transition" />
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Amount (Rp)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-medium select-none">Rp</span>
              <input type="text" inputMode="numeric" value={amount} onChange={e => setAmount(e.target.value.replace(/[^0-9.]/g, ''))} placeholder="0"
                className="w-full border border-gray-200 rounded-lg pl-10 pr-3 py-2.5 text-sm text-black focus:outline-none focus:border-black transition font-medium" />
            </div>
            {amount && !isNaN(parseFloat(amount)) && parseFloat(amount) > 0 && <p className="text-xs text-gray-400 mt-1 pl-1">{fmt(parseFloat(amount))}</p>}
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Due date <span className="text-gray-300">(optional)</span></label>
            <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-black focus:outline-none focus:border-black transition" />
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Note <span className="text-gray-300">(optional)</span></label>
            <input value={note} onChange={e => setNote(e.target.value)} placeholder="e.g. Lent for groceries..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-black focus:outline-none focus:border-black transition" />
          </div>
        </div>
        <div className="flex gap-2 mt-5">
          <button onClick={onClose} className="flex-1 border border-gray-200 rounded-lg py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition">Cancel</button>
          <button onClick={handleSave} disabled={saving || !personName.trim() || !amount || parseFloat(amount) <= 0}
            className="flex-1 bg-black text-white rounded-lg py-2.5 text-sm font-medium hover:bg-gray-800 active:scale-[.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2">
            {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Plus size={14} /> Add debt</>}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Log Debt Payment Modal ───────────────────────────────────────────────────
function LogDebtPaymentModal({ debt, remaining, onClose, onSave }: {
  debt: Debt; remaining: number; onClose: () => void
  onSave: (amount: number, note: string) => Promise<void>
}) {
  const [amount, setAmount] = useState('')
  const [note, setNote]     = useState('')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!amount || parseFloat(amount) <= 0) return
    setSaving(true); await onSave(parseFloat(amount), note.trim()); setSaving(false)
  }

  const afterRemaining = remaining - (parseFloat(amount) || 0)

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/30 px-4 pb-4 sm:pb-0">
      <div className="bg-white rounded-2xl w-full max-w-sm p-5 shadow-xl animate-slide-up">
        <div className="flex justify-between items-center mb-1">
          <div>
            <h2 className="text-base font-medium text-black">Log payment</h2>
            <p className="text-xs text-gray-400 mt-0.5">{debt.person_name}</p>
          </div>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-black transition-all"><X size={16} /></button>
        </div>
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-50 text-gray-600 text-xs font-medium mb-4">
          <CreditCard size={13} /> {fmtShort(remaining)} remaining
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
            <input value={note} onChange={e => setNote(e.target.value)} placeholder="e.g. Paid via transfer..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-black focus:outline-none focus:border-black transition" />
          </div>
          {amount && parseFloat(amount) > 0 && (
            <div className="bg-gray-50 rounded-lg px-3 py-2">
              <p className="text-xs text-gray-500">After this payment: <span className={`font-medium ${afterRemaining <= 0 ? 'text-emerald-600' : 'text-black'}`}>{afterRemaining <= 0 ? 'Settled' : `${fmtShort(afterRemaining)} remaining`}</span></p>
            </div>
          )}
        </div>
        <div className="flex gap-2 mt-5">
          <button onClick={onClose} className="flex-1 border border-gray-200 rounded-lg py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition">Cancel</button>
          <button onClick={handleSave} disabled={saving || !amount || parseFloat(amount) <= 0}
            className="flex-1 bg-black text-white rounded-lg py-2.5 text-sm font-medium hover:bg-gray-800 active:scale-[.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2">
            {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Check size={14} /> Log payment</>}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Debt Detail Modal ────────────────────────────────────────────────────────
function DebtDetailModal({ stats, onClose, onOpenLog, onDeletePayment, onEditDebt, onArchiveDebt }: {
  stats: DebtWithStats; onClose: () => void
  onOpenLog: () => void
  onDeletePayment: (payment: DebtPayment) => Promise<void>
  onEditDebt: (updated: Partial<Pick<Debt, 'person_name' | 'amount' | 'note' | 'due_date'>>) => Promise<void>
  onArchiveDebt: () => Promise<void>
}) {
  const { debt, payments, paid, remaining, pct, settled, overdue } = stats
  const [tab, setTab]               = useState<'overview' | 'history' | 'edit'>('overview')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [editName, setEditName]     = useState(debt.person_name)
  const [editAmount, setEditAmount] = useState(String(debt.amount))
  const [editNote, setEditNote]     = useState(debt.note ?? '')
  const [editDueDate, setEditDueDate] = useState(debt.due_date ?? '')
  const [editSaving, setEditSaving] = useState(false)
  const [archiving, setArchiving]   = useState(false)

  const handleDeletePayment = async (payment: DebtPayment) => {
    setDeletingId(payment.id); await onDeletePayment(payment); setDeletingId(null)
  }
  const handleEdit = async () => {
    if (!editName.trim() || !editAmount || parseFloat(editAmount) <= 0) return
    setEditSaving(true)
    await onEditDebt({ person_name: editName.trim(), amount: parseFloat(editAmount), note: editNote.trim(), due_date: editDueDate || undefined })
    setEditSaving(false)
  }
  const handleArchive = async () => { setArchiving(true); await onArchiveDebt(); setArchiving(false) }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/30 px-4 pb-4 sm:pb-0">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl max-h-[88vh] flex flex-col animate-slide-up">
        <div className="flex items-start justify-between p-5 pb-3 border-b border-gray-100">
          <div className="flex-1 min-w-0 mr-3">
            <p className="text-base font-medium text-black truncate">{debt.person_name}</p>
            <p className="text-xs text-gray-400 mt-0.5">{fmtShort(paid)} of {fmtShort(debt.amount)} paid back</p>
          </div>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-black transition-all shrink-0"><X size={16} /></button>
        </div>
        <div className="px-5 pt-3 pb-0">
          <div className="bg-gray-100 rounded-full h-2.5 overflow-hidden mb-1">
            <div className={`h-full rounded-full transition-all duration-700 ${settled ? 'bg-emerald-500' : 'bg-black'}`} style={{ width: `${pct}%` }} />
          </div>
          <div className="flex justify-between">
            <span className="text-xs text-gray-400">{pct.toFixed(0)}% paid back</span>
            {settled
              ? <span className="text-xs text-emerald-600 font-medium">Settled</span>
              : overdue
              ? <span className="text-xs text-red-500 font-medium">{fmtShort(remaining)} remaining · overdue</span>
              : <span className="text-xs text-gray-400">{fmtShort(remaining)} remaining</span>}
          </div>
        </div>
        <div className="flex gap-1 mx-5 mt-3 bg-gray-100 p-1 rounded-lg">
          {(['overview', 'history', 'edit'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-1 rounded-md text-xs font-medium transition-all ${tab === t ? 'bg-white text-black shadow-sm' : 'text-gray-400 hover:text-black'}`}>
              {t === 'overview' ? 'Overview' : t === 'history' ? `History (${payments.length})` : 'Edit'}
            </button>
          ))}
        </div>
        <div className="flex-1 overflow-y-auto px-5 pb-5 pt-3">
          {tab === 'overview' && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-gray-50 rounded-xl px-3 py-2.5">
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">Total owed</p>
                  <p className="text-sm font-semibold text-black">{fmtShort(debt.amount)}</p>
                </div>
                <div className={`rounded-xl px-3 py-2.5 ${overdue ? 'bg-red-50' : 'bg-gray-50'}`}>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">Remaining</p>
                  <p className={`text-sm font-semibold ${overdue ? 'text-red-600' : 'text-black'}`}>{fmtShort(Math.max(remaining, 0))}</p>
                </div>
              </div>
              {debt.due_date && (
                <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${overdue ? 'bg-red-50 text-red-600' : 'bg-gray-50 text-gray-600'}`}>
                  {overdue && <AlertTriangle size={12} />}
                  Due {new Date(debt.due_date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                </div>
              )}
              {debt.note && <p className="text-xs text-gray-400 italic">{debt.note}</p>}
              {!settled && (
                <button onClick={onOpenLog}
                  className="w-full bg-black text-white rounded-lg py-2.5 text-sm font-medium hover:bg-gray-800 active:scale-[.98] transition-all flex items-center justify-center gap-2">
                  <Plus size={14} /> Log payment
                </button>
              )}
            </div>
          )}
          {tab === 'history' && (
            payments.length === 0 ? (
              <div className="text-center py-8"><History size={24} className="mx-auto mb-2 text-gray-200" /><p className="text-xs text-gray-300">No payments logged yet</p>{!settled && <button onClick={onOpenLog} className="mt-3 inline-flex items-center gap-1 text-xs text-black font-medium hover:underline"><Plus size={11} /> Log first payment</button>}</div>
            ) : (
              <div className="flex flex-col gap-2">
                <div className="bg-gray-50 rounded-xl px-3 py-2.5 mb-1 flex justify-between items-center">
                  <span className="text-xs text-gray-500">{payments.length} payment{payments.length !== 1 ? 's' : ''}</span>
                  <span className="text-xs font-medium text-black">{fmtShort(paid)} total</span>
                </div>
                {payments.map(payment => (
                  <div key={payment.id} className="flex items-center gap-3 border border-gray-100 rounded-xl px-3 py-2.5 group hover:bg-gray-50 transition-all">
                    <div className="w-7 h-7 bg-emerald-50 rounded-lg flex items-center justify-center shrink-0">
                      <span className="text-emerald-700"><Check size={14} /></span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-emerald-700">+{fmtShort(payment.amount)}</p>
                      {payment.note && <p className="text-xs text-gray-400 truncate">{payment.note}</p>}
                      <p className="text-xs text-gray-300">{new Date(payment.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                    </div>
                    <button onClick={() => handleDeletePayment(payment)} disabled={deletingId === payment.id}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-all disabled:opacity-50 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 shrink-0">
                      {deletingId === payment.id ? <div className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin" /> : <Trash2 size={12} />}
                    </button>
                  </div>
                ))}
              </div>
            )
          )}
          {tab === 'edit' && (
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Who owes you?</label>
                <input value={editName} onChange={e => setEditName(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-black focus:outline-none focus:border-black transition" />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Amount (Rp)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-medium select-none">Rp</span>
                  <input type="text" inputMode="numeric" value={editAmount} onChange={e => setEditAmount(e.target.value.replace(/[^0-9.]/g, ''))}
                    className="w-full border border-gray-200 rounded-lg pl-10 pr-3 py-2.5 text-sm text-black focus:outline-none focus:border-black transition font-medium" />
                </div>
                {editAmount && <p className="text-xs text-gray-400 mt-1 pl-1">{fmt(parseFloat(editAmount) || 0)}</p>}
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Due date <span className="text-gray-300">(optional)</span></label>
                <input type="date" value={editDueDate} onChange={e => setEditDueDate(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-black focus:outline-none focus:border-black transition" />
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
                <button onClick={handleArchive} disabled={archiving}
                  className="w-full border border-red-200 text-red-500 hover:bg-red-50 rounded-lg py-2.5 text-sm font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                  {archiving ? <div className="w-4 h-4 border-2 border-red-300 border-t-red-500 rounded-full animate-spin" /> : <><Trash2 size={14} /> Delete this debt</>}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Budget Simulator helpers ─────────────────────────────────────────────────
const ALL_CATS = Object.keys(CATEGORY_CONFIG) as Category[]

const SIM_TABS = [
  { key: 'plan',      label: 'Planner' },
  { key: 'variance',  label: 'Actual'  },
  { key: 'scenarios', label: 'Compare' },
  { key: 'goals',     label: 'Goals'   },
] as const

/**
 * Set `cat` to `rawValue`, then redistribute what's left across the unlocked
 * categories in proportion to their current values so the grand total lands
 * exactly on `pool` (integer rupiah, zero drift).
 */
function rebalanceBudgets(
  current: Partial<Record<Category, number>>,
  cat: Category,
  rawValue: number,
  locked: Partial<Record<Category, boolean>>,
  pool: number,
): Partial<Record<Category, number>> {
  const val = (c: Category) => Math.max(0, Math.round(current[c] || 0))

  // Locked money comes off the top and is untouchable.
  const lockedTotal = ALL_CATS.filter(c => locked[c] && c !== cat).reduce((s, c) => s + val(c), 0)
  // The edited category can never claim locked money.
  const editable = Math.max(0, pool - lockedTotal)
  const target   = Math.min(Math.max(0, Math.round(rawValue)), editable)

  const next: Partial<Record<Category, number>> = { ...current }
  next[cat] = target

  const others = ALL_CATS.filter(c => c !== cat && !locked[c])
  if (others.length === 0) return next          // everything else locked: clamp only

  const remainder = Math.max(0, editable - target)
  const othersSum = others.reduce((s, c) => s + val(c), 0)

  if (othersSum <= 0) {
    const each = Math.floor(remainder / others.length)   // nothing to scale -> even spread
    others.forEach(c => { next[c] = each })
  } else {
    const k = remainder / othersSum
    others.forEach(c => { next[c] = Math.floor(val(c) * k) })   // floor, never round
  }

  // Drift repair. Flooring keeps drift >= 0, so this is always additive and can
  // never push a category negative. Leftovers go to the largest row so they're
  // invisible instead of resurrecting a zeroed category as "Rp 7".
  const assigned = others.reduce((s, c) => s + (next[c] || 0), 0)
  const drift    = remainder - assigned
  if (drift > 0) {
    const sink = others.reduce((a, b) => (next[b] || 0) > (next[a] || 0) ? b : a, others[0])
    next[sink] = (next[sink] || 0) + drift
  }
  return next
}

/** One proportional rescale of the unlocked set so the total hits `pool`. */
function fitToPool(
  current: Partial<Record<Category, number>>,
  locked: Partial<Record<Category, boolean>>,
  pool: number,
): Partial<Record<Category, number>> {
  const anchor = ALL_CATS.find(c => !locked[c])
  if (!anchor) return current
  // Re-set the first unlocked category to its own value; rebalanceBudgets then
  // normalizes everything else onto `pool`.
  return rebalanceBudgets(current, anchor, Math.max(0, Math.round(current[anchor] || 0)), locked, pool)
}

function ScenarioCard({ name, desc, icon, budgetSet, scenarioKey, simIncome, simFixedTotal, activeScenario, onApply, index }: {
  name: string; desc: string; icon: React.ReactNode
  budgetSet: Partial<Record<Category, number>>
  scenarioKey: 'frugal' | 'normal' | 'ambitious'
  simIncome: number; simFixedTotal: number
  activeScenario: 'custom' | 'frugal' | 'normal' | 'ambitious'
  onApply: (k: 'frugal' | 'normal' | 'ambitious') => void
  index: number
}) {
  const varTotal = Object.values(budgetSet).reduce((s, v) => s + (v || 0), 0)
  const surplus  = simIncome - simFixedTotal - varTotal
  const savRate  = simIncome > 0 ? (surplus / simIncome) * 100 : 0
  const isActive = activeScenario === scenarioKey
  return (
    <div className={`border rounded-xl p-3 flex flex-col gap-2 transition-all animate-pop-in ${isActive ? 'border-black' : 'border-gray-100'}`}
      style={{ animationDelay: `${0.05 * index}s` }}>
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
          <span className={`font-medium ${savingsTone(savRate).text}`}>{pctText(savRate)}</span>
        </div>
      </div>
      <button onClick={() => onApply(scenarioKey)}
        className={`w-full py-1.5 rounded-lg text-xs font-medium transition-all ${isActive ? 'bg-black text-white' : 'border border-gray-200 text-gray-600 hover:border-black hover:text-black'}`}>
        {isActive ? 'Applied' : 'Apply'}
      </button>
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
  const [tab, setTab] = useState<'plan' | 'variance' | 'scenarios' | 'goals'>('plan')
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
  const [confirmDeleteProfile, setConfirmDeleteProfile] = useState(false)
  const [deletingProfile, setDeletingProfile] = useState(false)
  // Auto-balance is opt-in so the Planner stays as simple as before by default.
  // Locks are session-only (no column on budget_simulations).
  const [autoBalance, setAutoBalance] = useState(false)
  const [lockedCats, setLockedCats] = useState<Partial<Record<Category, boolean>>>({})
  const [dragCat, setDragCat] = useState<Category | null>(null)
  const bodyRef = useRef<HTMLDivElement>(null)

  const activeProfile = profiles.find(p => p.id === activeProfileId) || null

  useEffect(() => { bodyRef.current?.scrollTo({ top: 0 }) }, [tab])

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
    setDeletingProfile(true)
    const { error } = await supabase.from('budget_simulations').delete().eq('id', id)
    setDeletingProfile(false)
    if (error) return                    // keep the row visible if the delete failed
    const remaining = profiles.filter(p => p.id !== id)
    setProfiles(remaining)
    if (remaining.length > 0) {
      loadProfileIntoEditor(remaining[0])
    } else {
      setActiveProfileId(null); setSavedAt(null)
      setSimCategoryBudgets({}); setGoalAllocations({})
    }
    setConfirmDeleteProfile(false)
    setProfileMenuOpen(false)
  }

  const submitName = () => {
    if (namingMode === 'new') handleCreateProfile(nameDraft)
    else if (namingMode === 'rename') handleRenameProfile(nameDraft)
    setNamingMode(null); setNameDraft('')
  }

  // ── Key derived values ──────────────────────────────────────────────────────
  const simFixedTotal = useMemo(() =>
    recurring.reduce((s, r) => s + monthlyEquivalent(r.amount, r.frequency), 0), [recurring])

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

  // ── Slider / rebalance model ────────────────────────────────────────────────
  // Money genuinely available to spread across variable categories.
  // Mirrors ambitiousBudgets so the two models agree.
  const spendablePool = Math.max(0, Math.round(simIncome - simFixedTotal - totalGoalAllocations))
  const unlockedCount = ALL_CATS.filter(c => !lockedCats[c]).length
  const allocated     = simVariableTotal
  const poolRemaining = spendablePool - allocated
  const poolPct       = spendablePool > 0 ? (allocated / spendablePool) * 100 : (allocated > 0 ? Infinity : 0)
  // Auto-balance is meaningless with nothing to distribute.
  const canAutoBalance = spendablePool > 0 && unlockedCount > 1
  const effectiveAuto  = autoBalance && canAutoBalance
  // Never cap below the current value or a drag would silently shrink the budget.
  const catSliderMax = (budget: number) => Math.max(spendablePool > 0 ? spendablePool : 1_000_000, budget, 1)
  const sliderStep = (() => {
    const base = spendablePool > 0 ? spendablePool : 1_000_000
    return Math.max(10_000, Math.round(base / 100 / 10_000) * 10_000)
  })()

  // ── Planned vs actual ───────────────────────────────────────────────────────
  const monthMeta = useMemo(() => {
    const [yr, mo] = selectedMonth.split('-').map(Number)
    const daysInMonth = new Date(yr, mo, 0).getDate()
    const left = daysLeftInMonth(selectedMonth)   // null for any non-current month
    const isCurrent = left !== null
    const daysElapsed = isCurrent ? Math.max(1, daysInMonth - left) : daysInMonth
    return { daysInMonth, daysElapsed, daysLeft: left ?? 0, isCurrent }
  }, [selectedMonth])

  const varianceRows = useMemo(() => {
    const rows = ALL_CATS.map(cat => {
      const planned  = simCategoryBudgets[cat] || 0
      const actual   = categoryTotals[cat] || 0
      const variance = actual - planned                       // positive = overspent
      const pct = planned > 0 ? (actual / planned) * 100 : (actual > 0 ? Infinity : 0)
      const projected = monthMeta.isCurrent
        ? Math.round(actual / monthMeta.daysElapsed * monthMeta.daysInMonth)
        : actual
      return { cat, planned, actual, variance, pct, projected,
               projVariance: projected - planned, unplanned: planned === 0 && actual > 0 }
    }).filter(r => r.planned > 0 || r.actual > 0)
    // Sort by absolute rupiah, not percentage — a 300% overshoot on Rp 40.000 is
    // noise next to 12% on housing.
    rows.sort((a, b) => (b.variance - a.variance) || (b.planned - a.planned))
    return rows
  }, [simCategoryBudgets, categoryTotals, monthMeta])

  const varianceTotals = useMemo(() => {
    const actual    = varianceRows.reduce((s, r) => s + r.actual, 0)
    const projected = varianceRows.reduce((s, r) => s + r.projected, 0)
    const planned   = simVariableTotal
    return { planned, actual, projected,
             pct: planned > 0 ? (actual / planned) * 100 : (actual > 0 ? Infinity : 0) }
  }, [varianceRows, simVariableTotal])

  // Handlers
  // Single write path for every category change (slider AND text input).
  const setCatBudget = (cat: Category, n: number) => {
    setSimCategoryBudgets(prev =>
      effectiveAuto ? rebalanceBudgets(prev, cat, n, lockedCats, spendablePool)
                    : { ...prev, [cat]: Math.max(0, Math.round(n)) })
    setActiveScenario('custom')
  }
  // Locking never changes numbers — the pool meter surfaces any mismatch and
  // "Fit to pool" resolves it on demand.
  const toggleLock = (cat: Category) => setLockedCats(prev => ({ ...prev, [cat]: !prev[cat] }))
  const handleFitToPool = () => {
    setSimCategoryBudgets(prev => fitToPool(prev, lockedCats, spendablePool))
    setActiveScenario('custom')
  }
  // Bulk overwrite path shared by Reset actuals / 50-30-20 / Apply scenario.
  // Locks are only honoured while auto-balance is on, since that's the only time
  // they're visible.
  const applyBudgetSet = (set: Partial<Record<Category, number>>) => {
    setSimCategoryBudgets(prev => {
      if (!effectiveAuto) return { ...set }
      const merged = { ...set }
      ALL_CATS.forEach(c => { if (lockedCats[c]) merged[c] = prev[c] || 0 })
      return fitToPool(merged, lockedCats, spendablePool)
    })
    setActiveScenario('custom')
  }

  const handleResetFromActuals = () => applyBudgetSet(categoryTotals)
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
    applyBudgetSet(newB)
  }
  const handleApplyScenario = (s: 'frugal' | 'normal' | 'ambitious') => {
    const map = { frugal: frugalBudgets, normal: normalBudgets, ambitious: ambitiousBudgets }
    applyBudgetSet(map[s])
    setActiveScenario(s)          // after applyBudgetSet, which forces 'custom'
    setTab('plan')
  }

  function savedLabel() {
    if (!savedAt) return null
    const diffMin = Math.floor((Date.now() - savedAt.getTime()) / 60000)
    if (diffMin < 1) return 'just now'
    if (diffMin < 60) return `${diffMin}m ago`
    return `${Math.floor(diffMin / 60)}h ago`
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
              { label: 'Delete', icon: <Trash2 size={13} />, onClick: () => setConfirmDeleteProfile(true), danger: true, disabled: !activeProfileId },
            ]} />
          </>)}
        </div>

        {/* Tabs — no gap-1: the sliding pill needs exact 1/n offsets */}
        <div className="relative flex mx-5 mt-3 bg-gray-100 p-1 rounded-lg shrink-0">
          <div className="tab-indicator absolute top-1 bottom-1 left-1 bg-white rounded-md shadow-sm"
            style={{ width: `calc((100% - 0.5rem) / ${SIM_TABS.length})`,
                     transform: `translateX(calc(${SIM_TABS.findIndex(t => t.key === tab)} * 100%))` }} />
          {SIM_TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`relative z-10 flex-1 py-1 rounded-md text-[11px] font-medium transition-colors ${tab === t.key ? 'text-black' : 'text-gray-400 hover:text-black'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Scrollable body */}
        <div ref={bodyRef} className="flex-1 overflow-y-auto px-5 pb-5 pt-4">
        <div key={tab} className="space-y-4 animate-slide-up">

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
                    const monthly = monthlyEquivalent(r.amount, r.frequency)
                    return (
                      <div key={r.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${CATEGORY_CONFIG[r.category].bg} ${CATEGORY_CONFIG[r.category].text}`}>{FREQ_LABELS[r.frequency]}</span>
                          <span className="text-xs text-gray-600 truncate max-w-40">{r.title}</span>
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
              {/* Pool meter */}
              <div className="bg-gray-50 rounded-xl px-3 py-2.5 mb-3">
                <div className="flex justify-between items-center mb-1.5">
                  <p className="text-xs font-medium text-gray-500">Allocated</p>
                  <p className="text-xs text-gray-500">
                    <span className="font-semibold text-gray-800">{fmt(allocated)}</span>
                    {spendablePool > 0 && <> of {fmt(spendablePool)}</>}
                  </p>
                </div>
                <div className="bg-gray-200 rounded-full h-1 overflow-hidden mb-2">
                  <div className={`h-full rounded-full bar-fill ${usageTone(poolPct).bar}`}
                    style={{ width: `${Number.isFinite(poolPct) ? Math.min(poolPct, 100) : 100}%` }} />
                </div>
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <button onClick={() => setAutoBalance(v => !v)} disabled={!canAutoBalance}
                    title={!canAutoBalance
                      ? (spendablePool <= 0 ? 'Add your monthly income first' : 'Unlock at least two categories')
                      : 'Keep budgets fitting your income automatically'}
                    aria-pressed={effectiveAuto}
                    className={`flex items-center gap-1.5 text-[10px] font-medium px-2 py-1 rounded-lg border transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                      effectiveAuto ? 'bg-black border-black text-white' : 'border-gray-200 text-gray-500 hover:border-black hover:text-black'}`}>
                    <SlidersHorizontal size={11} /> Auto-balance
                  </button>
                  <div className="flex items-center gap-1.5">
                    {simIncome === 0
                      ? <span className="text-[10px] text-gray-300">Enter your income above to unlock auto-balance</span>
                      : spendablePool === 0
                        ? <span className="text-[10px] text-red-600">Fixed costs and goals already use all your income</span>
                        : <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${poolRemaining >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
                            {poolRemaining >= 0 ? `${fmt(poolRemaining)} left` : `${fmt(-poolRemaining)} over`}
                          </span>
                    }
                    {effectiveAuto && allocated !== spendablePool && (
                      <button onClick={handleFitToPool}
                        className="text-[10px] px-2 py-1 border border-gray-200 rounded-lg text-gray-500 hover:border-black hover:text-black transition-all">
                        Fit to pool
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                {ALL_CATS.map((cat, i) => {
                  const cfg     = CATEGORY_CONFIG[cat]
                  const budget  = simCategoryBudgets[cat] || 0
                  const actual  = categoryTotals[cat] || 0
                  const avgVal  = threeMonthCatAvg[cat] || 0
                  const isLocked = !!lockedCats[cat]
                  const max     = catSliderMax(budget)
                  const fillPct = Math.min((budget / max) * 100, 100)
                  const rowDisabled = effectiveAuto && isLocked
                  return (
                    <div key={cat} className="row-item" style={{ animationDelay: `${0.03 * i}s` }}>
                      <div className="flex items-center gap-2">
                        <div className={`w-6 h-6 ${cfg.bg} rounded-lg flex items-center justify-center shrink-0`}>
                          <span className={cfg.text}>{cfg.icon}</span>
                        </div>
                        <span className="text-xs text-gray-600 flex-1 truncate min-w-0">{cfg.label}</span>
                        {autoBalance && (
                          <button onClick={() => toggleLock(cat)} aria-pressed={isLocked}
                            title={isLocked ? 'Unlock' : 'Lock this amount'}
                            className={`w-6 h-6 flex items-center justify-center rounded-lg shrink-0 transition-all active:scale-[.98] ${
                              isLocked ? 'bg-black text-white' : 'text-gray-300 hover:text-black hover:bg-gray-100'}`}>
                            {isLocked ? <Lock size={11} /> : <LockOpen size={11} />}
                          </button>
                        )}
                        <div className="relative w-32 shrink-0">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 select-none">Rp</span>
                          <input type="text" inputMode="numeric" value={groupId(budget)} placeholder="0"
                            disabled={rowDisabled}
                            onChange={e => {
                              // Write raw while focused so digits don't fight the user;
                              // the rebalance runs once on blur/Enter.
                              const n = parseRp(e.target.value)
                              setSimCategoryBudgets(prev => ({ ...prev, [cat]: n }))
                              setActiveScenario('custom')
                            }}
                            onBlur={() => { if (effectiveAuto) handleFitToPool() }}
                            onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur() }}
                            className="w-full border border-gray-200 rounded-lg pl-6 pr-2 py-1.5 text-xs text-black focus:outline-none focus:border-black transition text-right disabled:opacity-50 disabled:cursor-not-allowed" />
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-1 ml-8">
                        <input type="range" min={0} max={max} step={sliderStep}
                          value={Math.min(budget, max)}
                          disabled={rowDisabled}
                          aria-label={`${cfg.label} budget`}
                          onPointerDown={() => setDragCat(cat)}
                          onPointerUp={() => setDragCat(null)}
                          onPointerCancel={() => setDragCat(null)}
                          onChange={e => setCatBudget(cat, parseInt(e.target.value, 10))}
                          className={`budget-slider flex-1 min-w-0 ${dragCat === cat ? 'dragging' : ''}`}
                          style={{ ['--track' as string]: `linear-gradient(to right, ${isLocked && autoBalance ? '#6b7280' : '#111110'} ${fillPct}%, #e9e9e6 ${fillPct}%)` } as React.CSSProperties} />
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
                  <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium transition-colors ${savingsTone(simSavingsRate).chip}`}>
                    {pctText(simSavingsRate)} saved
                  </span>
                  <span key={simSurplus >= 0 ? 'pos' : 'neg'}
                    className={`text-sm font-bold surplus-pop ${simSurplus >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
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

          {/* ── TAB 2: ACTUAL (planned vs actual) ── */}
          {tab === 'variance' && (<>
            {varianceRows.length === 0 ? (
              <div className="text-center py-10">
                <BarChart2 size={28} className="mx-auto mb-2 text-gray-200" />
                <p className="text-sm text-gray-400 mb-1">Nothing to compare yet</p>
                <p className="text-xs text-gray-300 mb-4">Set budgets in the Planner, then come back to see how you're tracking.</p>
                <button onClick={() => setTab('plan')}
                  className="bg-black text-white px-3.5 py-2 rounded-lg text-xs font-medium hover:bg-gray-800 active:scale-[.98] transition-all">
                  Go to Planner
                </button>
              </div>
            ) : (<>
              {/* Summary */}
              <div className="border border-gray-100 rounded-xl px-4 py-3 animate-pop-in">
                <div className="flex justify-between items-center mb-3">
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Plan vs {getMonthLabelFull(selectedMonth)}</p>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${usageTone(varianceTotals.pct).chip}`}>
                    {pctText(varianceTotals.pct)} used
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 mb-2.5">
                  <div>
                    <p className="text-[10px] text-gray-400 mb-0.5">Planned</p>
                    <p className="text-[13px] font-semibold text-black">{fmt(varianceTotals.planned)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 mb-0.5">Actual</p>
                    <p className="text-[13px] font-semibold text-black">{fmt(varianceTotals.actual)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 mb-0.5">{monthMeta.isCurrent ? 'Projected' : 'Final'}</p>
                    <p className={`text-[13px] font-semibold ${monthMeta.isCurrent && varianceTotals.projected > varianceTotals.planned && varianceTotals.planned > 0 ? 'text-amber-600' : 'text-black'}`}>
                      {fmt(varianceTotals.projected)}
                    </p>
                  </div>
                </div>
                <div className="bg-gray-100 rounded-full h-1.5 overflow-hidden mb-2">
                  <div className={`h-full rounded-full bar-fill ${usageTone(varianceTotals.pct).bar}`}
                    style={{ width: `${Number.isFinite(varianceTotals.pct) ? Math.min(varianceTotals.pct, 100) : 100}%` }} />
                </div>
                <p className="text-[10px] text-gray-400">
                  {monthMeta.isCurrent
                    ? <>{monthMeta.daysLeft} {monthMeta.daysLeft === 1 ? 'day' : 'days'} left · on pace for {fmt(varianceTotals.projected)}
                        {varianceTotals.planned > 0 && (varianceTotals.projected > varianceTotals.planned
                          ? <span className="text-amber-600"> ({fmt(varianceTotals.projected - varianceTotals.planned)} over plan)</span>
                          : <span className="text-emerald-600"> ({fmt(varianceTotals.planned - varianceTotals.projected)} under plan)</span>)}
                      </>
                    : <>Final · {fmt(varianceTotals.actual)} spent</>}
                </p>
              </div>

              {varianceTotals.planned === 0 && varianceTotals.actual > 0 && (
                <div className="flex items-start gap-1.5 bg-amber-50 rounded-lg px-2.5 py-2">
                  <AlertTriangle size={12} className="text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-700">None of this month's spending is budgeted. Set budgets in the Planner to track against them.</p>
                </div>
              )}
              {varianceTotals.planned > 0 && varianceTotals.actual === 0 && (
                <p className="text-xs text-gray-300">No spending recorded for {getMonthLabelFull(selectedMonth)} yet.</p>
              )}

              {/* Rows */}
              <div className="flex flex-col gap-2.5">
                {varianceRows.map((r, i) => {
                  const cfg = CATEGORY_CONFIG[r.cat]
                  const tone = usageTone(r.pct)
                  return (
                    <div key={r.cat} className="row-item" style={{ animationDelay: `${0.03 * i}s` }}>
                      <div className="flex items-start gap-2">
                        <div className={`w-6 h-6 ${cfg.bg} rounded-lg flex items-center justify-center shrink-0`}>
                          <span className={cfg.text}>{cfg.icon}</span>
                        </div>
                        <span className="text-xs text-gray-600 flex-1 truncate min-w-0 pt-1">{cfg.label}</span>
                        <div className="text-right shrink-0">
                          <p className="text-xs font-semibold text-black">{fmt(r.actual)}</p>
                          <p className="text-[10px] text-gray-400">
                            {r.unplanned ? 'not budgeted' : `of ${fmt(r.planned)}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-1 ml-8">
                        <div className="flex-1 bg-gray-100 rounded-full h-1 overflow-hidden">
                          <div className={`h-full rounded-full bar-fill ${tone.bar}`}
                            style={{ width: `${Number.isFinite(r.pct) ? Math.min(r.pct, 100) : 100}%` }} />
                        </div>
                        <span className={`text-[10px] font-medium shrink-0 ${tone.text}`}>{pctText(r.pct)}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium shrink-0 ${
                          r.unplanned ? 'bg-gray-100 text-gray-600'
                            : r.variance > 0 ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-700'}`}>
                          {r.unplanned ? 'Unplanned'
                            : r.variance > 0 ? `${fmt(r.variance)} over` : `${fmt(-r.variance)} left`}
                        </span>
                      </div>
                      {/* under budget now, but on track to blow it */}
                      {monthMeta.isCurrent && r.planned > 0 && r.variance <= 0 && r.projVariance > 0 && (
                        <p className="text-[10px] text-amber-600 ml-8 mt-1">On pace for {fmt(r.projected)} — {fmt(r.projVariance)} over plan</p>
                      )}
                    </div>
                  )
                })}
              </div>

              <button onClick={() => { handleResetFromActuals(); setTab('plan') }}
                className="w-full border border-gray-200 rounded-lg py-2 text-xs text-gray-600 hover:border-black hover:text-black transition-all">
                Copy actuals into plan
              </button>
            </>)}
          </>)}

          {/* ── TAB 3: SCENARIOS ── */}
          {tab === 'scenarios' && (<>
            <p className="text-xs text-gray-400">Compare budget scenarios — apply one to load it into the Planner.</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <ScenarioCard
                name="Frugal" scenarioKey="frugal" budgetSet={frugalBudgets} index={0}
                simIncome={simIncome} simFixedTotal={simFixedTotal}
                activeScenario={activeScenario} onApply={handleApplyScenario}
                icon={<TrendingDown size={13} />}
                desc="−30% across all variable budgets. Maximize savings." />
              <ScenarioCard
                name="Normal" scenarioKey="normal" budgetSet={normalBudgets} index={1}
                simIncome={simIncome} simFixedTotal={simFixedTotal}
                activeScenario={activeScenario} onApply={handleApplyScenario}
                icon={<BarChart2 size={13} />}
                desc="Last month's actual spending. Steady and realistic." />
              <ScenarioCard
                name="Ambitious" scenarioKey="ambitious" budgetSet={ambitiousBudgets} index={2}
                simIncome={simIncome} simFixedTotal={simFixedTotal}
                activeScenario={activeScenario} onApply={handleApplyScenario}
                icon={<Target size={13} />}
                desc="Optimized around your savings goals. Goal-focused." />
            </div>
            <div className="bg-gray-50 rounded-xl px-3 py-2.5">
              <p className="text-xs text-gray-500 mb-1">Your current custom plan</p>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-black">{fmt(simVariableTotal)} variable</p>
                  <p className={`text-xs ${simSurplus >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                    {simSurplus >= 0 ? '+' : ''}{fmt(Math.abs(Math.round(simSurplus)))} surplus · {pctText(simSavingsRate)} saved
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

      {confirmDeleteProfile && (
        <DeleteConfirm title={activeProfile?.name || 'this plan'} deleting={deletingProfile}
          onCancel={() => setConfirmDeleteProfile(false)} onConfirm={handleDeleteProfile} />
      )}
    </div>
  )
}


// Which dashboard cards start open. Saved per browser (localStorage 'ef_open_defaults').
type OpenDefaults = { daily: boolean; reserved: boolean; trend: boolean; category: boolean; insights: boolean }
const OPEN_DEFAULTS: OpenDefaults = { daily: false, reserved: false, trend: false, category: false, insights: true }
const OPEN_DEFAULT_ITEMS: { key: keyof OpenDefaults; label: string }[] = [
  { key: 'daily',    label: 'Daily spending' },
  { key: 'reserved', label: 'Reserved money' },
  { key: 'trend',    label: 'Last 6 months' },
  { key: 'category', label: 'By category' },
  { key: 'insights', label: 'Smart insights' },
]

function SettingsModal({ value, onChange, theme, onThemeChange, openDefaults, onOpenDefaultsChange, onClose }: {
  value: 'beginner' | 'expert'; onChange: (v: 'beginner' | 'expert') => void
  theme: 'light' | 'dark'; onThemeChange: (v: 'light' | 'dark') => void
  openDefaults: OpenDefaults; onOpenDefaultsChange: (key: keyof OpenDefaults, value: boolean) => void
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 z-300 flex items-end sm:items-center justify-center bg-black/30 px-4 pb-4 sm:pb-0" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-sm p-5 shadow-xl animate-slide-up max-h-[88vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-black flex items-center gap-2"><Settings size={16} /> Settings</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-black"><X size={18} /></button>
        </div>
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Dashboard view</p>
        <div className="grid grid-cols-2 gap-2">
          {([
            { key: 'beginner', title: 'Legacy View', desc: 'Simple, focused, mobile-first' },
            { key: 'expert', title: 'Expert', desc: 'Full dashboard with sidebar & analytics' },
          ] as const).map(o => (
            <button key={o.key} onClick={() => onChange(o.key)}
              className={`text-left rounded-xl border p-3 transition-all ${value === o.key ? 'border-black bg-gray-50' : 'border-gray-200 hover:border-gray-300'}`}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-black">{o.title}</span>
                {value === o.key && <Check size={14} className="text-black" />}
              </div>
              <span className="text-xs text-gray-400 leading-snug block">{o.desc}</span>
            </button>
          ))}
        </div>
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mt-5 mb-2">Appearance</p>
        <div className="grid grid-cols-2 gap-2">
          {([
            { key: 'light', title: 'Light', icon: <Sun size={14} />, swatch: ['#fafafa', '#ffffff', '#111110'] },
            { key: 'dark',  title: 'Dark',  icon: <Moon size={14} />, swatch: ['#0b0b0c', '#141416', '#f5f5f6'] },
          ] as const).map(o => (
            <button key={o.key} onClick={() => onThemeChange(o.key)}
              className={`text-left rounded-xl border p-2.5 transition-all ${theme === o.key ? 'border-black bg-gray-50' : 'border-gray-200 hover:border-gray-300'}`}>
              {/* Mini preview of the theme (fixed colours, so it looks right in either mode) */}
              <div className="ef-keep rounded-lg h-12 mb-2 p-1.5 flex flex-col gap-1 border border-[#00000014]" style={{ background: o.swatch[0] }}>
                <div className="h-3 w-3/5 rounded" style={{ background: o.swatch[1], boxShadow: '0 0 0 1px rgb(0 0 0 / 0.06)' }} />
                <div className="flex gap-1">
                  <div className="h-3.5 flex-1 rounded" style={{ background: o.swatch[1], boxShadow: '0 0 0 1px rgb(0 0 0 / 0.06)' }} />
                  <div className="h-3.5 w-5 rounded" style={{ background: o.swatch[2] }} />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-black flex items-center gap-1.5">{o.icon}{o.title}</span>
                {theme === o.key && <Check size={14} className="text-black" />}
              </div>
            </button>
          ))}
        </div>
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mt-5 mb-1">Open when the dashboard loads</p>
        <p className="text-[11px] text-gray-400 mb-2">Turn on the sections you want open by default.</p>
        <div className="rounded-xl border border-gray-200 divide-y divide-gray-100">
          {OPEN_DEFAULT_ITEMS.map(item => {
            const on = openDefaults[item.key]
            return (
              <button key={item.key} type="button" role="switch" aria-checked={on}
                onClick={() => onOpenDefaultsChange(item.key, !on)}
                className="w-full flex items-center justify-between gap-3 px-3 py-2.5 text-left hover:bg-gray-50 transition-colors first:rounded-t-xl last:rounded-b-xl">
                <span className="text-sm text-black">{item.label}</span>
                <span className="flex items-center gap-2 shrink-0">
                  <span className="text-[11px] text-gray-400">{on ? 'Open' : 'Closed'}</span>
                  <span className={`relative w-9 h-5 rounded-full transition-colors ${on ? 'bg-black' : 'bg-gray-200'}`}>
                    <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${on ? 'translate-x-4' : ''}`} />
                  </span>
                </span>
              </button>
            )
          })}
        </div>
        <button onClick={onClose} className="w-full mt-4 bg-black text-white text-sm font-medium py-2.5 rounded-xl hover:bg-gray-800 transition-all">Done</button>
      </div>
    </div>
  )
}


// ─── Main Dashboard ───────────────────────────────────────────────────────────
// Shared surface style for every Beginner-view section card
const CARD = 'ef-card bg-white border border-gray-100 rounded-2xl shadow-[0_1px_2px_rgba(16,24,40,0.04),0_8px_24px_-12px_rgba(16,24,40,0.10)]'

export default function Dashboard() {
  const [expenses, setExpenses]               = useState<Expense[]>([])
  const [income, setIncome]                   = useState<Income[]>([])
  const [budgets, setBudgets]                 = useState<Budget[]>([])
  const [savingsGoals, setSavingsGoals]       = useState<SavingsGoal[]>([])
  const [goalHistories, setGoalHistories]     = useState<Record<string, GoalHistory[]>>({})
  const [recurring, setRecurring]             = useState<RecurringExpense[]>([])
  const [activeFilter, setActiveFilter]       = useState<Category | 'all'>('all')
  const [dashboardTab, setDashboardTab]       = useState<'expenses' | 'income' | 'bills' | 'pools' | 'splits' | 'owed' | 'goals'>('expenses')
  const [viewMode, setViewMode]               = useState<'beginner' | 'expert'>('beginner')
  const [showSettings, setShowSettings]       = useState(false)
  const [selectedMonth, setSelectedMonth]     = useState(currentMonth())
  const [userEmail, setUserEmail]             = useState('')
  const [fullName, setFullName]               = useState('')
  const [showTotalBalance, setShowTotalBalance]     = useState(false)
  const [showMonthlyBalance, setShowMonthlyBalance] = useState(false)
  const [showIncome, setShowIncome]                 = useState(false)   // income is sensitive: hidden by default, like the balances
  const [showExpenses, setShowExpenses]             = useState(false)   // expenses too: hidden by default
  const [loading, setLoading]                 = useState(true)
  const [searchQuery, setSearchQuery]         = useState('')
  const [showSearch, setShowSearch]           = useState(false)
  const [showFilters, setShowFilters]         = useState(false)
  const [sortOrder, setSortOrder]             = useState<SortOrder>('date-desc')
  const [minAmount, setMinAmount]             = useState('')
  const [maxAmount, setMaxAmount]             = useState('')
  const [chartView, setChartView]             = useState<'monthly' | 'weekly'>('monthly')
  const [catSliceSelected, setCatSliceSelected] = useState<number | null>(null)
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
  const [openDay, setOpenDay]                 = useState<number | null>(null)
  const [dailyOpen, setDailyOpen]             = useState(false)   // collapsed by default
  const [reservedOpen, setReservedOpen]       = useState(false)   // Reserved money card, collapsed by default
  const [trendOpen, setTrendOpen]             = useState(false)   // Last 6 months card, collapsed by default
  const [catOpen, setCatOpen]                 = useState(false)   // By category card, collapsed by default
  const [showDailyPatterns, setShowDailyPatterns] = useState(false)
  const [calHelpOpen, setCalHelpOpen] = useState(false)   // calendar "How to read" panel
  const [splitBills, setSplitBills]           = useState<SplitBill[]>([])
  const [billParticipants, setBillParticipants] = useState<SplitBillParticipant[]>([])
  const [showAddSplitBill, setShowAddSplitBill] = useState(false)
  const [openSplitBill, setOpenSplitBill]     = useState<SplitBill | null>(null)
  const [debts, setDebts]                     = useState<Debt[]>([])
  const [debtPayments, setDebtPayments]       = useState<DebtPayment[]>([])
  const [showAddDebt, setShowAddDebt]         = useState(false)
  const [loggingDebt, setLoggingDebt]         = useState<Debt | null>(null)
  const [openDebt, setOpenDebt]               = useState<Debt | null>(null)
  const [showSimulator, setShowSimulator]     = useState(false)
  const [menuOpen, setMenuOpen]               = useState(false)
  const [deskMenuOpen, setDeskMenuOpen]       = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const deskMenuRef = useRef<HTMLDivElement>(null)
  const router  = useRouter()

  useEffect(() => { init() }, [])
  // Day 30 must not stay open when switching to February.
  useEffect(() => { setCatSliceSelected(null); setOpenDay(null) }, [selectedMonth])
  useEffect(() => {
    document.querySelector(`[data-tab="${dashboardTab}"]`)?.scrollIntoView({ behavior: 'smooth', inline: 'nearest', block: 'nearest' })
  }, [dashboardTab])
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node
      if (menuRef.current && !menuRef.current.contains(t)) setMenuOpen(false)
      if (deskMenuRef.current && !deskMenuRef.current.contains(t)) setDeskMenuOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setMenuOpen(false); setDeskMenuOpen(false) }
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey) }
  }, [])

  // Beginner/Expert view preference (read client-side to avoid hydration mismatch; default beginner)
  useEffect(() => { const v = localStorage.getItem('ef_view'); if (v === 'expert' || v === 'beginner') setViewMode(v) }, [])
  const changeView = (v: 'beginner' | 'expert') => { localStorage.setItem('ef_view', v); setViewMode(v) }

  // ── Appearance: light / dark ──
  // Applied as a class on <html> so portals and modals pick it up too; removed
  // when leaving the dashboard so other pages stay light.
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try { return typeof window !== 'undefined' && localStorage.getItem('ef_theme') === 'dark' ? 'dark' : 'light' } catch { return 'light' }
  })
  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('ef-dark', theme === 'dark')
    return () => root.classList.remove('ef-dark')
  }, [theme])
  const changeTheme = (v: 'light' | 'dark') => { try { localStorage.setItem('ef_theme', v) } catch { /* ignore */ } setTheme(v) }

  // ── Which sections start open (Settings → Open when the dashboard loads) ──
  const [openDefaults, setOpenDefaults] = useState<OpenDefaults>(OPEN_DEFAULTS)
  const [insightsOpen, setInsightsOpen] = useState(OPEN_DEFAULTS.insights)
  const applyOpen = (d: OpenDefaults) => {
    setDailyOpen(d.daily); setReservedOpen(d.reserved); setTrendOpen(d.trend); setCatOpen(d.category); setInsightsOpen(d.insights)
  }
  useEffect(() => {
    try {
      const raw = localStorage.getItem('ef_open_defaults')
      if (!raw) return
      const saved = { ...OPEN_DEFAULTS, ...JSON.parse(raw) } as OpenDefaults
      setOpenDefaults(saved); applyOpen(saved)
    } catch { /* ignore bad or missing data */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  // Changing a default also opens/closes that section right away, so the effect is visible
  const changeOpenDefault = (key: keyof OpenDefaults, value: boolean) => {
    const next = { ...openDefaults, [key]: value }
    setOpenDefaults(next)
    try { localStorage.setItem('ef_open_defaults', JSON.stringify(next)) } catch { /* ignore */ }
    if (key === 'daily') setDailyOpen(value)
    else if (key === 'reserved') setReservedOpen(value)
    else if (key === 'trend') setTrendOpen(value)
    else if (key === 'category') setCatOpen(value)
    else setInsightsOpen(value)
  }

  const init = async () => {
    const { data: userData } = await supabase.auth.getUser()
    const user = userData.user
    if (!user) { router.push('/login'); return }
    setUserEmail(user.email ?? '')
    const rawName = user.user_metadata?.full_name ?? user.email?.split('@')[0] ?? ''
    setFullName(rawName.split(' ')[0])
    await Promise.all([fetchExpenses(user.id), fetchIncome(user.id), fetchBudgets(user.id), fetchGoals(user.id), fetchRecurring(user.id), fetchPools(user.id), fetchSplitBills(user.id), fetchDebts(user.id)])
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
  const fetchDebts = async (uid: string) => {
    const { data: ds } = await supabase.from('debts').select('*').eq('user_id', uid).eq('is_archived', false).order('created_at', { ascending: false })
    setDebts(ds || [])
    if (ds && ds.length > 0) {
      const { data: payments } = await supabase.from('debt_payments').select('*').eq('user_id', uid).order('created_at', { ascending: false })
      setDebtPayments(payments || [])
    }
  }

  const handleLogout = async () => { await supabase.auth.signOut(); router.push('/login') }

  const handleAddExpense = async (data: { title: string; amount: number; category: Category; note: string; date: string }) => {
    const { data: ud } = await supabase.auth.getUser(); const user = ud.user; if (!user) return
    const { date, ...rest } = data
    const { data: inserted, error } = await supabase.from('expenses').insert({ ...rest, user_id: user.id, created_at: dateWithCurrentTime(date) }).select().single()
    if (!error && inserted) setExpenses(prev => [inserted, ...prev])
    setShowAddExpense(false)
  }
  // Batch entry: one bulk insert for the expenses, then one for any budget links.
  // Budget-linked rows become pool entries (same as + Log), month taken from the row's date.
  const handleAddExpensesBatch = async (items: BatchItem[]): Promise<BatchResult> => {
    const { data: ud } = await supabase.auth.getUser(); const user = ud.user
    if (!user) return { ok: false, message: 'You are signed out. Please log in again.' }
    // Budget-linked rows mirror handleLogPoolEntry: title = budget name, typed text = note.
    // Unlinked rows keep their typed description as the title.
    const { data: inserted, error } = await supabase.from('expenses').insert(items.map(it => {
      const pool = it.poolId ? expensePools.find(p => p.id === it.poolId) : undefined
      return {
        title: pool ? pool.title : it.title,
        amount: it.amount,
        category: pool ? pool.category : it.category,   // safety net: the budget decides the category
        note: pool ? (it.title || `Pool: ${pool.title}`) : '',
        user_id: user.id, created_at: dateWithCurrentTime(it.date),
      }
    })).select()
    if (error || !inserted) return { ok: false, message: 'Could not save. Check your connection and try again.' }
    setExpenses(prev => [...(inserted as Expense[]), ...prev])

    const links = items.map((it, i) => ({ it, exp: (inserted as Expense[])[i] })).filter(x => x.it.poolId && x.exp)
    if (links.length > 0) {
      const { data: entries, error: e2 } = await supabase.from('expense_pool_entries').insert(links.map(({ it, exp }) => ({
        pool_id: it.poolId, user_id: user.id, amount: it.amount, month: it.date.slice(0, 7),
        // Same timestamp as its expense, so the budget's history shows the date picked in the row (not today)
        note: it.title, expense_id: exp.id, created_at: exp.created_at,
      }))).select()
      if (e2 || !entries) return { ok: true, warning: `${inserted.length} expenses were saved, but linking ${links.length} of them to budgets failed. You can log those budgets manually.` }
      setPoolEntries(prev => [...(entries as ExpensePoolEntry[]), ...prev])
    }
    return { ok: true }
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

  const handleAddPool = async (data: { title: string; budget_amount: number; category: Category; note: string; is_reserved: boolean }) => {
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
  // Optimistic: flip locally first so the switch feels instant, roll back on error
  const handleTogglePoolReserved = async (poolId: string, value: boolean) => {
    setExpensePools(prev => prev.map(p => p.id === poolId ? { ...p, is_reserved: value } : p))
    const { error } = await supabase.from('expense_pools').update({ is_reserved: value }).eq('id', poolId)
    if (error) setExpensePools(prev => prev.map(p => p.id === poolId ? { ...p, is_reserved: !value } : p))
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

  // ── Debts ──────────────────────────────────────────────────────────────────
  const handleAddDebt = async (data: { person_name: string; amount: number; note: string; due_date: string }) => {
    const { data: ud } = await supabase.auth.getUser(); const user = ud.user; if (!user) return
    const { data: inserted, error } = await supabase.from('debts')
      .insert({ ...data, due_date: data.due_date || null, user_id: user.id, is_archived: false }).select().single()
    if (!error && inserted) setDebts(prev => [inserted, ...prev])
    setShowAddDebt(false)
  }
  const handleLogDebtPayment = async (debtId: string, amount: number, note: string) => {
    const { data: ud } = await supabase.auth.getUser(); const user = ud.user; if (!user) return
    const { data: inserted, error } = await supabase.from('debt_payments')
      .insert({ debt_id: debtId, user_id: user.id, amount, note: note.trim() || null }).select().single()
    if (!error && inserted) setDebtPayments(prev => [inserted, ...prev])
    setLoggingDebt(null)
  }
  const handleDeleteDebtPayment = async (payment: DebtPayment) => {
    await supabase.from('debt_payments').delete().eq('id', payment.id)
    setDebtPayments(prev => prev.filter(p => p.id !== payment.id))
  }
  const handleEditDebt = async (debtId: string, updated: Partial<Pick<Debt, 'person_name' | 'amount' | 'note' | 'due_date'>>) => {
    const { error } = await supabase.from('debts').update(updated).eq('id', debtId)
    if (!error) {
      setDebts(prev => prev.map(d => d.id === debtId ? { ...d, ...updated } : d))
      setOpenDebt(prev => prev?.id === debtId ? { ...prev, ...updated } : prev)
    }
  }
  const handleArchiveDebt = async (debtId: string) => {
    await supabase.from('debts').update({ is_archived: true }).eq('id', debtId)
    setDebts(prev => prev.filter(d => d.id !== debtId))
    setOpenDebt(prev => prev?.id === debtId ? null : prev)
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
  const debtsWithStats = useMemo<DebtWithStats[]>(() =>
    debts.map(debt => {
      const payments  = debtPayments.filter(p => p.debt_id === debt.id)
      const paid      = payments.reduce((s, p) => s + p.amount, 0)
      const remaining = debt.amount - paid
      const settled   = remaining <= 0
      const overdue   = !settled && !!debt.due_date && new Date(debt.due_date) < new Date(new Date().toDateString())
      return { debt, payments, paid, remaining, pct: Math.min(debt.amount > 0 ? (paid / debt.amount) * 100 : 0, 100), settled, overdue }
    }), [debts, debtPayments])
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

  // ── Reserved money ("floating loss") ──
  // Money already promised this month but not yet recorded as an expense:
  // the unlogged part of every budget + bills still due before month end.
  // Only meaningful for the current month — in a past month unspent budget
  // simply wasn't spent.
  const reserved = useMemo(() => {
    const now = new Date()
    const [yr, mo] = selectedMonth.split('-').map(Number)
    const isCurrentMonth = yr === now.getFullYear() && mo === now.getMonth() + 1
    const todayIso = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`

    // Every budget, with how much of it is still unlogged. Flexible budgets
    // (is_reserved === false) are listed but don't count toward the total.
    const poolItems = poolsThisMonth.map(p => ({
      pool: p.pool, spent: p.spent,
      left: Math.max(p.pool.budget_amount - p.spent, 0),
      on: p.pool.is_reserved !== false,
    }))

    // Bills still due on or before month end. Paying a bill advances next_due,
    // so counting from next_due skips paid occurrences and keeps later ones.
    const monthEnd = `${selectedMonth}-${String(new Date(yr, mo, 0).getDate()).padStart(2, '0')}`
    const billItems: { bill: RecurringExpense; times: number; amount: number; firstDue: string; overdue: boolean }[] = []
    recurring.forEach(r => {
      let due = r.next_due.slice(0, 10), steps = 0, times = 0
      const firstDue = due
      while (due <= monthEnd && steps < 62) { times++; due = nextDueDate(due, r.frequency); steps++ }
      if (times > 0) billItems.push({ bill: r, times, amount: r.amount * times, firstDue, overdue: firstDue < todayIso })
    })
    billItems.sort((x, y) => x.firstDue.localeCompare(y.firstDue))

    const pools = isCurrentMonth ? poolItems.filter(p => p.on).reduce((s, p) => s + p.left, 0) : 0
    const flexible = isCurrentMonth ? poolItems.filter(p => !p.on).reduce((s, p) => s + p.left, 0) : 0
    const bills = isCurrentMonth ? billItems.reduce((s, b) => s + b.amount, 0) : 0
    const total = pools + bills
    return {
      isCurrentMonth, poolItems, billItems, pools, bills, flexible, total,
      poolCount: poolItems.filter(p => p.on && p.left > 0).length,
      billCount: billItems.length,
      active: isCurrentMonth && total > 0,
    }
  }, [poolsThisMonth, recurring, selectedMonth])
  const freeToSpend = netSavings - reserved.total

  const safeToSpendPerDay = useMemo(() => {
    const now = new Date()
    const [yr, mo] = selectedMonth.split('-').map(Number)
    const isCurrentMonth = yr === now.getFullYear() && mo === now.getMonth() + 1
    const daysInMonth = new Date(yr, mo, 0).getDate()
    const daysLeft = isCurrentMonth ? Math.max(daysInMonth - now.getDate() + 1, 1) : 0
    return { perDay: daysLeft > 0 ? Math.max(freeToSpend, 0) / daysLeft : 0, daysLeft, isCurrentMonth }
  }, [freeToSpend, selectedMonth])

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

  // ── Daily spending ──────────────────────────────────────────────────────────
  // Day bucketing is LOCAL-time only: created_at is written timezone-naive by
  // localISOString(), so toISOString() would shift late-evening expenses into
  // the next day. Same idiom as dailyBalanceSeries below.
  const dailySpend = useMemo<DailySpendData>(() => {
    const [yr, mo] = selectedMonth.split('-').map(Number)
    const daysInMonth = new Date(yr, mo, 0).getDate()
    const now = new Date()
    const isCurrentMonth = yr === now.getFullYear() && mo === now.getMonth() + 1
    const isFutureMonth  = yr > now.getFullYear() || (yr === now.getFullYear() && mo > now.getMonth() + 1)
    const todayDay    = isCurrentMonth ? now.getDate() : null
    const elapsedDays = isFutureMonth ? 0 : isCurrentMonth ? now.getDate() : daysInMonth

    const totals = new Array<number>(daysInMonth).fill(0)
    const counts = new Array<number>(daysInMonth).fill(0)
    thisMonthExpenses.forEach(e => {
      const d = new Date(e.created_at).getDate()
      if (d >= 1 && d <= daysInMonth) { totals[d - 1] += e.amount; counts[d - 1] += 1 }
    })

    const firstDow = new Date(yr, mo - 1, 1).getDay()      // 0 = Sunday
    const days: DaySpend[] = totals.map((total, i) => ({
      day: i + 1,
      dow: (firstDow + i) % 7,
      total, count: counts[i],
      // A day that hasn't happened is NOT a no-spend day.
      isFuture: i + 1 > elapsedDays,
      isToday: i + 1 === todayDay,
    }))

    const elapsed = days.filter(d => !d.isFuture)
    const active  = elapsed.filter(d => d.total > 0).map(d => d.total).sort((a, b) => a - b)
    const median  = active.length === 0 ? 0
      : active.length % 2 ? active[(active.length - 1) / 2]
      : (active[active.length / 2 - 1] + active[active.length / 2]) / 2

    return {
      days, daysInMonth,
      leadingBlanks: (firstDow + 6) % 7,                   // Monday-first
      elapsedDays, isCurrentMonth, todayDay,
      monthTotal: totals.reduce((s, v) => s + v, 0),
      maxDay: elapsed.length ? Math.max(...elapsed.map(d => d.total)) : 0,
      spentDayCount: active.length,
      noSpendDayCount: elapsed.length - active.length,
      avgPerActiveDay: active.length ? active.reduce((s, v) => s + v, 0) / active.length : 0,
      medianActiveDay: median,
    }
  }, [thisMonthExpenses, selectedMonth])

  // Averages divide by elapsed OCCURRENCES of each weekday — not by 7, and not
  // by the calendar count. A Friday that happened with zero spend counts; a
  // Friday that hasn't arrived yet does not.
  const dowStats = useMemo<DowStat[]>(() => {
    const sum = new Array(7).fill(0), occ = new Array(7).fill(0), tx = new Array(7).fill(0)
    dailySpend.days.forEach(d => {
      if (d.isFuture) return
      const col = (d.dow + 6) % 7                          // Monday-first column
      sum[col] += d.total; occ[col] += 1; tx[col] += d.count
    })
    return WEEKDAY_LABELS.map((label, i) => ({
      idx: i, label, total: sum[i], occurrences: occ[i],
      avg: occ[i] ? sum[i] / occ[i] : 0, txCount: tx[i],
    }))
  }, [dailySpend])

  const dailyRecords = useMemo<DailyRecords>(() => {
    const elapsed = dailySpend.days.filter(d => !d.isFuture)
    const spent   = elapsed.filter(d => d.total > 0)
    const highest  = spent.reduce<DaySpend | null>((m, d) => !m || d.total > m.total ? d : m, null)
    const quietest = spent.reduce<DaySpend | null>((m, d) => !m || d.total < m.total ? d : m, null)

    let longest = 0, run = 0, longestEnd = 0
    elapsed.forEach(d => {
      if (d.total === 0) { run++; if (run > longest) { longest = run; longestEnd = d.day } }
      else run = 0
    })
    let current = 0
    for (let i = elapsed.length - 1; i >= 0 && elapsed[i].total === 0; i--) current++

    const withData = dowStats.filter(s => s.occurrences > 0)
    const wkndOcc = dowStats[5].occurrences + dowStats[6].occurrences
    const wdayOcc = dowStats.slice(0, 5).reduce((s, x) => s + x.occurrences, 0)
    return {
      highest, quietest, longestNoSpend: longest, longestNoSpendEnd: longestEnd,
      currentNoSpend: current,
      heaviestDow: withData.reduce<DowStat | null>((m, s) => !m || s.avg > m.avg ? s : m, null),
      lightestDow: withData.reduce<DowStat | null>((m, s) => !m || s.avg < m.avg ? s : m, null),
      weekendAvg: wkndOcc ? (dowStats[5].total + dowStats[6].total) / wkndOcc : 0,
      weekdayAvg: wdayOcc ? dowStats.slice(0, 5).reduce((s, x) => s + x.total, 0) / wdayOcc : 0,
    }
  }, [dailySpend, dowStats])

  // Spending pace: cumulative spend per day-of-month, this month vs last month.
  // Same LOCAL-time day bucketing as dailySpend.
  const spendingPace = useMemo(() => {
    const [yr, mo] = selectedMonth.split('-').map(Number)
    const lastDays = new Date(yr, mo - 1, 0).getDate()     // days in previous month
    const cumulative = (list: Expense[], len: number) => {
      const perDay = new Array<number>(len).fill(0)
      list.forEach(e => { const d = new Date(e.created_at).getDate(); if (d >= 1 && d <= len) perDay[d - 1] += e.amount })
      let run = 0
      return perDay.map(v => (run += v))
    }
    return {
      thisSeries: cumulative(thisMonthExpenses, dailySpend.daysInMonth).slice(0, dailySpend.elapsedDays),
      lastSeries: cumulative(lastMonthExpenses, lastDays),
    }
  }, [thisMonthExpenses, lastMonthExpenses, selectedMonth, dailySpend.daysInMonth, dailySpend.elapsedDays])

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

  // ── Expert-view derived data (real numbers, no placeholders) ──
  // Running account balance per day across the selected month: starts at the
  // balance the account actually had on day 1 (all prior income − all prior
  // expenses), then walks forward applying that day's real income/expenses.
  const dailyBalanceSeries = useMemo(() => {
    const [yr, mo] = selectedMonth.split('-').map(Number)
    const monthStart = new Date(yr, mo - 1, 1)
    const daysInMonth = new Date(yr, mo, 0).getDate()
    const now = new Date()
    const isCurrentMonth = yr === now.getFullYear() && mo === now.getMonth() + 1
    const lastDay = isCurrentMonth ? now.getDate() : daysInMonth

    const startBalance =
      income.filter(i => new Date(i.created_at) < monthStart).reduce((s, i) => s + i.amount, 0) -
      expenses.filter(e => new Date(e.created_at) < monthStart).reduce((s, e) => s + e.amount, 0)

    const netPerDay = new Array(daysInMonth).fill(0)
    thisMonthIncome.forEach(i => { const d = new Date(i.created_at).getDate(); if (d >= 1 && d <= daysInMonth) netPerDay[d - 1] += i.amount })
    thisMonthExpenses.forEach(e => { const d = new Date(e.created_at).getDate(); if (d >= 1 && d <= daysInMonth) netPerDay[d - 1] -= e.amount })

    let running = startBalance
    const series: { day: number; balance: number }[] = []
    for (let d = 1; d <= lastDay; d++) {
      running += netPerDay[d - 1]
      series.push({ day: d, balance: running })
    }
    return series
  }, [thisMonthIncome, thisMonthExpenses, income, expenses, selectedMonth])

  // Per-month income totals for the last 6 months (mirror of last6Months)
  const incomeLast6Months = useMemo(() => {
    const result: { key: string; label: string; total: number }[] = []
    const now = new Date(); const yr = now.getFullYear(); const mo = now.getMonth()
    for (let i = 5; i >= 0; i--) {
      let m = mo - i; let y = yr
      if (m < 0) { m += 12; y -= 1 }
      const key = `${y}-${String(m + 1).padStart(2, '0')}`
      const total = income.filter(x => inMonth(x.created_at, key)).reduce((s, x) => s + x.amount, 0)
      result.push({ key, label: MONTHS_SHORT[m], total })
    }
    return result
  }, [income])

  // Monthly budget progress: prefer sum of category budgets, else fall back to income
  const monthlyProgress = useMemo(() => {
    const budgetSum = budgets.reduce((s, b) => s + b.limit_amount, 0)
    const budget = budgetSum > 0 ? budgetSum : thisMonthIncomeTot
    const spent = thisMonthTotal
    const pct = budget > 0 ? Math.min((spent / budget) * 100, 100) : 0
    return { budget, spent, pct, left: Math.max(budget - spent, 0), basis: budgetSum > 0 ? 'budget' as const : 'income' as const }
  }, [budgets, thisMonthIncomeTot, thisMonthTotal])

  // Primary savings goal for the Monthly Progress card (first not-yet-completed, else highest target)
  const primaryGoal = useMemo(() => {
    if (savingsGoals.length === 0) return null
    const active = savingsGoals.filter(g => g.current_amount < g.target_amount)
    const pick = (active.length > 0 ? active : savingsGoals).slice().sort((a, b) => b.target_amount - a.target_amount)[0]
    return pick ?? null
  }, [savingsGoals])

  const savingsRatePct = thisMonthIncomeTot > 0 ? (netSavings / thisMonthIncomeTot) * 100 : 0

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

  // ── Reserved money panel ── built once, shown by both Legacy (collapsible card)
  // and Expert (Dashboard + Budgets sections) so the two never drift apart.
  const reservedPanel = (() => {
    const short = freeToSpend < 0
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0)
    const dueLabel = (iso: string, overdue: boolean) => {
      if (overdue) return { text: 'Overdue', cls: 'text-red-600' }
      const d = new Date(`${iso}T00:00:00`)
      const days = Math.round((d.getTime() - todayStart.getTime()) / 86_400_000)
      if (days === 0) return { text: 'Due today', cls: 'text-amber-600' }
      if (days <= 3) return { text: `Due in ${days}d`, cls: 'text-amber-600' }
      return { text: `Due ${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`, cls: 'text-gray-400' }
    }
    return (
      <div>
              {/* 1. The answer, first and big */}
              <div className={`rounded-2xl px-4 py-4 ${short ? 'bg-red-50' : 'bg-emerald-50'}`}>
                <p className={`text-[11px] font-medium ${short ? 'text-red-700' : 'text-emerald-700'}`}>
                  {short ? 'You need more money' : 'You can still spend'}
                </p>
                <p className={`text-2xl font-semibold tracking-tight tabular-nums mt-0.5 ${short ? 'text-red-700' : 'text-emerald-800'}`}>
                  {fmt(Math.abs(freeToSpend))}
                </p>
                <p className={`text-xs mt-1.5 leading-relaxed ${short ? 'text-red-700/80' : 'text-emerald-800/80'}`}>
                  {short
                    ? 'Your budgets and bills cost more than what you have left. Turn off a budget you can skip.'
                    : <>About <strong className="font-semibold">{fmt(Math.round(safeToSpendPerDay.perDay))} a day</strong> for the next {safeToSpendPerDay.daysLeft} {safeToSpendPerDay.daysLeft === 1 ? 'day' : 'days'}.</>}
                </p>
              </div>

              {/* 2. How we got there — a simple receipt */}
              <div className="mt-4 rounded-2xl border border-gray-100 px-4 py-1">
                {[
                  { label: 'Money left', hint: 'Income minus spending so far', value: netSavings, sign: '' },
                  { label: 'Kept for budgets', hint: `${reserved.poolCount} ${reserved.poolCount === 1 ? 'budget' : 'budgets'}`, value: reserved.pools, sign: '−' },
                  { label: 'Bills to pay', hint: `${reserved.billCount} ${reserved.billCount === 1 ? 'bill' : 'bills'} this month`, value: reserved.bills, sign: '−' },
                ].map(row => (
                  <div key={row.label} className="flex items-center justify-between gap-3 py-2.5 border-b border-gray-100">
                    <div className="min-w-0">
                      <p className="text-sm text-gray-800">{row.label}</p>
                      <p className="text-[11px] text-gray-400 truncate">{row.hint}</p>
                    </div>
                    <p className={`text-sm tabular-nums shrink-0 ${row.sign ? 'text-gray-600' : 'font-medium text-black'}`}>
                      {row.sign && <span className="text-gray-400 mr-1">{row.sign}</span>}
                      {row.value < 0 && !row.sign ? '-' : ''}{fmt(Math.abs(row.value))}
                    </p>
                  </div>
                ))}
                <div className="flex items-center justify-between gap-3 py-3">
                  <p className="text-sm font-semibold text-black">{short ? 'Not enough by' : 'You can spend'}</p>
                  <p className={`text-sm font-semibold tabular-nums ${short ? 'text-red-600' : 'text-emerald-600'}`}>{fmt(Math.abs(freeToSpend))}</p>
                </div>
              </div>

              {/* 3. Budgets — choose what to set aside */}
              {reserved.poolItems.length > 0 && (
                <div className="mt-5">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-semibold text-black">Your budgets</p>
                    <span className="text-[10px] font-semibold text-gray-500 bg-gray-100 rounded-full px-1.5 py-0.5">{reserved.poolItems.length}</span>
                  </div>
                  <div className="flex flex-col divide-y divide-gray-100">
                    {reserved.poolItems.map(({ pool, spent: used, left, on }) => {
                      const cfg = CATEGORY_CONFIG[pool.category]
                      const over = used > pool.budget_amount
                      return (
                        <div key={pool.id} className="flex items-center gap-3 py-2.5">
                          <div className={`w-8 h-8 rounded-xl ${cfg.bg} flex items-center justify-center shrink-0 ${on ? '' : 'opacity-50'}`}><span className={cfg.text}>{cfg.icon}</span></div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm truncate ${on ? 'text-gray-900' : 'text-gray-500'}`}>{pool.title}</p>
                            <p className={`text-[11px] truncate ${over ? 'text-red-500' : 'text-gray-400'}`}>
                              {over ? `Over by ${fmt(used - pool.budget_amount)}`
                                : left === 0 ? 'All used'
                                : on ? `${fmt(left)} kept`
                                : `Skipped · ${fmt(left)} free to use`}
                            </p>
                          </div>
                          <button role="switch" aria-checked={on} aria-label={`Keep money for ${pool.title}`}
                            title={on ? 'Kept — tap to skip' : 'Skipped — tap to keep'}
                            onClick={() => handleTogglePoolReserved(pool.id, !on)}
                            className={`relative w-9 h-5 rounded-full shrink-0 transition-colors ${on ? 'bg-black' : 'bg-gray-200'}`}>
                            <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${on ? 'translate-x-4' : ''}`} />
                          </button>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* 4. Bills still to pay */}
              {reserved.billItems.length > 0 && (
                <div className="mt-5">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-semibold text-black">Bills to pay</p>
                    <span className="text-[10px] font-semibold text-gray-500 bg-gray-100 rounded-full px-1.5 py-0.5">{reserved.billItems.length}</span>
                  </div>
                  <div className="flex flex-col divide-y divide-gray-100">
                    {reserved.billItems.map(({ bill, times, amount, firstDue, overdue }) => {
                      const cfg = CATEGORY_CONFIG[bill.category]
                      const due = dueLabel(firstDue, overdue)
                      const paying = payingBillId === bill.id
                      return (
                        <div key={bill.id} className="flex items-center gap-3 py-2.5">
                          <div className={`w-8 h-8 rounded-xl ${cfg.bg} flex items-center justify-center shrink-0`}><span className={cfg.text}>{cfg.icon}</span></div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-900 truncate">
                              {bill.title}
                              {times > 1 && <span className="ml-1.5 text-[10px] text-gray-400 font-medium">{times}x</span>}
                            </p>
                            <p className={`text-[11px] ${due.cls}`}>{due.text} · {fmt(amount)}</p>
                          </div>
                          <button onClick={() => handlePayBill(bill)} disabled={paying}
                            className="flex items-center justify-center gap-1 h-8 px-3 rounded-full border border-gray-200 text-xs font-medium text-gray-700 hover:border-black hover:text-black transition-all shrink-0 disabled:opacity-50">
                            {paying ? <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" /> : <><Check size={12} /> Mark paid</>}
                          </button>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              <div className="mt-4 rounded-xl bg-gray-50 px-3 py-2.5 flex items-start gap-2">
                <Lightbulb size={13} className="text-gray-400 shrink-0 mt-0.5" />
                <p className="text-[11px] text-gray-500 leading-relaxed">
                  Spent from a budget? Tap <strong className="font-medium text-gray-700">+ Log</strong>{' '}on the Budgets tab so it&apos;s only counted once.
                </p>
              </div>
      </div>
    )
  })()

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
        .stat-card { animation: slideUp 0.3s ease both; transition: transform 0.2s ease, box-shadow 0.2s ease; }
        .stat-card:hover { transform: translateY(-2px); box-shadow: 0 10px 28px -12px rgba(16,24,40,0.15); }
        .stat-card:nth-child(1){animation-delay:0.03s} .stat-card:nth-child(2){animation-delay:0.07s}
        .stat-card:nth-child(3){animation-delay:0.11s} .stat-card:nth-child(4){animation-delay:0.15s}
        .row-item { animation: slideUp 0.22s ease both; }
        @keyframes popIn { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        .animate-pop-in { animation: popIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) both; }
        .legend-row { animation: slideUp 0.3s ease both; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .thin-scrollbar { scrollbar-width: thin; scrollbar-color: #d1d5db transparent; }
        .thin-scrollbar::-webkit-scrollbar { height: 6px; }
        .thin-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .thin-scrollbar::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 9999px; }
        .thin-scrollbar::-webkit-scrollbar-thumb:hover { background: #9ca3af; }

        /* ── Budget simulator ─────────────────────────────────────────── */
        .tab-indicator { transition: transform 0.28s cubic-bezier(0.4, 0, 0.2, 1); }
        .bar-fill { transition: width 0.35s cubic-bezier(0.4,0,0.2,1), background-color 0.25s ease; }

        .budget-slider { -webkit-appearance: none; appearance: none; width: 100%; height: 14px; background: transparent; cursor: pointer; }
        .budget-slider::-webkit-slider-runnable-track { height: 4px; border-radius: 9999px; background: var(--track); transition: background 0.25s ease; }
        .budget-slider::-moz-range-track { height: 4px; border-radius: 9999px; background: var(--track); transition: background 0.25s ease; }
        .budget-slider::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 11px; height: 11px; margin-top: -3.5px; border-radius: 9999px; background: #111110; border: 2px solid #fff; box-shadow: 0 0 0 1px rgba(0,0,0,.14); transition: transform 0.15s ease, box-shadow 0.15s ease; }
        .budget-slider::-moz-range-thumb { width: 11px; height: 11px; border: 2px solid #fff; border-radius: 9999px; background: #111110; box-shadow: 0 0 0 1px rgba(0,0,0,.14); }
        .budget-slider:hover::-webkit-slider-thumb { transform: scale(1.25); }
        .budget-slider:focus-visible { outline: none; }
        .budget-slider:focus-visible::-webkit-slider-thumb { transform: scale(1.25); box-shadow: 0 0 0 3px rgba(17,17,16,.18); }
        .budget-slider:disabled { cursor: not-allowed; opacity: .45; }
        /* the row under the thumb tracks the pointer 1:1 while other rows animate */
        .budget-slider.dragging::-webkit-slider-runnable-track { transition: none; }
        .budget-slider.dragging::-moz-range-track { transition: none; }

        @keyframes valuePulse { from { opacity: .4; transform: translateY(-1px); } to { opacity: 1; transform: none; } }
        .value-pulse { animation: valuePulse 0.25s ease both; }
        @keyframes surplusPop { 0% { transform: scale(.94); } 60% { transform: scale(1.04); } 100% { transform: scale(1); } }
        .surplus-pop { animation: surplusPop 0.35s cubic-bezier(0.34,1.56,0.64,1) both; }

        /* ── Daily spending heatmap ───────────────────────────────────── */
        @keyframes heatIn { from { transform: scale(.72); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        .heat-cell { animation: heatIn .28s cubic-bezier(.34,1.56,.64,1) both;
                     transition: transform .15s ease, box-shadow .15s ease; }
        .heat-cell:hover { transform: scale(1.08); z-index: 5; }
        .heat-bar { transition: height .4s cubic-bezier(.4,0,.2,1); }

        @media (prefers-reduced-motion: reduce) {
          .animate-slide-up, .stat-card, .row-item, .animate-pop-in, .legend-row,
          .value-pulse, .surplus-pop, .heat-cell { animation: none !important; }
          .tab-indicator, .bar-fill, .heat-bar, .budget-slider::-webkit-slider-runnable-track,
          .budget-slider::-webkit-slider-thumb { transition: none !important; }
          .stat-card:hover, .heat-cell:hover { transform: none; }
        }
      `}</style>

      {viewMode === 'expert' ? (
        <ExpertView
          fullName={fullName}
          reservedPanel={reservedPanel}
          reservedSummary={{ active: reserved.active, total: reserved.total, isCurrentMonth: reserved.isCurrentMonth, hasItems: reserved.poolItems.length > 0 || reserved.billItems.length > 0 }}
          freeToSpend={freeToSpend} spendingPace={spendingPace}
          showIncome={showIncome} setShowIncome={setShowIncome}
          showExpenses={showExpenses} setShowExpenses={setShowExpenses}
          selectedMonth={selectedMonth} setSelectedMonth={setSelectedMonth}
          last6Months={last6Months} incomeLast6Months={incomeLast6Months}
          cumulativeBalance={cumulativeBalance} netSavings={netSavings}
          thisMonthIncomeTot={thisMonthIncomeTot} thisMonthTotal={thisMonthTotal} lastMonthTotal={lastMonthTotal}
          monthOverMonthPct={monthOverMonthPct} spendingRate={spendingRate} avgPerDay={avgPerDay}
          safeToSpendPerDay={safeToSpendPerDay} savingsRatePct={savingsRatePct} dailyBalanceSeries={dailyBalanceSeries}
          dailySpend={dailySpend} dowStats={dowStats} dailyRecords={dailyRecords} setOpenDay={setOpenDay}
          monthlyProgress={monthlyProgress} primaryGoal={primaryGoal}
          categoryTotals={categoryTotals} weeklyData={weeklyData} maxMonthly={maxMonthly} maxWeekly={maxWeekly}
          chartView={chartView} setChartView={setChartView}
          budgets={budgets} budgetSpend={budgetSpend}
          expenses={expenses} income={income} recurring={recurring}
          savingsGoals={savingsGoals} expensePools={expensePools} splitBills={splitBills} debts={debts}
          filteredExpenses={filteredExpenses} filteredIncome={filteredIncome} thisMonthIncome={thisMonthIncome}
          poolsThisMonth={poolsThisMonth} splitBillsWithStats={billsWithStats} debtsWithStats={debtsWithStats}
          billsDueSoon={billsDueSoon}
          activeFilter={activeFilter} setActiveFilter={setActiveFilter}
          searchQuery={searchQuery} setSearchQuery={setSearchQuery}
          showFilters={showFilters} setShowFilters={setShowFilters}
          sortOrder={sortOrder} setSortOrder={setSortOrder}
          minAmount={minAmount} setMinAmount={setMinAmount}
          maxAmount={maxAmount} setMaxAmount={setMaxAmount}
          showTotalBalance={showTotalBalance} setShowTotalBalance={setShowTotalBalance}
          localPaidBills={localPaidBills} payingBillId={payingBillId} deletingBillId={deletingBillId}
          handlePayBill={handlePayBill} handleUndoPayBill={handleUndoPayBill}
          handleDeleteBill={handleDeleteBill} setEditingBill={setEditingBill}
          setShowAddExpense={setShowAddExpense} setShowAddIncome={setShowAddIncome} setShowAddBill={setShowAddBill}
          setShowAddPool={setShowAddPool} setShowAddSplitBill={setShowAddSplitBill}
          setShowAddDebt={setShowAddDebt} setShowAddGoal={setShowAddGoal}
          setShowSimulator={setShowSimulator} setShowSettings={setShowSettings}
          setEditingExpense={setEditingExpense} setDeletingExpense={setDeletingExpense}
          setEditingIncome={setEditingIncome} handleDeleteIncome={handleDeleteIncome}
          setOpenPool={setOpenPool} setLoggingPool={setLoggingPool} handleArchivePool={handleArchivePool}
          setOpenSplitBill={setOpenSplitBill} handleDeleteSplitBill={handleDeleteSplitBill}
          setOpenDebt={setOpenDebt} setLoggingDebt={setLoggingDebt} handleArchiveDebt={handleArchiveDebt}
          setOpenGoal={setOpenGoal}
          onLogout={handleLogout}
        />
      ) : (
      <div className="ef-canvas min-h-screen bg-(--ef-page)">
        {/* ── Sticky Top Bar ── */}
        <header className="ef-header sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-gray-100">
          <div className="max-w-2xl mx-auto px-4 sm:px-5 py-2.5">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0">
                {/* Black logo in light mode, white logo in dark mode (switched in globals.css) */}
                <img src="/logo.png" alt="ExpenseFlow logo" className="ef-logo-light w-full h-full object-cover" />
                <img src="/logo2.png" alt="" aria-hidden="true" className="ef-logo-dark w-full h-full object-cover" />
              </div>
              <div>
                <h1 className="text-base font-bold text-black leading-none tracking-tight">ExpenseFlow</h1>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-2">
              <button onClick={() => setShowSearch(v => !v)} title="Search"
                className={`w-8 h-8 flex items-center justify-center border rounded-full shadow-sm transition-all ${showSearch ? 'bg-black border-black text-white' : 'bg-white border-gray-200 text-black hover:border-black'}`}>
                <Search size={14} />
              </button>
              <button onClick={() => setShowAddIncome(true)}
                className="flex items-center gap-2 h-8 px-3.5 bg-white border border-gray-200 shadow-sm hover:border-black text-black rounded-full text-sm font-semibold transition-all active:scale-[.98]">
                <ArrowUpCircle size={14} /> Income
              </button>
              <button onClick={() => setShowAddExpense(true)}
                className="flex items-center gap-2 h-8 px-3.5 bg-black hover:bg-gray-800 active:scale-[.98] text-white rounded-full text-sm font-semibold shadow-sm transition-all">
                <ArrowDownCircle size={14} /> Expenses
              </button>
              <div className="relative" ref={deskMenuRef}>
                <button onClick={() => setDeskMenuOpen(v => !v)} title="More"
                  aria-haspopup="menu" aria-expanded={deskMenuOpen}
                  className={`w-8 h-8 flex items-center justify-center border rounded-full shadow-sm transition-all active:scale-[.98] ${deskMenuOpen ? 'bg-black border-black text-white' : 'bg-white border-gray-200 text-black hover:border-black'}`}>
                  <MoreHorizontal size={15} />
                </button>
                {deskMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-100 rounded-2xl shadow-lg z-200 py-1.5 animate-slide-up">
                    <button onClick={() => { setShowSimulator(true); setDeskMenuOpen(false) }} className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-gray-700 hover:bg-gray-50"><Calculator size={14} className="text-purple-500" /> Budget Simulator</button>
                    <button onClick={() => { setShowAddBill(true); setDeskMenuOpen(false) }} className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-gray-700 hover:bg-gray-50"><CreditCard size={14} className="text-blue-500" /> Add Bill</button>
                    <button onClick={() => { exportCSV(expenses, income, selectedMonth); setDeskMenuOpen(false) }} className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-gray-700 hover:bg-gray-50"><Download size={14} className="text-gray-500" /> Export CSV</button>
                    <button onClick={() => { setShowSettings(true); setDeskMenuOpen(false) }} className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-gray-700 hover:bg-gray-50"><Settings size={14} className="text-gray-500" /> Settings</button>
                    <div className="h-px bg-gray-100 my-1" />
                    <button onClick={() => { handleLogout(); setDeskMenuOpen(false) }} className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-red-500 hover:bg-red-50"><LogOut size={14} /> Logout</button>
                  </div>
                )}
              </div>
            </div>
            <div className="flex sm:hidden items-center gap-2" ref={menuRef}>
              <button onClick={() => setShowSearch(v => !v)} title="Search"
                className={`w-8 h-8 flex items-center justify-center rounded-full border shadow-sm transition-all ${showSearch ? 'bg-black border-black text-white' : 'bg-white border-gray-200 text-black'}`}>
                <Search size={14} />
              </button>
              <div className="relative">
                <button onClick={() => setMenuOpen(v => !v)} title="Menu"
                  className={`w-8 h-8 flex items-center justify-center border rounded-full shadow-sm transition-all ${menuOpen ? 'bg-black border-black text-white' : 'bg-white border-gray-200 text-black'}`}>
                  <Menu size={15} />
                </button>
                {menuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-100 rounded-2xl shadow-lg z-200 py-1.5 animate-slide-up">
                    <button onClick={() => { exportCSV(expenses, income, selectedMonth); setMenuOpen(false) }} className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-gray-700 hover:bg-gray-50"><Download size={14} className="text-gray-500" /> Export CSV</button>
                    <button onClick={() => { setShowAddIncome(true); setMenuOpen(false) }} className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-gray-700 hover:bg-gray-50"><ArrowUpCircle size={14} className="text-green-600" /> Add Income</button>
                    <button onClick={() => { setShowAddExpense(true); setMenuOpen(false) }} className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-gray-700 hover:bg-gray-50"><ArrowDownCircle size={14} /> Add Expense</button>
                    <button onClick={() => { setShowAddBill(true); setMenuOpen(false) }} className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-gray-700 hover:bg-gray-50"><CreditCard size={14} className="text-blue-500" /> Add Bill</button>
                    <button onClick={() => { setShowSimulator(true); setMenuOpen(false) }} className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-gray-700 hover:bg-gray-50"><Calculator size={14} className="text-purple-500" /> Budget Simulator</button>
                    <button onClick={() => { setShowSettings(true); setMenuOpen(false) }} className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-gray-700 hover:bg-gray-50"><Settings size={14} className="text-gray-500" /> Settings</button>
                    <div className="h-px bg-gray-100 my-1" />
                    <button onClick={() => { handleLogout(); setMenuOpen(false) }} className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-red-500 hover:bg-red-50"><LogOut size={14} /> Logout</button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Search */}
          {showSearch && (
            <div className="relative mt-2.5 animate-slide-up">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input autoFocus value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search expenses, income, notes..."
                className="w-full bg-white border border-gray-200 rounded-full pl-9 pr-9 py-2.5 text-sm text-black focus:outline-none focus:border-black transition" />
              {searchQuery && <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black"><X size={14} /></button>}
            </div>
          )}
          </div>
        </header>

        <div className="max-w-2xl mx-auto px-4 sm:px-5 py-5">

          {/* ── Welcome + Balance Card ── */}
          <div className="mb-3">
            {fullName && (
              <p className="text-xl font-normal text-black mb-3 tracking-tight">
                Welcome back, <span className="text-gray-400 font-normal">{fullName}</span>
              </p>
            )}

            {/* Month picker — dropdown on left, arrow buttons grouped on right */}
            <div className="flex items-center gap-2 mb-2.5">
              <MonthPickerDropdown months={last6Months} selected={selectedMonth} onChange={setSelectedMonth} variant="pill" />
              <div className="flex items-center gap-2 ml-auto">
                <button
                  onClick={() => canGoPrev && setSelectedMonth(last6Months[monthIndex - 1].key)}
                  disabled={!canGoPrev}
                  title="Previous month"
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-white border border-gray-100 shadow-sm text-black hover:border-gray-300 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronLeft size={14} />
                </button>
                <button
                  onClick={() => canGoNext && setSelectedMonth(last6Months[monthIndex + 1].key)}
                  disabled={!canGoNext}
                  title="Next month"
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-white border border-gray-100 shadow-sm text-black hover:border-gray-300 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-2.5">
              {/* Total balance card */}
              <div className="ef-keep relative overflow-hidden rounded-2xl ring-1 ring-[#ffffff12] bg-linear-to-br from-[#1c1c1c] via-black to-[#0a0a0a] px-4 py-4 shadow-[0_12px_30px_-12px_rgba(0,0,0,0.45)]">
                <div aria-hidden="true" className="pointer-events-none absolute -right-16 -bottom-24 w-72 h-48 rotate-[-18deg] rounded-[40%] bg-linear-to-tr from-transparent via-white/5 to-white/10" />
                <div className="relative flex items-center justify-between mb-2.5">
                  <p className="text-[10px] text-white/70 font-semibold uppercase tracking-[0.15em]">Total balance</p>
                  <button
                    onClick={() => setShowTotalBalance(v => !v)}
                    className="text-white/60 hover:text-white transition-colors"
                    title={showTotalBalance ? 'Hide' : 'Show'}
                  >
                    {showTotalBalance ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
                <p className={`relative text-xl font-bold leading-none tracking-tight truncate ${cumulativeBalance >= 0 ? 'text-white' : 'text-red-400'}`}>
                  {showTotalBalance
                    ? fmtFull(Math.abs(cumulativeBalance))
                    : <span className="tracking-widest text-white/30 select-none text-lg">••••••</span>
                  }
                </p>
                {showTotalBalance && cumulativeBalance < 0 && (
                  <p className="relative text-[11px] text-red-400 mt-1.5">deficit</p>
                )}
                {showTotalBalance && cumulativeBalance >= 0 && (
                  <p className="relative flex items-center gap-1.5 text-xs text-white/70 mt-1.5">
                    <span className="w-3.5 h-3.5 rounded-full bg-emerald-500/90 flex items-center justify-center shrink-0"><ArrowUp size={9} className="text-black" strokeWidth={3} /></span>
                    All time
                  </p>
                )}
              </div>

              {/* Monthly balance card */}
              {(() => {
                const leftPct = 100 - monthlyProgress.pct
                const ringColor = leftPct >= 50 ? '#059669' : leftPct >= 20 ? '#f59e0b' : '#dc2626'
                return (
                  <div className={`${CARD} ef-month-card relative overflow-hidden bg-linear-to-br from-white to-slate-50/70 px-4 py-4 flex items-center gap-3`}>
                    <div aria-hidden="true" className="ef-month-glow pointer-events-none absolute -right-10 -bottom-16 w-40 h-40 rounded-full bg-slate-100/60" />
                    <div className="relative">
                      <Ring pct={leftPct} size={54} stroke={5} color={ringColor}>
                        <span className="text-xs font-bold text-black leading-none">{leftPct.toFixed(0)}%</span>
                      </Ring>
                    </div>
                    <div className="relative flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1.5">
                        <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-[0.15em]">This month</p>
                        <button
                          onClick={() => setShowMonthlyBalance(v => !v)}
                          className="text-gray-400 hover:text-gray-700 transition-colors shrink-0"
                          title={showMonthlyBalance ? 'Hide' : 'Show'}
                        >
                          {showMonthlyBalance ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>
                      <p className={`text-xl font-bold leading-none tracking-tight truncate ${netSavings >= 0 ? 'text-black' : 'text-red-600'}`}>
                        {showMonthlyBalance
                          ? fmtFull(Math.abs(netSavings))
                          : <span className="tracking-widest text-gray-300 select-none text-lg">••••••</span>
                        }
                      </p>
                      {showMonthlyBalance && (
                        <p className={`flex items-center gap-1.5 text-xs mt-1.5 ${netSavings < 0 ? 'text-red-500' : 'text-gray-600'}`}>
                          <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: netSavings < 0 ? '#dc2626' : ringColor }} />
                          {netSavings < 0 ? 'deficit' : 'Remaining'}
                        </p>
                      )}
                    </div>
                  </div>
                )
              })()}
            </div>
          </div>
          {/* ── END BALANCE SECTION ── */}

          {/* ── Stat Cards ── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-3">
            {[
              {
                label: 'Income',
                hideKey: 'income' as const,
                value: fmtShort(thisMonthIncomeTot),
                sub: `${thisMonthIncome.length} entr${thisMonthIncome.length === 1 ? 'y' : 'ies'}`,
                color: 'text-green-700',
                subIcon: <ArrowUp size={10} strokeWidth={3} />,
                icon: <ArrowDown size={13} strokeWidth={2.5} />,
                iconBg: 'bg-emerald-50 text-emerald-600',
                spark: incomeLast6Months.map(m => m.total),
                sparkColor: '#10b981',
              },
              {
                label: 'Expenses',
                hideKey: 'expenses' as const,
                value: fmtShort(thisMonthTotal),
                sub: lastMonthTotal > 0 ? `${Math.abs(monthOverMonthPct).toFixed(0)}% vs last mo.` : 'No prior data',
                color: lastMonthTotal === 0 ? 'text-gray-400' : monthOverMonthPct > 0 ? 'text-red-600' : 'text-green-700',
                subIcon: lastMonthTotal === 0 ? null : monthOverMonthPct > 0 ? <ArrowUp size={10} strokeWidth={3} /> : <ArrowDown size={10} strokeWidth={3} />,
                icon: <CreditCard size={13} strokeWidth={2.25} />,
                iconBg: 'bg-red-50 text-red-500',
                spark: last6Months.map(m => m.total),
                sparkColor: '#ef4444',
              },
              {
                label: 'Spending rate',
                value: thisMonthIncomeTot > 0 ? `${spendingRate.toFixed(0)}%` : '—',
                sub: thisMonthIncomeTot > 0
                  ? spendingRate >= 100 ? 'Over budget!' : spendingRate >= 80 ? 'Getting close' : 'of income used'
                  : 'Add income first',
                color: thisMonthIncomeTot === 0 ? 'text-gray-400' : spendingRate >= 100 ? 'text-red-600' : spendingRate >= 80 ? 'text-amber-600' : 'text-green-700',
                subIcon: spendingRate >= 100 ? <AlertTriangle size={10} strokeWidth={2.5} /> : <TrendingUp size={10} strokeWidth={2.5} />,
                icon: <Gauge size={13} strokeWidth={2.25} />,
                iconBg: 'bg-blue-50 text-blue-600',
                spark: last6Months.map((m, i) => incomeLast6Months[i] && incomeLast6Months[i].total > 0 ? (m.total / incomeLast6Months[i].total) * 100 : 0),
                sparkColor: '#3b82f6',
              },
              {
                label: 'Safe to spend',
                value: !safeToSpendPerDay.isCurrentMonth
                  ? '—'
                  : freeToSpend <= 0
                  ? `${fmtShort(0)}/day`
                  : `${fmtShort(safeToSpendPerDay.perDay)}/day`,
                sub: !safeToSpendPerDay.isCurrentMonth
                  ? 'Month ended'
                  : freeToSpend <= 0
                  ? (reserved.active && netSavings > 0 ? 'Reserved uses it all' : 'Over budget')
                  : reserved.active
                  ? `after reserved · ${safeToSpendPerDay.daysLeft}d left`
                  : `${safeToSpendPerDay.daysLeft} days left`,
                color: !safeToSpendPerDay.isCurrentMonth
                  ? 'text-gray-400'
                  : freeToSpend <= 0
                  ? 'text-red-600'
                  : 'text-gray-600',
                subIcon: freeToSpend <= 0 && safeToSpendPerDay.isCurrentMonth ? <AlertTriangle size={10} />
                  : reserved.active && safeToSpendPerDay.isCurrentMonth ? <Lock size={10} /> : <Calendar size={10} />,
                icon: <Wallet size={13} strokeWidth={2.25} />,
                iconBg: 'bg-orange-50 text-orange-500',
                spark: dailyBalanceSeries.map(d => d.balance),
                sparkColor: '#f97316',
              },
            ].map((s, i) => {
              // Income and Expenses each have their own eye toggle
              const hideKey = 'hideKey' in s ? s.hideKey : null
              const shown = hideKey === 'income' ? showIncome : hideKey === 'expenses' ? showExpenses : true
              const toggleShown = hideKey === 'income' ? setShowIncome : setShowExpenses
              const hidden = !!hideKey && !shown
              // A hidden amount also hides its trend line, which would reveal the shape of the numbers
              const showSpark = !hidden && s.spark.length >= 2 && s.spark.some(v => v !== 0)
              return (
                <div key={i} className={`stat-card ${CARD} relative overflow-hidden p-3.5`}>
                  {showSpark && (
                    <div aria-hidden="true" className="absolute right-3 bottom-3 w-12 sm:w-14 h-7 pointer-events-none opacity-90 z-0">
                      <Sparkline data={s.spark} stroke={s.sparkColor} height={28} />
                    </div>
                  )}
                  <div className="relative z-10">
                    <div className="flex items-center gap-2">
                      <span className={`ef-stat-icon w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${s.iconBg}`}>{s.icon}</span>
                      <p className="text-xs text-gray-500 truncate flex-1">{s.label}</p>
                      {hideKey && (
                        <button onClick={() => toggleShown(v => !v)} title={shown ? 'Hide' : 'Show'} aria-label={`${shown ? 'Hide' : 'Show'} ${s.label.toLowerCase()}`}
                          className="text-gray-400 hover:text-gray-700 transition-colors shrink-0 -mr-0.5">
                          {shown ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      )}
                    </div>
                    <p className="text-base sm:text-lg font-medium text-black mt-2 tracking-tight truncate">
                      {hidden ? <span className="tracking-widest text-gray-300 select-none">••••••</span> : s.value}
                    </p>
                    <p className={`text-[11px] mt-1 flex items-center gap-1 ${s.color}`}>
                      {s.subIcon && <span className="shrink-0 flex items-center">{s.subIcon}</span>}
                      <span className="truncate">{s.sub}</span>
                    </p>
                  </div>
                </div>
              )
            })}
          </div>

          {/* ── Daily spending ── */}
          {/* Collapsed by default. Content is conditionally rendered rather than
              height-animated: a max-height wrapper needs overflow:hidden, which
              would clip the heatmap's hover tooltip while open. */}
          <div className={`${CARD} px-4 py-3 mb-3`}>
            <button onClick={() => setDailyOpen(v => !v)}
              aria-expanded={dailyOpen}
              className="w-full flex items-center justify-between gap-2 text-left group">
              <div className="flex items-center gap-2.5 min-w-0">
                <CalendarDays size={14} className="text-black shrink-0" />
                <p className="text-xs font-semibold text-black uppercase tracking-wider truncate">Daily spending</p>
              </div>
              <div className="flex items-center gap-3 shrink-0 min-w-0">
                <span className="hidden sm:inline text-[11px] text-gray-400">{getMonthLabelFull(selectedMonth)}</span>
                <ChevronRight size={14} className={`text-black transition-transform duration-300 ${dailyOpen ? 'rotate-90' : 'rotate-0'}`} />
              </div>
            </button>

            {dailyOpen && (<div className="animate-slide-up mt-4">
            {dailySpend.elapsedDays === 0 ? (
              <p className="text-xs text-gray-300 text-center py-8">This month hasn't started yet</p>
            ) : (<>
              {/* KPI strip — the plain-English answer, so the chart is optional reading */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'Typical day', value: dailySpend.spentDayCount ? fmt(Math.round(dailySpend.medianActiveDay)) : '—', sub: 'a normal day' },
                  { label: 'Days spent', value: `${dailySpend.spentDayCount} / ${dailySpend.elapsedDays}`, sub: 'days so far' },
                  { label: 'No-spend streak', value: `${dailyRecords.currentNoSpend} ${dailyRecords.currentNoSpend === 1 ? 'day' : 'days'}`, sub: `best: ${dailyRecords.longestNoSpend}` },
                ].map(k => (
                  <div key={k.label} className="rounded-xl bg-gray-50 px-3 py-2.5 min-w-0">
                    <p className="text-[10px] text-gray-500 truncate">{k.label}</p>
                    <p className="text-sm font-medium text-black mt-0.5 truncate tabular-nums">{k.value}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5 truncate">{k.sub}</p>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between gap-3 mt-2.5">
                <p className="text-xs text-gray-500 min-w-0">
                  {dailyRecords.heaviestDow && dailyRecords.heaviestDow.avg > 0 && (<>
                    <strong className="font-medium text-black">{dailyRecords.heaviestDow.label}s</strong> are your heaviest — {fmt(Math.round(dailyRecords.heaviestDow.avg))} on average.
                  </>)}
                </p>
                {/* Explanations live behind this button so the calendar stays clean */}
                <button onClick={() => setCalHelpOpen(v => !v)} aria-expanded={calHelpOpen}
                  aria-label="How to read the calendar" className={`shrink-0 flex items-center justify-center gap-1 h-7 w-7 sm:w-auto sm:pl-1.5 sm:pr-2.5 rounded-full border text-[11px] font-medium transition-all ${
                    calHelpOpen ? 'bg-black text-white border-black' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400 hover:text-black'}`}>
                  <HelpCircle size={14} /><span className="hidden sm:inline">How to read</span>
                </button>
              </div>

              {calHelpOpen && (() => {
                const sq = 'w-3.5 h-3.5 rounded-[4px] shrink-0'
                const items: { visual: React.ReactNode; label: string }[] = [
                  { visual: <span className="flex gap-0.5">{HEAT_COLORS.slice(1).map((c, i) => <span key={i} className="w-2 h-3.5 rounded-xs" style={{ backgroundColor: c }} />)}</span>, label: 'Darker = spent more' },
                  { visual: <span className={sq} style={{ backgroundColor: HEAT_COLORS[0] }} />, label: 'No spending' },
                  { visual: <span className={sq} style={{ background: 'var(--heat-future)', border: '1px solid var(--ef-line)' }} />, label: 'Day not here yet' },
                  { visual: <span className={sq} style={{ backgroundColor: HEAT_COLORS[2], boxShadow: '0 0 0 1.5px var(--ef-surface), 0 0 0 2.5px var(--ef-ink)' }} />, label: 'Today' },
                  { visual: <span className="text-[10px] font-semibold text-gray-500 tabular-nums leading-none">Rp</span>, label: 'Week total' },
                  { visual: <span className="flex items-end gap-0.75 h-3.5">{[6, 10, 14].map((h, i) => <span key={i} className="w-1 rounded-full" style={{ height: h, backgroundColor: i === 2 ? HEAT_COLORS[4] : HEAT_COLORS[1] }} />)}</span>, label: 'Weekday average' },
                ]
                return (
                  <div className="animate-slide-up mt-3 rounded-2xl bg-gray-50 px-4 py-3.5">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-4 gap-y-2.5 sm:gap-y-3">
                      {items.map(h => (
                        <div key={h.label} className="flex items-center gap-2.5 min-w-0">
                          <span className="w-10 h-4 flex items-center shrink-0">{h.visual}</span>
                          <span className="text-xs text-gray-700 whitespace-nowrap truncate">{h.label}</span>
                        </div>
                      ))}
                    </div>
                    <p className="text-[11px] text-gray-500 mt-3.5 pt-3 border-t border-gray-200/70">Tap any day to see what you spent.</p>
                  </div>
                )
              })()}

              <div className="mt-4">
                <SpendingHeatmap data={dailySpend} monthKey={selectedMonth} size="compact" onSelectDay={setOpenDay} showWeekTotals showLegend={false} />
                <WeekdayBars stats={dowStats} size="compact" withWeekColumn showCaption={false} />
              </div>

              {/* Spending pace + patterns — one collapsible section (closed by default) */}
              <div className="mt-4 pt-3 border-t border-gray-100">
                <button onClick={() => setShowDailyPatterns(v => !v)} aria-expanded={showDailyPatterns}
                  className="w-full flex items-center justify-between gap-2 py-1 text-left group">
                  <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider group-hover:text-black transition-colors">Spending pace &amp; patterns</span>
                  <ChevronDown size={14} className={`text-gray-400 group-hover:text-black transition-transform duration-300 ${showDailyPatterns ? 'rotate-180' : ''}`} />
                </button>
                {showDailyPatterns && (<div className="animate-slide-up mt-3">
                <SpendingPaceChart thisSeries={spendingPace.thisSeries} lastSeries={spendingPace.lastSeries} daysInMonth={dailySpend.daysInMonth} />

              {dailySpend.spentDayCount > 0 && (<>
                <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mt-5">Patterns</p>
                <div>
                  <div className="grid grid-cols-2 gap-2 pt-2.5">
                    {[
                      { label: 'Quietest day', value: dailyRecords.quietest ? fmt(dailyRecords.quietest.total) : '—',
                        sub: dailyRecords.quietest ? `${MONTHS_SHORT[Number(selectedMonth.split('-')[1]) - 1]} ${dailyRecords.quietest.day}` : 'no spending yet',
                        day: dailyRecords.quietest?.day ?? null },
                      { label: 'Highest day', value: dailyRecords.highest ? fmt(dailyRecords.highest.total) : '—',
                        sub: dailyRecords.highest ? `${MONTHS_SHORT[Number(selectedMonth.split('-')[1]) - 1]} ${dailyRecords.highest.day}` : 'no spending yet',
                        day: dailyRecords.highest?.day ?? null },
                      { label: 'No-spend days', value: String(dailySpend.noSpendDayCount), sub: `of ${dailySpend.elapsedDays} days so far`, day: null as number | null },
                      { label: 'Longest streak', value: `${dailyRecords.longestNoSpend} ${dailyRecords.longestNoSpend === 1 ? 'day' : 'days'}`, sub: 'no spending in a row', day: null as number | null },
                    ].map(t => (
                      <button key={t.label} disabled={t.day === null} onClick={() => t.day !== null && setOpenDay(t.day)}
                        className={`bg-gray-50 rounded-xl px-3 py-2.5 text-left transition-all ${t.day !== null ? 'hover:bg-gray-100 active:scale-[.98] cursor-pointer' : 'cursor-default'}`}>
                        <p className="text-[10px] text-gray-500 mb-0.5">{t.label}</p>
                        <p className="text-sm font-medium text-black truncate tabular-nums">{t.value}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5 truncate">{t.sub}</p>
                      </button>
                    ))}
                  </div>
                  <div className="flex flex-col gap-2 pt-3.5">
                    {dowStats.map(s => (
                      <div key={s.idx} className="flex items-center gap-2.5">
                        <span className="text-[11px] text-gray-500 w-8 shrink-0">{s.label}</span>
                        <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                          <div className="h-full rounded-full bar-fill"
                            style={{ width: `${s.occurrences === 0 ? 0 : (s.avg / Math.max(...dowStats.map(x => x.avg), 1)) * 100}%`,
                                     backgroundColor: dailyRecords.heaviestDow?.idx === s.idx ? HEAT_COLORS[4] : HEAT_COLORS[2] }} />
                        </div>
                        <span className="text-[10px] text-gray-500 w-24 text-right shrink-0 tabular-nums">
                          {s.occurrences === 0 ? '—' : `${fmt(Math.round(s.avg))} avg`}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </>)}
                </div>)}
              </div>
            </>)}
            </div>)}
          </div>

          {/* ── Reserved money ── */}
          {/* Money already promised this month (unlogged budgets + unpaid bills),
              so "free" is what's honestly left. Current month only. */}
          {reserved.isCurrentMonth && (reserved.poolItems.length > 0 || reserved.billItems.length > 0) && (() => {
            const short  = freeToSpend < 0
            return (
          <div className={`${CARD} px-4 py-3 mb-3`}>
            <button onClick={() => setReservedOpen(v => !v)} aria-expanded={reservedOpen}
              className="w-full flex items-center justify-between gap-2 text-left">
              <div className="flex items-center gap-2.5 min-w-0">
                <HandCoins size={15} className="text-black shrink-0" />
                <p className="text-xs font-semibold text-black uppercase tracking-wider truncate">Reserved money</p>
              </div>
              <div className="flex items-center gap-3 shrink-0 min-w-0">
                {!reservedOpen && (
                  <>
                    <span className="text-xs font-medium text-black truncate">{fmt(reserved.total)} kept aside</span>
                    <span aria-hidden="true" className="hidden sm:inline-block w-px h-4 bg-gray-200" />
                    <span className={`hidden sm:inline text-[11px] font-medium ${short ? 'text-red-600' : 'text-emerald-600'}`}>
                      {fmt(Math.abs(freeToSpend))} {short ? 'short' : 'free'}
                    </span>
                  </>
                )}
                <ChevronRight size={14} className={`text-black transition-transform duration-300 ${reservedOpen ? 'rotate-90' : 'rotate-0'}`} />
              </div>
            </button>

            {reservedOpen && (<div className="animate-slide-up mt-4">
              {reservedPanel}
            </div>)}
          </div>
            )
          })()}

          {/* ── Charts ── (each collapsible, closed by default) */}
          {/* Cards keep their natural height — stretching spreads the month rows apart */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-2.5 items-start">
            <div className={`${CARD} px-4 py-3`}>
              <button onClick={() => setTrendOpen(v => !v)} aria-expanded={trendOpen}
                className="w-full flex items-center justify-between gap-2 text-left">
                <span className="flex items-center gap-2.5 min-w-0">
                  <BarChart3 size={14} className="text-black shrink-0" strokeWidth={2.5} />
                  <span className="text-xs font-semibold text-black uppercase tracking-wider truncate">Last 6 months</span>
                </span>
                <span className="flex items-center gap-2 shrink-0">
                  <ChevronRight size={14} className={`text-black transition-transform duration-300 ${trendOpen ? 'rotate-90' : 'rotate-0'}`} />
                </span>
              </button>
              {trendOpen && (() => {
                const withData = last6Months.filter(m => m.total > 0 && m.key !== selectedMonth)
                const avg = withData.length ? withData.reduce((s, m) => s + m.total, 0) / withData.length : 0
                const vsAvg = avg > 0 ? ((thisMonthTotal - avg) / avg) * 100 : null
                const filled = last6Months.filter(m => m.total > 0)
                const highest = filled.reduce<typeof filled[number] | null>((m, x) => !m || x.total > m.total ? x : m, null)
                const lowest  = filled.reduce<typeof filled[number] | null>((m, x) => !m || x.total < m.total ? x : m, null)
                return (
                <div className="animate-slide-up mt-3.5">
                  <div className="flex flex-col gap-2.5">
                    {last6Months.map(m => (
                      <div key={m.key} className="flex items-center gap-2.5">
                        <span className={`text-xs w-8 shrink-0 ${m.key === selectedMonth ? 'text-black font-medium' : 'text-gray-500'}`}>{m.label}</span>
                        <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                          <div className={`h-full rounded-full transition-all duration-700 ${m.key === selectedMonth ? 'bg-black' : 'bg-gray-400'}`}
                            style={{ width: m.total ? `${(m.total / maxMonthly) * 100}%` : '0%' }} />
                        </div>
                        <span className="text-xs text-gray-500 w-14 text-right shrink-0 tabular-nums">{m.total ? fmtShort(m.total) : '—'}</span>
                      </div>
                    ))}
                  </div>
                  {avg > 0 && (
                    <div className="grid grid-cols-2 gap-2 mt-4">
                      <div className="rounded-xl bg-gray-50 px-3 py-2.5 min-w-0">
                        <p className="text-[10px] text-gray-500 truncate">Monthly average</p>
                        <p className="text-sm font-medium text-black mt-0.5 truncate tabular-nums">{fmt(Math.round(avg))}</p>
                      </div>
                      <div className="rounded-xl bg-gray-50 px-3 py-2.5 min-w-0">
                        <p className="text-[10px] text-gray-500 truncate">This month vs average</p>
                        <p className={`text-sm font-medium mt-0.5 truncate tabular-nums ${vsAvg === null ? 'text-black' : vsAvg > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                          {vsAvg === null ? '—' : `${vsAvg > 0 ? '+' : ''}${vsAvg.toFixed(0)}%`}
                        </p>
                      </div>
                      {highest && lowest && filled.length > 1 && (<>
                        <div className="rounded-xl bg-gray-50 px-3 py-2.5 min-w-0">
                          <p className="text-[10px] text-gray-500 truncate">Highest month</p>
                          <p className="text-sm font-medium text-black mt-0.5 truncate tabular-nums">{fmt(highest.total)}</p>
                          <p className="text-[10px] text-gray-400 truncate">{getMonthLabelFull(highest.key)}</p>
                        </div>
                        <div className="rounded-xl bg-gray-50 px-3 py-2.5 min-w-0">
                          <p className="text-[10px] text-gray-500 truncate">Lowest month</p>
                          <p className="text-sm font-medium text-black mt-0.5 truncate tabular-nums">{fmt(lowest.total)}</p>
                          <p className="text-[10px] text-gray-400 truncate">{getMonthLabelFull(lowest.key)}</p>
                        </div>
                      </>)}
                    </div>
                  )}
                </div>
                )
              })()}
            </div>

            <div className={`${CARD} px-4 py-3`}>
              <button onClick={() => setCatOpen(v => !v)} aria-expanded={catOpen}
                className="w-full flex items-center justify-between gap-2 text-left">
                <span className="flex items-center gap-2.5 min-w-0">
                  <PieChart size={14} className="text-black shrink-0" strokeWidth={2.5} />
                  <span className="text-xs font-semibold text-black uppercase tracking-wider truncate">By category</span>
                </span>
                <span className="flex items-center gap-2 shrink-0 min-w-0">
                  <ChevronRight size={14} className={`text-black transition-transform duration-300 ${catOpen ? 'rotate-90' : 'rotate-0'}`} />
                </span>
              </button>
              {catOpen && <div className="animate-slide-up mt-3">
              {thisMonthTotal === 0 ? <p className="text-xs text-gray-300 text-center mt-6">No data this month</p> : (() => {
                const slices = (Object.keys(CATEGORY_CONFIG) as Category[])
                  .map(cat => ({ cat, spent: categoryTotals[cat] || 0, pct: (categoryTotals[cat] || 0) / thisMonthTotal * 100 }))
                  .filter(s => s.spent > 0)
                  .sort((a, b) => b.spent - a.spent)
                let offset = 0
                return (
                  <div className="flex flex-col items-center gap-4">
                    {/* Donut ring, centered */}
                    <div className="relative shrink-0 animate-pop-in">
                      <svg width="128" height="128" viewBox="0 0 36 36" className="-rotate-90">
                        <circle cx="18" cy="18" r="15.915" fill="none" style={{ stroke: 'var(--ef-track)' }} strokeWidth="3.6" />
                        {slices.map((s, i) => {
                          const dash = s.pct
                          const active = catSliceSelected === i
                          const el = (
                            <circle key={s.cat} cx="18" cy="18" r="15.915" fill="none"
                              stroke={CATEGORY_COLOR[s.cat]} strokeWidth={active ? 4.4 : 3.6}
                              strokeDasharray={`${dash} ${100 - dash}`} strokeDashoffset={-offset}
                              pathLength={100} className="transition-all duration-300 cursor-pointer"
                              style={{ opacity: catSliceSelected === null || active ? 1 : 0.35 }}
                              onClick={() => setCatSliceSelected(prev => prev === i ? null : i)} />
                          )
                          offset += dash
                          return el
                        })}
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
                        {catSliceSelected !== null && slices[catSliceSelected] ? (
                          <>
                            <span className="text-[10px] text-gray-500 uppercase tracking-widest truncate max-w-full">{CATEGORY_CONFIG[slices[catSliceSelected].cat].label.split(' ')[0]}</span>
                            <span className="text-xs font-medium text-black leading-tight">{fmt(slices[catSliceSelected].spent)}</span>
                            <span className="text-[11px] text-gray-400">{slices[catSliceSelected].pct.toFixed(0)}%</span>
                          </>
                        ) : (
                          <>
                            <span className="text-[10px] text-gray-400 uppercase tracking-widest">Total</span>
                            <span className="text-base font-medium text-black leading-tight">{fmtShort(thisMonthTotal)}</span>
                          </>
                        )}
                      </div>
                    </div>
                    {/* Legend */}
                    <div className="w-full flex flex-col divide-y divide-gray-100">
                      {slices.map((s, i) => (
                        <div key={s.cat} className="legend-row flex items-center gap-2.5 py-1.5 cursor-pointer transition-opacity"
                          style={{ animationDelay: `${0.04 * i}s`, opacity: catSliceSelected === null || catSliceSelected === i ? 1 : 0.4 }}
                          onClick={() => setCatSliceSelected(prev => prev === i ? null : i)}>
                          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: CATEGORY_COLOR[s.cat] }} />
                          <span className="text-xs text-gray-600 flex-1 min-w-0 truncate">{CATEGORY_CONFIG[s.cat].label.split(' ')[0]}</span>
                          <span className="text-xs text-gray-700 shrink-0 whitespace-nowrap tabular-nums">
                            {fmt(s.spent)} <span className="text-gray-400">·</span> <span className="inline-block w-7 text-right">{s.pct.toFixed(0)}%</span>
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })()}
              </div>}
            </div>
          </div>

          {/* Smart Insights */}
          <SmartInsightsCard cardClass={CARD} thisMonthTotal={thisMonthTotal} lastMonthTotal={lastMonthTotal} avgPerDay={avgPerDay}
            categoryTotals={categoryTotals} thisMonthIncomeTot={thisMonthIncomeTot} netSavings={netSavings} budgets={budgets} budgetSpend={budgetSpend}
            freeToSpend={reserved.active ? freeToSpend : undefined}
            open={insightsOpen} onOpenChange={setInsightsOpen} />

          {/* Budget Tracker */}
          {budgets.length > 0 && (
            <div className={`${CARD} p-4 mb-4`}>
              <div className="flex items-center gap-2.5 mb-3">
                <Target size={14} className="text-black" strokeWidth={2.5} />
                <p className="text-xs font-semibold text-black uppercase tracking-wider">Budget tracker</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3.5">
                {budgets.map(b => {
                  const spent = budgetSpend[b.category] || 0
                  const pct   = Math.min((spent / b.limit_amount) * 100, 100)
                  const over  = spent > b.limit_amount
                  const warn  = !over && pct >= 80
                  return (
                    <div key={b.id}>
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="flex items-center gap-1 text-xs text-gray-600">
                          {CATEGORY_CONFIG[b.category].label}
                          {over && <AlertTriangle size={12} className="text-red-500" />}
                          {warn && <AlertTriangle size={12} className="text-amber-500" />}
                        </span>
                        <span className={`text-xs font-medium tabular-nums ${over ? 'text-red-600' : warn ? 'text-amber-600' : 'text-gray-600'}`}>
                          {fmtShort(spent)} / {fmtShort(b.limit_amount)}
                        </span>
                      </div>
                      <div className="bg-gray-100 rounded-full h-2 overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-700 ${over ? 'bg-red-500' : warn ? 'bg-amber-500' : 'bg-black'}`} style={{ width: `${pct}%` }} />
                      </div>
                      {over && <p className="text-xs text-red-500 mt-1">Over by {fmtShort(spent - b.limit_amount)}</p>}
                      {warn && <p className="text-xs text-amber-500 mt-1">{pct.toFixed(0)}% used — approaching limit</p>}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* ── Unified tabs: Expenses / Income / Bills / Budgets / Split Bills / Debts / Goals ── */}
          {(() => {
            const TABS = [
              { key: 'expenses', label: 'Expenses',    count: 0 },
              { key: 'income',   label: 'Income',      count: 0 },
              { key: 'bills',    label: 'Bills',       count: billsDueSoon },
              { key: 'pools',    label: 'Budgets',     count: expensePools.length },
              { key: 'splits',   label: 'Split Bills', count: billsWithStats.filter(b => !b.settled).length },
              { key: 'owed',     label: 'Debts',       count: debtsWithStats.filter(d => !d.settled).length },
              { key: 'goals',    label: 'Goals',       count: savingsGoals.length },
            ] as const
            return (
          <div className={`${CARD} p-4 sm:p-5 mb-4 animate-slide-up`}>
            <div className="flex items-center gap-2">
              <div className="flex-1 min-w-0 flex gap-1 bg-gray-100 p-1 rounded-full overflow-x-auto thin-scrollbar" onWheel={scrollHorizontally}>
                {TABS.map(t => (
                  <button key={t.key} data-tab={t.key} onClick={() => setDashboardTab(t.key)}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all whitespace-nowrap shrink-0 ${dashboardTab === t.key ? 'bg-black text-white shadow-sm' : 'text-gray-600 hover:text-black'}`}>
                    {t.label}
                    {t.count > 0 && (
                      <span className={`${dashboardTab === t.key ? 'bg-white text-black' : 'bg-red-500 text-white'} rounded-full text-[10px] min-w-4 h-4 px-1 flex items-center justify-center font-semibold`}>{t.count}</span>
                    )}
                  </button>
                ))}
              </div>
              {dashboardTab === 'bills' && (
                <button onClick={() => setShowAddBill(true)}
                  className="flex items-center gap-1.5 h-8 px-3.5 text-xs font-semibold text-black bg-white border border-gray-200 hover:border-black rounded-full shadow-sm transition-all whitespace-nowrap shrink-0">
                  <Plus size={13} /> Add bill
                </button>
              )}
              {(dashboardTab === 'pools' || dashboardTab === 'splits' || dashboardTab === 'owed' || dashboardTab === 'goals') && (
                <button
                  onClick={() => {
                    if (dashboardTab === 'pools') setShowAddPool(true)
                    else if (dashboardTab === 'splits') setShowAddSplitBill(true)
                    else if (dashboardTab === 'owed') setShowAddDebt(true)
                    else setShowAddGoal(true)
                  }}
                  className="flex items-center gap-1.5 h-8 px-3.5 text-xs font-semibold text-black bg-white border border-gray-200 hover:border-black rounded-full shadow-sm transition-all whitespace-nowrap shrink-0">
                  <Plus size={13} /> Add
                </button>
              )}
            </div>

            {/* Toolbar — search / month / amount filter / export (list tabs only) */}
            {(dashboardTab === 'expenses' || dashboardTab === 'income') && (
              <div className="mt-3 flex items-center gap-2">
                <div className="relative flex-1 min-w-0">
                  <Search size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                  <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search..."
                    className="w-full h-8 bg-white border border-gray-200 rounded-full pl-9 pr-9 text-xs text-black placeholder:text-gray-400 focus:outline-none focus:border-black transition" />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery('')} title="Clear search"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black"><X size={14} /></button>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {/* Month + Export are PC-only: on mobile the month picker is at the top of the page and Export is in the menu */}
                  <div className="hidden sm:block">
                    <MonthPickerDropdown months={last6Months} selected={selectedMonth} onChange={setSelectedMonth} variant="pill" size="sm" align="right" />
                  </div>
                  {dashboardTab === 'expenses' && (
                    <button onClick={() => setShowFilters(v => !v)} aria-expanded={showFilters} title="Filter by amount"
                      className={`relative flex items-center justify-center gap-1.5 h-8 w-8 sm:w-auto px-0 sm:px-3 rounded-full border shadow-sm text-xs font-semibold transition-all whitespace-nowrap ${showFilters || activeFilterCount > 0 ? 'bg-black text-white border-black' : 'bg-white text-black border-gray-200 hover:border-gray-400'}`}>
                      <Tag size={13} />
                      <span className="hidden sm:inline">{activeFilterCount > 0 ? `Filtered (${activeFilterCount})` : 'All Amounts'}</span>
                      <ChevronDown size={13} className={`hidden sm:inline transition-transform duration-200 ${showFilters ? 'rotate-180' : ''}`} />
                      {activeFilterCount > 0 && !showFilters && (
                        <span className="sm:hidden absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full text-[9px] flex items-center justify-center font-semibold">{activeFilterCount}</span>
                      )}
                    </button>
                  )}
                  <button onClick={() => exportCSV(expenses, income, selectedMonth)} title={`Export ${getMonthLabelFull(selectedMonth)} as CSV`}
                    className="hidden sm:flex items-center gap-1.5 h-8 px-3 rounded-full border border-gray-200 bg-white shadow-sm text-xs font-semibold text-black hover:border-gray-400 transition-all whitespace-nowrap">
                    <Download size={13} /> Export CSV
                  </button>
                </div>
              </div>
            )}

            <div className="mt-4">
            {/* Pools / Budgets */}
            <div className={dashboardTab === 'pools' ? '' : 'hidden'}>
            {expensePools.length === 0 ? (
              <div className="text-center py-6">
                <Wallet size={28} className="mx-auto mb-2 text-gray-200" />
                <p className="text-xs text-gray-400 font-medium mb-0.5">No budgets yet</p>
                <p className="text-xs text-gray-300 mb-3">Set a monthly budget and log daily usage</p>
                <button onClick={() => setShowAddPool(true)}
                  className="inline-flex items-center gap-1.5 bg-black text-white text-xs font-medium px-3.5 py-1.5 rounded-full hover:bg-gray-800 transition-all">
                  <Plus size={12} /> Create first budget
                </button>
              </div>
            ) : (() => {
              const totalBudget = poolsThisMonth.reduce((s, p) => s + p.pool.budget_amount, 0)
              const totalUsed   = poolsThisMonth.reduce((s, p) => s + p.spent, 0)
              const totalLeft   = Math.max(totalBudget - totalUsed, 0)
              const usedPct     = totalBudget > 0 ? Math.min((totalUsed / totalBudget) * 100, 100) : 0
              const days        = daysLeftInMonth(selectedMonth)
              // How far through the month we are, to judge each budget's pace
              const [pyr, pmo]  = selectedMonth.split('-').map(Number)
              const monthPct    = days === null ? 100 : ((new Date(pyr, pmo, 0).getDate() - days) / new Date(pyr, pmo, 0).getDate()) * 100
              return (
              <div className="flex flex-col gap-2.5">
                {/* Summary */}
                <div className="rounded-2xl bg-gray-50 border border-gray-100 px-4 py-3.5">
                  {/* Ring shows how much of all budgets is SPENT; colour warms as it fills */}
                  <div className="flex items-center gap-3.5">
                    <Ring pct={usedPct} size={56} stroke={5} color={usedPct >= 90 ? '#dc2626' : usedPct >= 70 ? '#f59e0b' : '#10b981'}>
                      <span className="text-[11px] font-semibold text-black tabular-nums leading-none">{usedPct.toFixed(0)}%</span>
                      <span className="text-[8px] uppercase tracking-wide text-gray-500 leading-none mt-0.5">spent</span>
                    </Ring>
                    <div className="min-w-0">
                      <p className="text-base font-semibold text-black tracking-tight">Your Budgets</p>
                      <p className="text-[11px] text-gray-500 mt-0.5">{usedPct.toFixed(0)}% of your budgets spent{days !== null ? ` · ${days} ${days === 1 ? 'day' : 'days'} left this month` : ' this month'}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 mt-3 pt-3 border-t border-gray-200/70">
                    {[
                      { label: 'Total budgeted', value: totalBudget },
                      { label: 'Total used', value: totalUsed },
                      { label: 'Remaining', value: totalLeft },
                    ].map((s, i) => (
                      <div key={s.label} className={`min-w-0 ${i > 0 ? 'pl-2.5 sm:pl-3 border-l border-gray-200/70' : ''}`}>
                        <p className="text-[13px] sm:text-sm font-semibold text-black tabular-nums tracking-tight truncate">{fmt(s.value)}</p>
                        <p className="text-[10px] text-gray-500 mt-0.5 truncate">{s.label}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {poolsThisMonth.map(({ pool, spent, remaining, pct }) => {
                  const over = spent > pool.budget_amount
                  const cfg  = CATEGORY_CONFIG[pool.category]
                  const usedRaw = pool.budget_amount > 0 ? (spent / pool.budget_amount) * 100 : 0
                  // Status: compares spending with how far through the month we are
                  const status = over ? { label: 'Over budget', dot: 'bg-red-500', text: 'text-red-600', bar: 'linear-gradient(90deg, #f87171, #dc2626)' }
                    : pct >= 85 ? { label: 'Almost used', dot: 'bg-amber-500', text: 'text-amber-600', bar: 'linear-gradient(90deg, #fcd34d, #f59e0b)' }
                    : spent > 0 && pct > monthPct + 10 ? { label: 'Spending fast', dot: 'bg-amber-500', text: 'text-amber-600', bar: 'linear-gradient(90deg, #fcd34d, #f59e0b)' }
                    : { label: 'On track', dot: 'bg-emerald-500', text: 'text-emerald-600', bar: 'linear-gradient(90deg, #6ee7b7, #10b981)' }
                  const perDay = days !== null && !over ? Math.floor(remaining / (days + 1)) : null
                  const isReserved = pool.is_reserved !== false
                  return (
                    <div key={pool.id} onClick={() => setOpenPool(pool)}
                      className="rounded-2xl border border-gray-100 bg-white px-4 py-4 hover:border-gray-200 hover:shadow-[0_8px_24px_-14px_rgba(16,24,40,0.18)] transition-all cursor-pointer group">
                      {/* Top: icon, name + monthly limit, Log, menu */}
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 ${cfg.bg} rounded-xl flex items-center justify-center shrink-0`}>
                          <span className={cfg.text}>{cfg.icon}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[15px] font-semibold text-black truncate tracking-tight">{pool.title}</p>
                          <p className="text-xs text-gray-500 truncate">{fmt(pool.budget_amount)} / month</p>
                        </div>
                        <button
                          onClick={e => { e.stopPropagation(); setLoggingPool(pool) }}
                          aria-label={`Log spending for ${pool.title}`}
                          className="flex items-center justify-center gap-1 h-9 w-9 sm:h-8 sm:w-auto sm:px-3.5 rounded-full bg-black text-white text-xs font-semibold hover:bg-gray-800 active:scale-[.97] transition-all shrink-0">
                          <Plus size={14} className="sm:w-3 sm:h-3" /> <span className="hidden sm:inline">Log</span>
                        </button>
                        <div onClick={e => e.stopPropagation()} className="-mr-1.5 sm:mr-0">
                          <RowMenu items={[
                            { label: 'Details', icon: <History size={13} />, onClick: () => setOpenPool(pool) },
                            { label: 'Archive', icon: <Trash2 size={13} />, onClick: () => handleArchivePool(pool.id), danger: true },
                          ]} />
                        </div>
                      </div>

                      {spent === 0 ? (
                        <div className="mt-3.5 flex items-center justify-center gap-1.5 h-10 rounded-xl border border-dashed border-gray-200 text-xs text-gray-400">
                          <Calendar size={13} /> Not logged yet this month · {fmt(pool.budget_amount)} available
                        </div>
                      ) : (<>
                        {/* The answer first: what's left, and whether you're on pace */}
                        <div className="mt-3.5 flex items-end justify-between gap-3">
                          <div className="min-w-0">
                            <p className={`text-lg font-semibold tabular-nums tracking-tight leading-none ${over ? 'text-red-600' : 'text-black'}`}>
                              {over ? `-${fmt(spent - pool.budget_amount)}` : fmt(remaining)}
                            </p>
                            <p className="text-[11px] text-gray-500 mt-1 flex items-center gap-1.5">
                              {over ? 'over your limit' : 'left to spend'}
                              {reserved.isCurrentMonth && (isReserved
                                ? <span className="inline-flex items-center gap-0.5 font-semibold text-amber-600"><Lock size={9} /> Reserved</span>
                                : <span className="font-semibold text-gray-400">Flexible</span>)}
                            </p>
                          </div>
                          <span className={`inline-flex items-center gap-1.5 text-[11px] font-medium shrink-0 ${status.text}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                            {status.label} · {Math.round(usedRaw)}%
                          </span>
                        </div>

                        {/* Bar with a "today" marker: past the marker = spending faster than the month */}
                        <div className="relative mt-2.5">
                          <div className="bg-gray-100 rounded-full h-2 overflow-hidden">
                            <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: status.bar }} />
                          </div>
                          {days !== null && (
                            <span title="Where you should be today" aria-hidden
                              className="absolute -top-1 -bottom-1 w-0.5 rounded-full bg-gray-400"
                              style={{ left: `calc(${monthPct}% - 1px)` }} />
                          )}
                        </div>

                        <div className="mt-2 flex items-center justify-between gap-2 text-[11px] text-gray-500 tabular-nums">
                          <span className="truncate">{fmt(spent)} used</span>
                          {perDay !== null && perDay > 0 && (
                            <span className="shrink-0">≈ {fmt(perDay)} / day</span>
                          )}
                        </div>
                      </>)}
                    </div>
                  )
                })}
              </div>
              )
            })()}
            </div>

            {/* Splits / Split Bills */}
            <div className={dashboardTab === 'splits' ? '' : 'hidden'}>
            {splitBills.length === 0 ? (
              <div className="text-center py-6">
                <Users size={28} className="mx-auto mb-2 text-gray-200" />
                <p className="text-xs text-gray-400 font-medium mb-0.5">No split bills yet</p>
                <p className="text-xs text-gray-300 mb-3">Split a bill and track who owes you</p>
                <button onClick={() => setShowAddSplitBill(true)}
                  className="inline-flex items-center gap-1.5 bg-black text-white text-xs font-medium px-3.5 py-1.5 rounded-full hover:bg-gray-800 transition-all">
                  <Plus size={12} /> Create first split
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {billsWithStats.map(({ bill, participants, owed, collected, paidCount, settled }) => {
                  const cfg = CATEGORY_CONFIG[bill.category]
                  const totalOwed = owed + collected
                  const pct = totalOwed > 0 ? Math.min((collected / totalOwed) * 100, 100) : 0
                  const myShare = Math.max(bill.total_amount - totalOwed, 0)
                  return (
                    <div key={bill.id} onClick={() => setOpenSplitBill(bill)}
                      className="border border-gray-100 rounded-2xl p-3.5 hover:border-gray-300 hover:bg-gray-50/50 transition-all cursor-pointer group">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className={`w-6 h-6 ${cfg.bg} rounded-lg flex items-center justify-center shrink-0`}>
                            <span className={cfg.text}>{cfg.icon}</span>
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{bill.title}</p>
                            <p className="text-xs text-gray-400">
                              {fmt(bill.total_amount)} · {participants.length} {participants.length === 1 ? 'person' : 'people'}
                              {myShare > 0 && <span className="text-gray-300"> · {fmt(myShare)} is your share</span>}
                            </p>
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
            </div>

            {/* Owed / Debts */}
            <div className={dashboardTab === 'owed' ? '' : 'hidden'}>
            {debts.length === 0 ? (
              <div className="text-center py-6">
                <CreditCard size={28} className="mx-auto mb-2 text-gray-200" />
                <p className="text-xs text-gray-400 font-medium mb-0.5">No debts yet</p>
                <p className="text-xs text-gray-300 mb-3">Track money people owe you</p>
                <button onClick={() => setShowAddDebt(true)}
                  className="inline-flex items-center gap-1.5 bg-black text-white text-xs font-medium px-3.5 py-1.5 rounded-full hover:bg-gray-800 transition-all">
                  <Plus size={12} /> Add first debt
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {debtsWithStats.map(({ debt, paid, remaining, pct, settled, overdue }) => (
                  <div key={debt.id} onClick={() => setOpenDebt(debt)}
                    className="border border-gray-100 rounded-2xl p-3.5 hover:border-gray-300 hover:bg-gray-50/50 transition-all cursor-pointer group">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-6 h-6 bg-gray-50 rounded-lg flex items-center justify-center shrink-0">
                          <span className="text-gray-600"><CreditCard size={14} /></span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{debt.person_name}</p>
                          <p className="text-xs text-gray-400">{fmt(debt.amount)} total</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {settled
                          ? <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-medium">Settled</span>
                          : overdue
                          ? <span className="flex items-center gap-0.5 text-[10px] text-red-500 font-medium"><AlertTriangle size={10} /> Overdue</span>
                          : <span className="text-[10px] text-gray-400">{fmtShort(remaining)} left</span>}
                        <RowMenu items={[
                          ...(!settled ? [{ label: 'Log payment', icon: <Plus size={13} />, onClick: () => setLoggingDebt(debt) }] : []),
                          { label: 'Details', icon: <History size={13} />, onClick: () => setOpenDebt(debt) },
                          { label: 'Delete', icon: <Trash2 size={13} />, onClick: () => handleArchiveDebt(debt.id), danger: true },
                        ]} />
                      </div>
                    </div>
                    <div className="bg-gray-100 rounded-full h-1.5 overflow-hidden mb-1.5">
                      <div className={`h-full rounded-full transition-all duration-700 ${settled ? 'bg-emerald-500' : 'bg-black'}`} style={{ width: `${pct}%` }} />
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500">{fmt(paid)} paid back</span>
                      {settled
                        ? <span className="text-emerald-500 font-medium">Fully paid</span>
                        : <span className={overdue ? 'text-red-500 font-medium' : 'text-gray-400'}>{fmt(remaining)} remaining</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
            </div>

            {/* Goals */}
            <div className={dashboardTab === 'goals' ? '' : 'hidden'}>
            {savingsGoals.length === 0 ? (
              <div className="text-center py-6">
                <PiggyBank size={28} className="mx-auto mb-2 text-gray-200" />
                <p className="text-xs text-gray-400 font-medium mb-0.5">No savings goals yet</p>
                <p className="text-xs text-gray-300 mb-3">Set a target and track your progress</p>
                <button onClick={() => setShowAddGoal(true)}
                  className="inline-flex items-center gap-1.5 bg-black text-white text-xs font-medium px-3.5 py-1.5 rounded-full hover:bg-gray-800 transition-all">
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
                    ? 'bg-linear-to-r from-emerald-400 to-green-500'
                    : pct >= 75 ? 'bg-linear-to-r from-blue-500 to-indigo-500'
                    : pct >= 40 ? 'bg-linear-to-r from-amber-400 to-orange-400'
                    : 'bg-linear-to-r from-rose-300 to-pink-400'
                  const dotColor = done ? 'bg-emerald-500' : pct >= 75 ? 'bg-blue-500' : pct >= 40 ? 'bg-amber-400' : 'bg-rose-300'
                  return (
                    <div key={goal.id} onClick={() => setOpenGoal(goal)}
                      className="border border-gray-100 rounded-2xl p-3.5 hover:border-gray-300 hover:bg-gray-50/50 transition-all cursor-pointer group">
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
            </div>

            {dashboardTab === 'expenses' && (
              <>
                <div className="flex gap-2 mb-3">
                  <div className="flex gap-1.5 overflow-x-auto pb-0.5 flex-1 min-w-0 thin-scrollbar" onWheel={scrollHorizontally}>
                    {(['all', ...Object.keys(CATEGORY_CONFIG)] as (Category | 'all')[]).map(f => {
                      const isAll = f === 'all'; const active = activeFilter === f; const cfg = isAll ? null : CATEGORY_CONFIG[f as Category]
                      return (
                        <button key={f} onClick={() => setActiveFilter(f)}
                          className={`flex items-center gap-1.5 h-8 px-3 rounded-full text-xs font-medium whitespace-nowrap border transition-all shrink-0 ${active ? 'bg-black text-white border-black' : 'text-gray-600 border-gray-200 hover:border-gray-400 bg-white'}`}>
                          {!isAll && <span className={active ? 'text-white' : cfg!.text}>{cfg!.icon}</span>}
                          {isAll ? 'All' : cfg!.label.split(' ')[0]}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {showFilters && (
                  <div className="border border-gray-100 bg-gray-50/50 rounded-2xl p-3.5 mb-3 animate-slide-up">
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      <div>
                        <label className="text-[10px] text-gray-400 mb-1 block uppercase tracking-wide">Min amount</label>
                        <div className="relative">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400 select-none">Rp</span>
                          <input type="text" inputMode="numeric" value={minAmount}
                            onChange={e => setMinAmount(e.target.value.replace(/[^0-9]/g, ''))} placeholder="0"
                            className="w-full bg-white border border-gray-200 rounded-full pl-8 pr-3 py-1.5 text-xs text-black focus:outline-none focus:border-black transition" />
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] text-gray-400 mb-1 block uppercase tracking-wide">Max amount</label>
                        <div className="relative">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400 select-none">Rp</span>
                          <input type="text" inputMode="numeric" value={maxAmount}
                            onChange={e => setMaxAmount(e.target.value.replace(/[^0-9]/g, ''))} placeholder="∞"
                            className="w-full bg-white border border-gray-200 rounded-full pl-8 pr-3 py-1.5 text-xs text-black focus:outline-none focus:border-black transition" />
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
                            className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${sortOrder === s.val ? 'bg-black text-white border-black' : 'border-gray-200 text-gray-500 hover:border-gray-400'}`}>
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
            {dashboardTab === 'expenses' && (
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
                      <div key={exp.id} className="row-item flex items-center gap-3 border border-gray-100 rounded-2xl px-3 sm:px-4 py-3 hover:bg-gray-50 transition-all" style={{ animationDelay: `${idx * 0.03}s` }}>
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${cfg.bg}`}><span className={cfg.text}>{cfg.icon}</span></div>
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
            {dashboardTab === 'income' && (
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
                      <div key={inc.id} className="row-item flex items-center gap-3 border border-gray-100 rounded-2xl px-3 sm:px-4 py-3 hover:bg-gray-50 transition-all" style={{ animationDelay: `${idx * 0.03}s` }}>
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-green-50"><span className="text-green-700">{cfg.icon}</span></div>
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
            {dashboardTab === 'bills' && (
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
                      <div key={r.id} className={`row-item flex flex-wrap sm:flex-nowrap items-center gap-2 sm:gap-3 border rounded-2xl px-3 sm:px-4 py-3 transition-all ${
                        isPaid ? 'border-green-200 bg-green-50/30' : overdue ? 'border-red-200 bg-red-50/30' : dueSoon ? 'border-amber-200 bg-amber-50/20' : 'border-gray-100 hover:bg-gray-50'
                      }`} style={{ animationDelay: `${idx * 0.03}s` }}>
                        <div className="flex items-center gap-3 w-full sm:w-auto sm:flex-1 min-w-0">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${cfg.bg}`}>
                            <span className={cfg.text}>{cfg.icon}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{r.title}</p>
                            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                              <span className={`text-xs px-1.5 py-0.5 rounded-full whitespace-nowrap ${cfg.bg} ${cfg.text}`}>{FREQ_LABELS[r.frequency]}</span>
                              {isPaid ? (
                                <span className="text-xs font-medium text-green-600 whitespace-nowrap">Paid ✓ next due {new Date(r.next_due).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                              ) : (
                                <span className={`text-xs font-medium whitespace-nowrap ${overdue ? 'text-red-600' : dueSoon ? 'text-amber-600' : 'text-gray-400'}`}>
                                  {overdue ? `${Math.abs(daysLeft)}d overdue` : daysLeft === 0 ? 'Due today!' : `Due in ${daysLeft}d`}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between w-full sm:w-auto pl-11 sm:pl-0 gap-2">
                          <div className="text-left sm:text-right shrink-0">
                            <p className="text-sm font-medium text-black">{fmt(r.amount)}</p>
                            <p className="text-xs text-gray-400 mt-0.5">{dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
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
                        </div>
                      </div>
                    )
                  })}
                </div>
              )
            )}
            </div>
          </div>
            )
          })()}

        </div>
      </div>
      )}

      {showSettings && <SettingsModal value={viewMode} onChange={changeView} theme={theme} onThemeChange={changeTheme}
        openDefaults={openDefaults} onOpenDefaultsChange={changeOpenDefault} onClose={() => setShowSettings(false)} />}

      {/* Modals */}
      {showAddExpense  && <AddExpenseModal  onClose={() => setShowAddExpense(false)}  onSave={handleAddExpense}
        onSaveBatch={handleAddExpensesBatch} pools={expensePools} pastExpenses={expenses} poolEntries={poolEntries} />}
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
      {showAddDebt    && <AddDebtModal onClose={() => setShowAddDebt(false)} onSave={handleAddDebt} />}
      {loggingDebt    && (() => { const stats = debtsWithStats.find(s => s.debt.id === loggingDebt.id); return stats ? <LogDebtPaymentModal debt={loggingDebt} remaining={stats.remaining} onClose={() => setLoggingDebt(null)} onSave={(amt, note) => handleLogDebtPayment(loggingDebt.id, amt, note)} /> : null })()}
      {openDebt       && (() => { const stats = debtsWithStats.find(s => s.debt.id === openDebt.id); return stats ? <DebtDetailModal stats={stats} onClose={() => setOpenDebt(null)} onOpenLog={() => { setLoggingDebt(openDebt); setOpenDebt(null) }} onDeletePayment={handleDeleteDebtPayment} onEditDebt={(u) => handleEditDebt(openDebt.id, u)} onArchiveDebt={() => handleArchiveDebt(openDebt.id)} /> : null })()}
      {openDay !== null && (() => {
        const dayData = dailySpend.days[openDay - 1]
        if (!dayData) return null
        // Derived per render (not snapshotted) so edits/deletes update live.
        const dayExpenses = thisMonthExpenses
          .filter(e => new Date(e.created_at).getDate() === openDay)
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        const dayIncome = thisMonthIncome.filter(i => new Date(i.created_at).getDate() === openDay)
        const rank = dayData.total > 0
          ? dailySpend.days.filter(d => !d.isFuture && d.total > dayData.total).length + 1
          : null
        return (
          <DayDetailModal
            day={openDay} monthKey={selectedMonth} dayData={dayData}
            dayExpenses={dayExpenses} dayIncome={dayIncome}
            avgPerDay={avgPerDay} maxDay={dailySpend.maxDay} rank={rank}
            spentDayCount={dailySpend.spentDayCount} elapsedDays={dailySpend.elapsedDays}
            onClose={() => setOpenDay(null)}
            onStepDay={d => setOpenDay(prev => prev === null ? prev : Math.min(Math.max(prev + d, 1), dailySpend.elapsedDays))}
            canPrev={openDay > 1} canNext={openDay < dailySpend.elapsedDays}
            onEditExpense={e => { setOpenDay(null); setEditingExpense(e) }}
            onDeleteExpense={e => { setOpenDay(null); setDeletingExpense(e) }}
          />
        )
      })()}
    </>
  )
}