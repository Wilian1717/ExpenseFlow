'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import {
  TrendingUp, BarChart3, Bell, Target, CalendarClock, Users, CreditCard, ArrowDownToLine, FileDown,
  UtensilsCrossed, Car, ShoppingBag,
} from 'lucide-react'
import SpotlightCard from './SpotlightCard'
import { EASE, Reveal } from './motion'
import { CONTAINER, H2, LABEL } from './ui'

const TX = [
  { label: 'Food & Drink', amount: '-Rp 85.000', Icon: UtensilsCrossed },
  { label: 'Transport', amount: '-Rp 40.000', Icon: Car },
  { label: 'Shopping', amount: '-Rp 230.000', Icon: ShoppingBag },
]

const SMALL = [
  { title: 'Budget Alerts', text: 'Get notified before you overspend.', Icon: Bell },
  { title: 'Savings Goals', text: 'Save for what matters most.', Icon: Target },
  { title: 'Recurring Bills', text: 'Never miss a payment.', Icon: CalendarClock },
  { title: 'Split Bills', text: 'Share expenses with friends.', Icon: Users },
  { title: 'Debt Tracking', text: 'Keep track of your debt.', Icon: CreditCard },
  { title: 'Income Tracking', text: 'Log all your income.', Icon: ArrowDownToLine },
  { title: 'CSV Export', text: 'Export your data anytime.', Icon: FileDown },
]

function CardHead({ Icon, title, text }: { Icon: React.ElementType; title: string; text: string }) {
  return (
    <div className="flex items-start gap-3.5">
      <Icon size={22} strokeWidth={1.75} className="mt-0.5 shrink-0 text-white" aria-hidden />
      <div>
        <h3 className="text-base font-semibold text-white">{title}</h3>
        <p className="mt-1 text-sm text-white/55">{text}</p>
      </div>
    </div>
  )
}

function TransactionList() {
  const ref = useRef<HTMLUListElement>(null)
  const inView = useInView(ref, { once: true, margin: '-40px' })
  return (
    <ul ref={ref} className="mt-5 space-y-1.5 rounded-xl border border-white/8 bg-black/30 p-2">
      {TX.map((t, i) => (
        <motion.li key={t.label}
          initial={{ opacity: 0, x: -14 }} animate={inView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.25 + i * 0.12, ease: EASE }}
          className="flex items-center justify-between gap-3 rounded-lg px-2.5 py-2">
          <span className="flex items-center gap-2.5 text-sm text-white/80">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10"><t.Icon size={14} aria-hidden /></span>
            {t.label}
          </span>
          <span className="text-sm tabular-nums text-white/70">{t.amount}</span>
        </motion.li>
      ))}
    </ul>
  )
}

function InsightsChart() {
  const ref = useRef<SVGSVGElement>(null)
  const inView = useInView(ref, { once: true, margin: '-40px' })
  const d = 'M4 74 C 40 70, 56 50, 86 56 S 132 72, 160 58 S 210 30, 236 44 S 280 24, 316 8'
  return (
    <svg ref={ref} viewBox="0 0 320 90" className="mt-6 h-24 w-full" aria-hidden>
      <defs>
        <linearGradient id="insightFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <motion.path d={`${d} L316 90 L4 90 Z`} fill="url(#insightFill)"
        initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}} transition={{ duration: 1, delay: 0.9, ease: EASE }} />
      <motion.path d={d} fill="none" stroke="#ffffff" strokeWidth="1.75" strokeLinecap="round"
        initial={{ pathLength: 0 }} animate={inView ? { pathLength: 1 } : {}} transition={{ duration: 1.6, delay: 0.2, ease: EASE }} />
    </svg>
  )
}

export default function Features() {
  return (
    <section id="features" aria-labelledby="features-title" className="scroll-mt-20 bg-[#0A0A0A] py-20 sm:py-24">
      <div className={CONTAINER}>
        <div className="grid gap-4 lg:grid-cols-[0.85fr_1fr_1fr]">
          <Reveal className="pb-4 lg:pb-0 lg:pr-6">
            <p className={LABEL}>01 / Features</p>
            <h2 id="features-title" className={`${H2} mt-4`}>Every tool<br />you need.</h2>
            <p className="mt-4 max-w-xs text-base text-white/60">A complete personal finance solution in one place.</p>
          </Reveal>

          <SpotlightCard className="p-6" delay={0.05}>
            <CardHead Icon={TrendingUp} title="Expense Tracking" text="Track every expense effortlessly." />
            <TransactionList />
          </SpotlightCard>

          <SpotlightCard className="p-6" delay={0.12}>
            <CardHead Icon={BarChart3} title="Smart Insights" text="See your spending trends and more." />
            <InsightsChart />
          </SpotlightCard>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {SMALL.slice(0, 4).map((f, i) => (
            <SpotlightCard key={f.title} className="p-5" delay={i * 0.06}>
              <CardHead Icon={f.Icon} title={f.title} text={f.text} />
            </SpotlightCard>
          ))}
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SMALL.slice(4).map((f, i) => (
            <SpotlightCard key={f.title} className="p-5" delay={i * 0.06}>
              <CardHead Icon={f.Icon} title={f.title} text={f.text} />
            </SpotlightCard>
          ))}
        </div>
      </div>
    </section>
  )
}
