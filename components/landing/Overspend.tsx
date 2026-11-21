'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { AlertTriangle, ChevronDown, UtensilsCrossed, ShoppingBag, Gamepad2 } from 'lucide-react'
import { EASE, Reveal, useIsDesktop } from './motion'
import { CONTAINER, H2 } from './ui'
import styles from './landing.module.css'

// Food & Drink is listed first but fills last, then turns red
const ROWS = [
  { label: 'Food & Drink', value: 'Rp 2,9jt / 3jt', pct: 97, Icon: UtensilsCrossed, warn: true, order: 2 },
  { label: 'Shopping', value: 'Rp 1,2jt / 2jt', pct: 60, Icon: ShoppingBag, warn: false, order: 0 },
  { label: 'Entertainment', value: 'Rp 600rb / 1jt', pct: 60, Icon: Gamepad2, warn: false, order: 1 },
]

export default function Overspend() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  const desktop = useIsDesktop()

  return (
    <section aria-labelledby="overspend-title" className="relative overflow-hidden border-y border-white/6 bg-[#0E0E0E] py-20 sm:py-24">
      <div aria-hidden className="pointer-events-none absolute right-[-10%] top-1/2 h-120 w-120 -translate-y-1/2 rounded-full bg-white/6 blur-[120px]" />
      <div className={`${CONTAINER} relative grid items-center gap-12 lg:grid-cols-[0.9fr_1.1fr]`}>
        <Reveal>
          <h2 id="overspend-title" className={H2}>Know before<br />you overspend.</h2>
          <p className="mt-4 max-w-sm text-base text-white/60">
            Set category limits and get instant alerts when you&apos;re close to your budget.
          </p>
        </Reveal>

        <div style={{ perspective: 1400 }}>
          <motion.div ref={ref}
            initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }} transition={{ duration: 0.9, ease: EASE }}
            style={desktop ? { rotateY: -10, rotateX: 4 } : undefined}
            className="rounded-2xl border border-white/10 bg-linear-to-b from-[#1a1a1c] to-[#111113] p-5 shadow-[0_40px_80px_-30px_rgba(0,0,0,0.9),inset_0_1px_0_rgba(255,255,255,0.08)] sm:p-7"
            role="group" aria-label="Example budgets for this month">
            <div className="mb-6 flex items-center justify-between">
              <p className="text-lg font-semibold text-white">Budgets</p>
              <span className="inline-flex items-center gap-1 text-sm text-white/70">This Month <ChevronDown size={15} aria-hidden /></span>
            </div>

            <ul className="space-y-6">
              {ROWS.map(r => (
                <li key={r.label} className="flex items-center gap-3.5">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-white"><r.Icon size={16} aria-hidden /></span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <span className="truncate text-sm text-white/85">{r.label}</span>
                      <span className={`text-sm font-semibold tabular-nums ${r.warn ? 'text-[#EF4444]' : 'text-white'}`}>{r.value}</span>
                    </div>
                    <div className="relative mt-2.5 h-2 overflow-hidden rounded-full bg-white/8">
                      {/* white fill, with a red layer that fades in for the warning row */}
                      <motion.div className="absolute inset-y-0 left-0 origin-left rounded-full bg-white/70"
                        style={{ width: `${r.pct}%` }}
                        initial={{ scaleX: 0 }} animate={inView ? { scaleX: 1 } : {}}
                        transition={{ duration: 1, delay: 0.3 + r.order * 0.35, ease: EASE }} />
                      {r.warn && (
                        <motion.div className="absolute inset-y-0 left-0 rounded-full bg-[#EF4444]"
                          style={{ width: `${r.pct}%` }}
                          initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}}
                          transition={{ duration: 0.6, delay: 0.3 + r.order * 0.35 + 0.9, ease: EASE }} />
                      )}
                    </div>
                  </div>
                  <span className="flex w-6 shrink-0 justify-center">
                    {r.warn && (
                      <motion.span initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}} transition={{ delay: 1.9, duration: 0.5 }}>
                        <AlertTriangle size={20} className={`text-[#EF4444] ${styles.pulse}`} aria-label="Close to budget limit" />
                      </motion.span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
