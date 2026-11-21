'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Reveal } from './motion'
import { BTN_PRIMARY, BTN_SECONDARY, CONTAINER, DISPLAY } from './ui'
import styles from './landing.module.css'

export default function Cta() {
  return (
    <section aria-labelledby="cta-title" className="bg-[#0A0A0A] pb-20 sm:pb-24">
      <div className={CONTAINER}>
        <Reveal>
          {/* 1px silver border with a slow light sweep running around it */}
          <div className="relative overflow-hidden rounded-3xl p-px shadow-[0_0_60px_-10px_rgba(255,255,255,0.25)]">
            <div aria-hidden className="absolute inset-0 rounded-3xl bg-white/25" />
            <div aria-hidden className={styles.borderSpin} />
            <div className="relative rounded-[calc(1.5rem-1px)] bg-[#0B0B0C] px-6 py-12 text-center sm:py-14">
              <div aria-hidden className="pointer-events-none absolute inset-x-1/4 top-0 h-32 rounded-full bg-white/6 blur-3xl" />
              <h2 id="cta-title" className={`${DISPLAY} relative text-[32px] font-extrabold leading-tight tracking-[-0.04em] text-white sm:text-5xl`}>
                Start today. It&apos;s free.
              </h2>
              <div className="relative mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link href="/register" className={`${BTN_PRIMARY} ${styles.shine} min-h-12 w-full px-6 sm:w-auto`}>
                  Create account
                  <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-1" />
                </Link>
                <Link href="/login" className={`${BTN_SECONDARY} ${styles.shine} min-h-12 w-full px-6 sm:w-auto`}>
                  I already have an account
                </Link>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
