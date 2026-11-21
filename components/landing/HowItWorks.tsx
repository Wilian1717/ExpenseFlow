'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { EASE, Reveal } from './motion'
import { CONTAINER, DISPLAY, H2, LABEL } from './ui'

const STEPS = [
  { n: '1', title: 'Create your account', text: "It's free and takes less than a minute." },
  { n: '2', title: 'Add income and expenses', text: 'Log your transactions in seconds.' },
  { n: '3', title: 'Track and grow', text: 'See insights and reach your goals.' },
]

// Outlined number that draws itself in
function StepNumber({ n, play, delay }: { n: string; play: boolean; delay: number }) {
  return (
    <svg viewBox="0 0 60 80" className="h-16 w-12 shrink-0 sm:h-20 sm:w-15" aria-hidden>
      <motion.text x="50%" y="66" textAnchor="middle"
        className={`${DISPLAY}`} fontSize="76" fontWeight="300"
        fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth="1.2"
        strokeDasharray="420" initial={{ strokeDashoffset: 420 }}
        animate={play ? { strokeDashoffset: 0 } : {}}
        transition={{ duration: 1.6, delay, ease: EASE }}>
        {n}
      </motion.text>
    </svg>
  )
}

export default function HowItWorks() {
  const ref = useRef<HTMLOListElement>(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section id="how" aria-labelledby="how-title" className="scroll-mt-20 bg-[#0A0A0A] py-20 sm:py-24">
      <div className={`${CONTAINER} grid gap-10 lg:grid-cols-[0.6fr_2fr] lg:items-center`}>
        <Reveal>
          <p className={LABEL}>02 / How it works</p>
          <h2 id="how-title" className={`${H2} mt-4`}>How it works.</h2>
        </Reveal>

        <ol ref={ref} className="relative grid gap-8 md:grid-cols-3 md:gap-6">
          {/* Connecting line that grows between the steps (desktop) */}
          <motion.span aria-hidden
            className="absolute left-[8%] right-[8%] top-10 hidden h-px origin-left bg-linear-to-r from-white/0 via-white/25 to-white/0 md:block"
            initial={{ scaleX: 0 }} animate={inView ? { scaleX: 1 } : {}} transition={{ duration: 1.4, delay: 0.3, ease: EASE }} />
          {STEPS.map((s, i) => (
            <motion.li key={s.n}
              initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: i * 0.15, ease: EASE }}
              className="relative flex items-start gap-4 bg-[#0A0A0A] md:pr-4">
              <StepNumber n={s.n} play={inView} delay={0.2 + i * 0.2} />
              <div className="pt-3">
                <h3 className="text-base font-semibold text-white">{s.title}</h3>
                <p className="mt-1.5 text-sm text-white/55">{s.text}</p>
              </div>
            </motion.li>
          ))}
        </ol>
      </div>
    </section>
  )
}
