'use client'

import { useRef } from 'react'
import Link from 'next/link'
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion'
import { ArrowRight, Play } from 'lucide-react'
import LaptopMockup from './LaptopMockup'
import { EASE, useIsDesktop } from './motion'
import { BTN_PRIMARY, BTN_SECONDARY, CONTAINER, DISPLAY } from './ui'
import styles from './landing.module.css'

const LINES = ['Your money,', 'finally under', 'control.']

// Badge / subtext / buttons: rise with a blur-to-sharp settle
const rise = (delay: number) => ({
  initial: { opacity: 0, y: 16, filter: 'blur(8px)' },
  animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
  transition: { duration: 0.8, delay, ease: EASE },
})

export default function Hero() {
  const ref = useRef<HTMLElement>(null)
  const desktop = useIsDesktop()
  const reduced = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  // "FLOW" drifts down as you scroll, so it moves slower than the page (desktop only)
  const flowY = useTransform(scrollYProgress, [0, 1], [0, desktop && !reduced ? 160 : 0])

  return (
    <section ref={ref} id="top" aria-labelledby="hero-title"
      className="relative overflow-hidden bg-[#0A0A0A] pb-16 pt-28 sm:pt-32 lg:pb-24 lg:pt-36">
      {/* Soft glows */}
      <div aria-hidden className="pointer-events-none absolute -top-40 right-[-10%] h-155 w-155 rounded-full bg-white/7 blur-[120px]" />
      <div aria-hidden className="pointer-events-none absolute left-[-15%] top-1/3 h-105 w-105 rounded-full bg-white/4 blur-[110px]" />

      <div className={`${CONTAINER} relative grid items-center gap-14 lg:grid-cols-[1fr_1.15fr] lg:gap-10`}>
        <div className="relative z-10">
          <motion.p {...rise(0.3)}
            className="inline-flex min-h-8 items-center gap-2 rounded-full border border-white/12 bg-white/4 px-3.5 text-[13px] text-white/80">
            <span className="h-1.5 w-1.5 rounded-full bg-white" aria-hidden />
            Free forever · No credit card
          </motion.p>

          <h1 id="hero-title"
            className={`${DISPLAY} mt-6 text-[46px] font-black leading-[0.95] tracking-[-0.04em] text-white sm:text-[64px] lg:text-[76px] xl:text-[84px]`}>
            {LINES.map((line, i) => (
              // Each line slides up from behind a mask
              <span key={line} className="block overflow-hidden pb-[0.08em]">
                <motion.span className={`block ${i === 2 ? styles.silver : ''}`}
                  initial={{ y: '110%' }} animate={{ y: '0%' }}
                  transition={{ duration: 0.95, delay: 0.45 + i * 0.12, ease: EASE }}>
                  {line}
                </motion.span>
              </span>
            ))}
          </h1>

          <motion.p {...rise(0.85)} className="mt-6 max-w-md text-base leading-relaxed text-white/60 sm:text-lg">
            Track spending, set budgets and hit your savings goals. Built for Indonesia, free for everyone.
          </motion.p>

          <motion.div {...rise(1)} className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/register" className={`${BTN_PRIMARY} ${styles.shine} min-h-12 px-6`}>
              Start tracking free
              <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
            <a href="#how" className={`${BTN_SECONDARY} min-h-12 px-6`}>
              <Play size={14} className="fill-white" /> See how it works
            </a>
          </motion.div>
        </div>

        <div className="relative">
          {/* Giant faded FLOW behind the laptop */}
          <motion.span aria-hidden style={{ y: flowY }}
            className={`${DISPLAY} pointer-events-none absolute -top-[18%] left-1/2 -translate-x-1/2 select-none bg-linear-to-b from-white/12 to-transparent bg-clip-text text-[34vw] font-black leading-none tracking-[-0.06em] text-transparent lg:-top-[34%] lg:text-[250px]`}>
            FLOW
          </motion.span>
          <LaptopMockup />
        </div>
      </div>
    </section>
  )
}
