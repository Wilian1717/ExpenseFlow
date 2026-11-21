'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import {
  Bell, Target, CalendarClock, Users, CreditCard, ArrowDownToLine, FileDown, Moon,
  UtensilsCrossed, Car, ShoppingBag, Coffee, Fuel,
} from 'lucide-react'
import SpotlightCard from './SpotlightCard'
import { EASE, Reveal } from './motion'
import { CONTAINER, H2, LABEL, MONO } from './ui'

// ─── Card visuals: real fragments of the app, not icons ──────────────────────

const WEEK = [
  { day: 'Mon 17', title: 'Fried rice', Icon: UtensilsCrossed, amount: '36.000' },
  { day: 'Mon 17', title: 'Grab to office', Icon: Car, amount: '18.000' },
  { day: 'Tue 18', title: 'Coffee', Icon: Coffee, amount: '28.000' },
  { day: 'Thu 20', title: 'Fuel', Icon: Fuel, amount: '100.000' },
  { day: 'Sat 22', title: 'Groceries', Icon: ShoppingBag, amount: '230.000' },
]

function WeekEntries() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-40px' })
  return (
    <div ref={ref} className="mt-6 overflow-hidden rounded-xl border border-white/8 bg-black/30">
      <div className="flex items-center justify-between border-b border-white/8 px-4 py-2.5">
        <span className={`${MONO} text-[11px] uppercase tracking-[0.14em] text-white/45`}>This week</span>
        <span className="text-xs text-white/55">5 entries</span>
      </div>
      <ul>
        {WEEK.map((r, i) => (
          <motion.li key={r.title}
            initial={{ opacity: 0, x: -12 }} animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.15 + i * 0.09, ease: EASE }}
            className="flex items-center gap-3 border-b border-white/6 px-4 py-2.5 last:border-b-0">
            <span className={`${MONO} hidden w-14 shrink-0 text-[11px] text-white/40 sm:block`}>{r.day}</span>
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/8 text-white/80"><r.Icon size={13} aria-hidden /></span>
            <span className="min-w-0 flex-1 truncate text-sm text-white/85">{r.title}</span>
            <span className="text-sm tabular-nums text-white/70">Rp {r.amount}</span>
          </motion.li>
        ))}
      </ul>
      <div className="flex items-center justify-between border-t border-white/8 bg-white/3 px-4 py-3">
        <span className="text-sm font-semibold tabular-nums text-white">Rp 412.000</span>
        <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-black">Save 5</span>
      </div>
    </div>
  )
}

function InsightChart() {
  const ref = useRef<SVGSVGElement>(null)
  const inView = useInView(ref, { once: true, margin: '-40px' })
  // last month (dashed) vs this month (solid): running totals
  const last = 'M4 88 C 70 76, 120 50, 170 38 S 260 16, 316 6'
  const now = 'M4 90 C 70 86, 120 74, 170 66 S 260 54, 316 48'
  return (
    <div className="mt-auto pt-6">
    <svg ref={ref} viewBox="0 0 320 96" className="h-28 w-full" aria-hidden>
      <motion.path d={last} fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" strokeDasharray="4 5"
        initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}} transition={{ duration: 0.8, ease: EASE }} />
      <motion.path d={now} fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round"
        initial={{ pathLength: 0 }} animate={inView ? { pathLength: 1 } : {}} transition={{ duration: 1.5, delay: 0.3, ease: EASE }} />
      <motion.circle cx="316" cy="48" r="4" fill="#ffffff"
        initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}} transition={{ duration: 0.4, delay: 1.7 }} />
      <circle cx="316" cy="6" r="3" fill="rgba(255,255,255,0.35)" />
    </svg>
    <div className={`${MONO} mt-3 flex gap-4 text-[10px] uppercase tracking-[0.12em] text-white/40`}>
      <span className="flex items-center gap-1.5"><span className="h-px w-4 bg-white" /> This month</span>
      <span className="flex items-center gap-1.5"><span className="w-4 border-t border-dashed border-white/40" /> Last month</span>
    </div>
    </div>
  )
}

