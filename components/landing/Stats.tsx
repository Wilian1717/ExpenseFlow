'use client'

import { motion } from 'framer-motion'
import { CountUpInView, EASE } from './motion'
import { CONTAINER, DISPLAY } from './ui'

// Product facts only (no user counts or ratings)
const STATS: { value: React.ReactNode; label: string }[] = [
  { value: 'Rp 0', label: 'forever' },
  { value: <CountUpInView to={9} format={v => String(Math.round(v))} />, label: 'connected tools' },
  { value: 'IDR', label: 'native currency' },
  { value: 'CSV', label: 'export anytime' },
]

export default function Stats() {
  return (
    <section aria-label="ExpenseFlow at a glance" className="border-y border-white/6 bg-[#0E0E0E]">
      <div className={`${CONTAINER} grid grid-cols-2 md:grid-cols-4`}>
        {STATS.map((s, i) => (
          <motion.div key={s.label}
            initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.7, delay: i * 0.08, ease: EASE }}
            className={`flex flex-col items-center justify-center py-8 text-center sm:py-10
              ${i % 2 === 1 ? 'border-l border-white/8' : ''} ${i >= 2 ? 'border-t border-white/8 md:border-t-0' : ''} ${i === 2 ? 'md:border-l' : ''}`}>
            <p className={`${DISPLAY} text-3xl font-extrabold tracking-[-0.03em] text-white sm:text-4xl`}>{s.value}</p>
            <p className="mt-1.5 text-sm text-white/55">{s.label}</p>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
