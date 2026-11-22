'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import {
  AlertTriangle, ChevronDown, UtensilsCrossed, ShoppingBag, Car, Gamepad2,
  SlidersHorizontal, BarChart3, BellRing,
} from 'lucide-react'
import { EASE, Reveal, useIsDesktop } from './motion'
import { CONTAINER, H2, LABEL, MONO } from './ui'
import styles from './landing.module.css'

// Food & Drink is listed first but fills last, then turns red
const ROWS = [
  { label: 'Food & Drink', value: 'Rp 2,9jt / 3jt', left: 'Rp 100rb left', pct: 97, Icon: UtensilsCrossed, warn: true, order: 3 },
  { label: 'Shopping', value: 'Rp 1,2jt / 2jt', left: 'Rp 800rb left', pct: 60, Icon: ShoppingBag, warn: false, order: 0 },
  { label: 'Transport', value: 'Rp 450rb / 600rb', left: 'Rp 150rb left', pct: 75, Icon: Car, warn: false, order: 1 },
  { label: 'Entertainment', value: 'Rp 600rb / 1jt', left: 'Rp 400rb left', pct: 60, Icon: Gamepad2, warn: false, order: 2 },
]
const FILL_DELAY = (order: number) => 0.4 + order * 0.3
const WARN_AT = FILL_DELAY(3) + 0.9   // red layer fades in once Food & Drink has filled

const HOW = [
  { Icon: SlidersHorizontal, title: 'Set a limit for each category', text: 'Food, transport, shopping, anything you like.' },
  { Icon: BarChart3, title: 'Watch it fill as you log', text: 'Every expense updates its budget straight away.' },
  { Icon: BellRing, title: 'Get warned before it runs out', text: 'A red alert while there is still time to slow down.' },
]

export default function Overspend() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  const desktop = useIsDesktop()

  return (
    <section aria-labelledby="overspend-title" className="relative overflow-hidden border-y border-white/6 bg-[#0E0E0E] py-20 sm:py-28">
      <div aria-hidden className="pointer-events-none absolute right-[-25%] top-1/2 h-200 w-200 -translate-y-1/2 bg-[radial-gradient(closest-side,rgba(255,255,255,0.07),transparent)]" />
      <div className={`${CONTAINER} relative grid items-center gap-14 lg:grid-cols-[0.95fr_1.05fr] lg:gap-16`}>
        {/* Left: the promise, then how it works in three lines */}
        <Reveal>
          <p className={LABEL}>Budget alerts</p>
          <h2 id="overspend-title" className={`${H2} mt-4`}>Know before<br />you overspend.</h2>
          <p className="mt-4 max-w-md text-base leading-relaxed text-white/60">
            Set category limits and get instant alerts when you&apos;re close to your budget.
          </p>
          <ul className="mt-8 max-w-md border-t border-white/8">
            {HOW.map(h => (
              <li key={h.title} className="flex gap-4 border-b border-white/8 py-4">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/4 text-white/80">
                  <h.Icon size={16} strokeWidth={1.75} aria-hidden />
                </span>
                <div>
                  <p className="text-sm font-medium text-white">{h.title}</p>
                  <p className="mt-0.5 text-sm text-white/50">{h.text}</p>
                </div>
              </li>
            ))}
          </ul>
        </Reveal>

        {/* Right: a real-looking budgets panel with an alert toast */}
        <div className="relative pt-16 lg:pt-10" style={{ perspective: 1400 }}>
          {/* Alert toast slides in after the warning row turns red */}
          <motion.div
            initial={{ opacity: 0, y: -10 }} animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: WARN_AT + 0.3, ease: EASE }}
            role="status"
            className="absolute right-0 top-0 z-10 flex w-[min(100%,300px)] items-start gap-3 rounded-2xl border border-white/12 bg-[#1c1c1f]/90 p-3.5 shadow-[0_20px_40px_-16px_rgba(0,0,0,0.9)] backdrop-blur-md lg:-right-4 lg:-top-2">
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#EF4444]/15">
              <AlertTriangle size={15} className={`text-[#EF4444] ${styles.pulse}`} aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white">Food &amp; Drink is almost used up</p>
              <p className="mt-0.5 text-xs text-white/55">Rp 100rb left for the next 9 days</p>
            </div>
          </motion.div>

          <motion.div ref={ref}
            initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }} transition={{ duration: 0.9, ease: EASE }}
            style={desktop ? { rotateY: -8, rotateX: 3 } : undefined}
            className="rounded-2xl border border-white/10 bg-linear-to-b from-[#1a1a1c] to-[#111113] p-5 shadow-[0_40px_80px_-30px_rgba(0,0,0,0.9),inset_0_1px_0_rgba(255,255,255,0.08)] sm:p-7"
            role="group" aria-label="Example budgets for this month">
            <div className="flex items-center justify-between">
              <p className="text-lg font-semibold text-white">Budgets</p>
              <span className="inline-flex min-h-8 items-center gap-1 rounded-full border border-white/10 px-3 text-xs text-white/70">
                November <ChevronDown size={13} aria-hidden />
              </span>
            </div>

            {/* Month summary */}
            <div className="mt-5 rounded-xl border border-white/8 bg-black/30 p-4">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <p className={`${MONO} text-[10px] uppercase tracking-[0.14em] text-white/40`}>Used this month</p>
                  <p className="mt-1 text-2xl font-bold tracking-[-0.03em] text-white tabular-nums">Rp 5.150.000</p>
                </div>
                <p className="pb-1 text-xs text-white/50 tabular-nums">of Rp 6.600.000</p>
              </div>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/8">
                <motion.div className="h-full origin-left rounded-full bg-white" style={{ width: '78%' }}
                  initial={{ scaleX: 0 }} animate={inView ? { scaleX: 1 } : {}} transition={{ duration: 1.2, delay: 0.25, ease: EASE }} />
              </div>
            </div>

            <ul className="mt-5 space-y-5">
              {ROWS.map(r => (
                <li key={r.label} className="flex items-center gap-3.5">
                  <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${r.warn ? 'bg-[#EF4444]/15 text-[#EF4444]' : 'bg-white/10 text-white'}`}>
                    <r.Icon size={16} aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <span className="truncate text-sm text-white/85">{r.label}</span>
                      <span className={`text-sm font-semibold tabular-nums ${r.warn ? 'text-[#EF4444]' : 'text-white'}`}>{r.value}</span>
                    </div>
                    <div className="relative mt-2 h-2 overflow-hidden rounded-full bg-white/8">
                      {/* white fill, with a red layer that fades in for the warning row */}
                      <motion.div className="absolute inset-y-0 left-0 origin-left rounded-full bg-white/70"
                        style={{ width: `${r.pct}%` }}
                        initial={{ scaleX: 0 }} animate={inView ? { scaleX: 1 } : {}}
                        transition={{ duration: 1, delay: FILL_DELAY(r.order), ease: EASE }} />
                      {r.warn && (
                        <motion.div className="absolute inset-y-0 left-0 rounded-full bg-[#EF4444]"
                          style={{ width: `${r.pct}%` }}
                          initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}}
                          transition={{ duration: 0.6, delay: WARN_AT, ease: EASE }} />
                      )}
                    </div>
                    <p className={`mt-1.5 text-xs tabular-nums ${r.warn ? 'text-[#EF4444]/80' : 'text-white/40'}`}>{r.pct}% used · {r.left}</p>
                  </div>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