const RECEIPT = [
  { label: 'Money left', value: 'Rp 5.120.250', sign: '' },
  { label: 'Kept for budgets', value: 'Rp 1.130.000', sign: '−' },
  { label: 'Bills to pay', value: 'Rp 2.250.000', sign: '−' },
]

function Receipt() {
  return (
    <div className="mt-6 rounded-xl border border-white/8 bg-black/30 px-4 py-1">
      {RECEIPT.map(r => (
        <div key={r.label} className="flex items-center justify-between border-b border-white/6 py-2.5 text-sm">
          <span className="text-white/60">{r.label}</span>
          <span className="tabular-nums text-white/80">{r.sign && <span className="mr-1 text-white/35">{r.sign}</span>}{r.value}</span>
        </div>
      ))}
      <div className="flex items-center justify-between py-3">
        <span className="text-sm font-semibold text-white">Free to spend</span>
        <span className="text-sm font-semibold tabular-nums text-white">Rp 1.740.250</span>
      </div>
    </div>
  )
}

// Where this month's money goes: spent / set aside / free
function MoneySplit() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-40px' })
  const parts = [
    { label: 'Spent', pct: 38, cls: 'bg-white/85' },
    { label: 'Set aside', pct: 40, cls: 'bg-white/35' },
    { label: 'Free', pct: 22, cls: 'bg-white/12' },
  ]
  return (
    <div ref={ref} className="mt-5">
      <div className="flex h-2 gap-1 overflow-hidden rounded-full">
        {parts.map((p, i) => (
          <motion.span key={p.label} className={`h-full origin-left rounded-full ${p.cls}`} style={{ width: `${p.pct}%` }}
            initial={{ scaleX: 0 }} animate={inView ? { scaleX: 1 } : {}}
            transition={{ duration: 0.8, delay: 0.2 + i * 0.2, ease: EASE }} />
        ))}
      </div>
      <div className={`${MONO} mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[10px] uppercase tracking-[0.12em] text-white/40`}>
        {parts.map(p => (
          <span key={p.label} className="flex items-center gap-1.5"><span className={`h-2 w-2 rounded-full ${p.cls}`} />{p.label} {p.pct}%</span>
        ))}
      </div>
    </div>
  )
}

// Deterministic "activity" levels so the grid looks the same on every render
const HEAT = Array.from({ length: 35 }, (_, i) => {
  const v = (Math.sin(i * 12.9898) * 43758.5453) % 1
  const n = Math.abs(v)
  return i % 7 === 5 ? Math.min(4, Math.round(n * 2) + 3) : Math.round(n * 3) // Saturdays run heavier
})
const HEAT_SHADE = ['bg-white/[0.04]', 'bg-white/15', 'bg-white/35', 'bg-white/60', 'bg-white/90']

function Heatmap() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-40px' })
  return (
    <div ref={ref} className="mt-6">
      <div className="grid max-w-[300px] grid-cols-7 gap-1.5">
        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
          <span key={i} className={`${MONO} text-center text-[10px] text-white/35`}>{d}</span>
        ))}
        {HEAT.map((lvl, i) => (
          <motion.span key={i}
            initial={{ opacity: 0, scale: 0.6 }} animate={inView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.4, delay: 0.1 + i * 0.015, ease: EASE }}
            className={`aspect-square rounded-[5px] ${HEAT_SHADE[lvl]}`} />
        ))}
      </div>
      <p className="mt-4 text-sm text-white/55"><span className="text-white">Saturdays</span> are your heaviest day.</p>
    </div>
  )
}

// ─── Smaller features: a quiet list instead of seven identical boxes ─────────

const MORE = [
  { title: 'Budget alerts', text: 'A warning before a category runs out.', Icon: Bell },
  { title: 'Savings goals', text: 'Set a target and watch it fill.', Icon: Target },
  { title: 'Recurring bills', text: 'Rent and subscriptions, never missed.', Icon: CalendarClock },
  { title: 'Split bills', text: 'Track who still owes you.', Icon: Users },
  { title: 'Debt tracking', text: 'Pay it down, payment by payment.', Icon: CreditCard },
  { title: 'Income tracking', text: 'Salary, freelance and side income.', Icon: ArrowDownToLine },
  { title: 'CSV export', text: 'Your data, out whenever you want.', Icon: FileDown },
  { title: 'Dark mode', text: 'Easy on the eyes at night.', Icon: Moon },
]

