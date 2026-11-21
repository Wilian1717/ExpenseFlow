'use client'

import { CircleCheck } from 'lucide-react'
import { Reveal } from './motion'
import { CONTAINER, DISPLAY, GLASS } from './ui'

const POINTS = ['Your data stays in your account', 'No ads', 'No subscription']

export default function Builder() {
  return (
    <section id="about" aria-labelledby="about-title" className="scroll-mt-20 bg-[#0A0A0A] pb-20 sm:pb-24">
      <div className={CONTAINER}>
        <Reveal>
          <div className={`${GLASS} grid gap-8 p-6 sm:p-8 md:grid-cols-[1.6fr_1fr] md:items-center md:gap-10`}>
            <figure>
              <h2 id="about-title" className={`${DISPLAY} text-2xl font-extrabold tracking-[-0.03em] text-white sm:text-[28px]`}>
                Built by one developer.
              </h2>
              <blockquote className="mt-3 max-w-xl text-[15px] leading-relaxed text-white/65">
                I built ExpenseFlow because every finance app I tried was either paid, cluttered or not made for Rupiah.
                So I made the one I wanted to use.
              </blockquote>
              <figcaption className="mt-3 text-sm font-semibold text-white">Wilian, creator</figcaption>
            </figure>

            <ul className="space-y-3.5 border-white/10 md:border-l md:pl-10">
              {POINTS.map(p => (
                <li key={p} className="flex items-center gap-3 text-[15px] text-white/80">
                  <CircleCheck size={18} strokeWidth={1.75} className="shrink-0 text-white" aria-hidden />
                  {p}
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
