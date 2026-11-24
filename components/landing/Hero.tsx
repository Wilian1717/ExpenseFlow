'use client'

import { useRef } from 'react'
import Link from 'next/link'
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion'
import { ArrowRight, Play } from 'lucide-react'
import LaptopMockup from './LaptopMockup'
import { useIsDesktop } from './motion'
import { BTN_PRIMARY, BTN_SECONDARY, CONTAINER, DISPLAY } from './ui'
import styles from './landing.module.css'

const LINES = ['Your money,', 'finally under', 'control.']

// Entrance runs in CSS (landing.module.css) so it starts on first paint,
// without waiting for JavaScript. This just staggers the start times.
const delay = (s: number) => ({ animationDelay: `${s}s` })

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
      {/* Soft glows: radial gradients look the same as big blurs but cost nothing to paint */}
      <div aria-hidden className="pointer-events-none absolute -top-72 right-[-25%] h-225 w-225 bg-[radial-gradient(closest-side,rgba(255,255,255,0.08),transparent)]" />
      <div aria-hidden className="pointer-events-none absolute left-[-30%] top-1/4 h-160 w-160 bg-[radial-gradient(closest-side,rgba(255,255,255,0.045),transparent)]" />

      <div className={`${CONTAINER} relative grid items-center lg:grid-cols-[1fr_1.15fr] lg:gap-10`}>
        {/* Phones: the text column dissolves (display: contents) so the laptop can sit
            between the subtext and the buttons. Desktop keeps two columns. */}
        <div className="contents lg:relative lg:z-10 lg:block">
          <h1 id="hero-title"
            className={`${DISPLAY} text-[46px] font-black leading-[0.95] tracking-[-0.04em] text-white sm:text-[64px] lg:text-[76px] xl:text-[84px]`}>
            {LINES.map((line, i) => (
              // Each line slides up from behind a mask
              <span key={line} className="block overflow-hidden pb-[0.08em]">
                <span className={styles.lineUp} style={delay(0.1 + i * 0.08)}>
                  <span className={i === 2 ? styles.silver : ''}>{line}</span>
                </span>
              </span>
            ))}
          </h1>

          <p style={delay(0.4)} className={`${styles.rise} mt-6 max-w-md text-base leading-relaxed text-white/60 sm:text-lg`}>
            Track spending, set budgets and hit your savings goals. Simple, fast and free for everyone.
          </p>

          <div style={delay(0.5)} className={`${styles.rise} order-2 mt-12 flex flex-col gap-3 sm:flex-row lg:order-0 lg:mt-8`}>
            <Link href="/register" className={`${BTN_PRIMARY} ${styles.shine} min-h-12 px-6`}>
              Start tracking free
              <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
            <a href="#how" className={`${BTN_SECONDARY} min-h-12 px-6`}>
              <Play size={14} className="fill-white" /> See how it works
            </a>
          </div>
        </div>

        <div className="relative order-1 mt-14 lg:order-0 lg:mt-0 lg:pl-6">
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
