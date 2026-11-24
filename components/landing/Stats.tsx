'use client'

import { motion } from 'framer-motion'
import { CountUpInView, EASE } from './motion'
import { CONTAINER, DISPLAY, MONO } from './ui'
import styles from './landing.module.css'

// Product facts only (no user counts or ratings)
const STATS: { value: React.ReactNode; label: string; note: string }[] = [
  { value: 'Free', label: 'Forever', note: 'Every feature, no paywall.' },
  { value: <CountUpInView to={9} format={v => String(Math.round(v))} />, label: 'Connected tools', note: 'Budgets, bills, goals and more.' },
  { value: '0', label: 'Ads, ever', note: 'Your data is never sold.' },
  { value: 'CSV', label: 'Export anytime', note: 'Take your data with you.' },
]

export default function Stats() {
  return (
    <section aria-label="ExpenseFlow at a glance" className="relative overflow-hidden border-y border-white/6 bg-[#0E0E0E] py-12 sm:py-16">
      {/* soft light behind the row */}
      <div aria-hidden className="pointer-events-none absolute left-1/2 top-1/2 h-[420px] w-[900px] -translate-x-1/2 -translate-y-1/2 bg-[radial-gradient(closest-side,rgba(255,255,255,0.05),transparent)]" />
      <div className={`${CONTAINER} relative grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4`}>
        {STATS.map((s, i) => (
          <motion.div key={s.label}
            initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.8, delay: i * 0.08, ease: EASE }}
            className="group relative overflow-hidden rounded-2xl border border-white/8 bg-linear-to-b from-white/5 to-white/1 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.07)] transition-[border-color,transform] duration-500 hover:-translate-y-1 hover:border-white/20 sm:p-6">
            {/* light gliding along the top edge */}
            <span aria-hidden className={`${styles.edgeLight} pointer-events-none absolute inset-x-0 top-0 h-px`} style={{ animationDelay: `${i * 0.9}s` }} />
            {/* glow that blooms on hover */}
            <span aria-hidden className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-[radial-gradient(closest-side,rgba(255,255,255,0.14),transparent)] opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

            <span className={`${MONO} text-[10px] tracking-[0.18em] text-white/35`}>0{i + 1}</span>
            <p className={`${DISPLAY} ${styles.silver} mt-5 text-4xl font-black leading-none tracking-[-0.04em] sm:text-5xl`}>{s.value}</p>
            <p className="mt-3 text-sm font-medium text-white">{s.label}</p>
            <p className="mt-1 text-xs leading-relaxed text-white/45 sm:text-[13px]">{s.note}</p>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