function CardTitle({ kicker, title }: { kicker: string; title: string }) {
  return (
    <div>
      <p className={`${MONO} text-[11px] uppercase tracking-[0.16em] text-white/40`}>{kicker}</p>
      <h3 className="mt-2 text-lg font-semibold tracking-tight text-white sm:text-xl">{title}</h3>
    </div>
  )
}

export default function Features() {
  return (
    <section id="features" aria-labelledby="features-title" className="scroll-mt-20 bg-[#0A0A0A] py-20 sm:py-28">
      <div className={CONTAINER}>
        {/* Editorial header: headline left, intro right */}
        <Reveal className="grid gap-6 border-b border-white/8 pb-10 md:grid-cols-2 md:items-end">
          <div>
            <p className={LABEL}>01 / Features</p>
            <h2 id="features-title" className={`${H2} mt-4`}>Every tool<br />you need.</h2>
          </div>
          <p className="max-w-md text-base leading-relaxed text-white/60 md:justify-self-end md:text-right">
            A complete personal finance solution in one place. Made for Rupiah, from the first coffee to the monthly rent.
          </p>
        </Reveal>

        {/* Bento: different sizes, each showing the real thing */}
        <div className="mt-10 grid gap-4 lg:grid-cols-6">
          <SpotlightCard className="p-6 sm:p-7 lg:col-span-4">
            <div className="grid gap-2 sm:grid-cols-[1fr_auto] sm:items-end">
              <CardTitle kicker="Expense tracking" title="Log the whole week in one go." />
              <p className="max-w-xs text-sm text-white/55 sm:text-right">Add one expense, or a week of them, with smart suggestions from your history.</p>
            </div>
            <WeekEntries />
          </SpotlightCard>

          <SpotlightCard className="flex flex-col p-6 sm:p-7 lg:col-span-2" delay={0.08}>
            <CardTitle kicker="Smart insights" title="Plain answers, not charts." />
            <p className="mt-6 text-sm text-white/55">By day 15 you have spent</p>
            <p className="mt-1 text-4xl font-bold tracking-[-0.03em] text-white">48% less</p>
            <p className="text-sm text-white/55">than last month at this point.</p>
            <InsightChart />
          </SpotlightCard>

          <SpotlightCard className="p-6 sm:p-7 lg:col-span-3" delay={0.04}>
            <CardTitle kicker="Reserved money" title="Know what is actually free." />
            <p className="mt-2 text-sm text-white/55">Budgets and bills you have planned are set aside before we tell you what you can spend.</p>
            <Receipt />
            <MoneySplit />
          </SpotlightCard>

          <SpotlightCard className="p-6 sm:p-7 lg:col-span-3" delay={0.1}>
            <CardTitle kicker="Daily spending" title="See your spending rhythm." />
            <p className="mt-2 text-sm text-white/55">Every day of the month at a glance. Tap a day to see exactly what you bought.</p>
            <Heatmap />
          </SpotlightCard>
        </div>

        {/* Also included */}
        <Reveal className="mt-14">
          <p className={LABEL}>Also included</p>
          <ul className="mt-5 grid grid-cols-2 gap-x-4 border-t border-white/8 lg:grid-cols-4 lg:gap-x-0">
            {MORE.map(f => (
              <li key={f.title} className="flex flex-col gap-2 border-b border-white/8 py-4 sm:flex-row sm:gap-3 sm:pr-6">
                <f.Icon size={16} strokeWidth={1.75} className="mt-0.5 shrink-0 text-white/50" aria-hidden />
                <div>
                  <p className="text-sm font-medium text-white">{f.title}</p>
                  <p className="mt-0.5 text-sm text-white/50">{f.text}</p>
                </div>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  )
}
