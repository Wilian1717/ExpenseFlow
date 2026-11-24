'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { animate, motion, useMotionValue, useReducedMotion, useSpring, useTransform } from 'framer-motion'
import { LayoutGrid, Receipt, Wallet, CreditCard, Target, Lightbulb, Settings, Eye } from 'lucide-react'
import { EASE, idDecimal, useCountUp, useIsDesktop } from './motion'
import styles from './landing.module.css'

// Final resting tilt on desktop (mobile stays flat so it fits and stays readable)
const TILT_X = 9
const TILT_Y = -12

const BARS = [38, 62, 45, 80, 55, 92, 48, 70, 86, 58, 74, 96, 66]
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
const CATS = [
  { label: 'Food & Drink', pct: 34, color: '#ffffff' },
  { label: 'Shopping', pct: 28, color: '#c7c9cc' },
  { label: 'Entertainment', pct: 18, color: '#8b8e93' },
  { label: 'Others', pct: 20, color: '#4b4e53' },
]
const NAV = [
  { label: 'Dashboard', Icon: LayoutGrid },
  { label: 'Expenses', Icon: Receipt },
  { label: 'Income', Icon: Wallet },
  { label: 'Bills', Icon: CreditCard },
  { label: 'Goals', Icon: Target },
  { label: 'Insights', Icon: Lightbulb },
  { label: 'Settings', Icon: Settings },
]

export default function LaptopMockup() {
  const desktop = useIsDesktop()
  const reduced = useReducedMotion()
  const tilt = desktop && !reduced

  // Base tilt animates in from a steeper angle; mouse parallax is added on top
  const baseX = useMotionValue(tilt ? 26 : 0)
  const baseY = useMotionValue(tilt ? -32 : 0)
  const mouseX = useSpring(0, { stiffness: 80, damping: 18 })
  const mouseY = useSpring(0, { stiffness: 80, damping: 18 })
  const rotateX = useTransform(() => baseX.get() + mouseX.get())
  const rotateY = useTransform(() => baseY.get() + mouseY.get())

  useEffect(() => {
    const cx = animate(baseX, tilt ? TILT_X : 0, { duration: 1.2, delay: 0.25, ease: EASE })
    const cy = animate(baseY, tilt ? TILT_Y : 0, { duration: 1.2, delay: 0.25, ease: EASE })
    return () => { cx.stop(); cy.stop() }
  }, [tilt, baseX, baseY])

  // Dashboard contents start animating once the laptop has landed
  const [play, setPlay] = useState(false)
  useEffect(() => { const t = setTimeout(() => setPlay(true), reduced ? 0 : 700); return () => clearTimeout(t) }, [reduced])
  const balance = useCountUp(88.8, play, 1.6)
  const month = useCountUp(12.4, play, 1.6, 0.1)

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!tilt) return
    const r = e.currentTarget.getBoundingClientRect()
    const dx = (e.clientX - r.left) / r.width - 0.5
    const dy = (e.clientY - r.top) / r.height - 0.5
    mouseX.set(dy * -6)
    mouseY.set(dx * 8)
  }
  const onLeave = () => { mouseX.set(0); mouseY.set(0) }

  let offset = 0
  return (
    <div
      // Narrower on phones so the lid and keyboard deck never touch the screen edges.
      // Fade-in is CSS so the laptop shows on first paint, before JavaScript loads.
      className={`${styles.laptopIn} relative mx-auto w-[84%] max-w-160 sm:w-full`}
      style={{ perspective: 1600, animationDelay: '0.2s' }}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      role="img"
      aria-label="ExpenseFlow dashboard on a laptop: total balance Rp 88,8jt, this month Rp 12,4jt, a spending chart and top categories"
    >
      {/* Soft white glow under the laptop */}
      <div aria-hidden className="pointer-events-none absolute inset-x-[12%] -bottom-6 h-20 rounded-full bg-white/25 blur-3xl" />

      <motion.div style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }} className="relative will-change-transform">
        {/* Lid: thin brushed-aluminium rim around a black glass bezel.
            White halo glows out from behind the screen's edges (like the CTA box). */}
        <div className="relative rounded-[20px] bg-linear-to-b from-[#e4e6ea] via-[#8d9198] to-[#4a4d53] p-0.5 shadow-[0_50px_90px_-35px_rgba(0,0,0,0.95),0_0_80px_-8px_rgba(255,255,255,0.18),0_0_30px_-6px_rgba(255,255,255,0.20)] sm:p-0.75">
        <div className="relative rounded-[18px] bg-[#050506] px-[1.8%] pb-[2.4%] pt-[2.6%] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06),inset_0_1px_0_rgba(255,255,255,0.12)]">
          {/* camera */}
          <span aria-hidden className="absolute left-1/2 top-[0.9%] h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-[#1c1d20] ring-1 ring-white/10 sm:top-[1.1%]">
            <span className="absolute inset-[30%] rounded-full bg-[#2f3a4a]" />
          </span>
          <div className="@container relative aspect-16/10 overflow-hidden rounded-md bg-[#0B0B0C] text-white">
            {/* glass glare: soft diagonal sweep + a thin bright top edge */}
            <div aria-hidden className="pointer-events-none absolute inset-0 z-10 bg-[linear-gradient(115deg,rgba(255,255,255,0.10)_0%,rgba(255,255,255,0.03)_28%,transparent_42%,transparent_70%,rgba(255,255,255,0.04)_100%)]" />
            <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 z-10 h-px bg-white/15" />

            <div className="flex h-full gap-[2cqw] p-[2.2cqw]">
              {/* Sidebar (hidden when the screen is small, e.g. on phones) */}
              <aside className="hidden w-[21%] shrink-0 flex-col gap-[0.9cqw] @md:flex">
                <div className="mb-[1.4cqw] flex items-center gap-[1cqw]">
                  <Image src="/logo2.png" alt="" width={20} height={20} className="h-[2.6cqw] w-[2.6cqw]" />
                  <span className="text-[1.7cqw] font-semibold">ExpenseFlow</span>
                </div>
                {NAV.map(({ label, Icon }, i) => (
                  <div key={label} className={`flex items-center gap-[1cqw] rounded-[0.9cqw] px-[1cqw] py-[0.8cqw] text-[1.45cqw] ${i === 0 ? 'bg-white/10 text-white' : 'text-white/45'}`}>
                    <Icon className="h-[1.7cqw] w-[1.7cqw]" /> {label}
                  </div>
                ))}
              </aside>

              <div className="flex min-w-0 flex-1 flex-col gap-[1.8cqw]">
                {/* Top bar */}
                <div className="flex items-center justify-between">
                  <span className="text-[max(8px,1.8cqw)] font-semibold text-white/85">Dashboard</span>
                  <span className="flex h-[max(16px,3cqw)] w-[max(16px,3cqw)] items-center justify-center rounded-full bg-white text-[max(7px,1.4cqw)] font-bold text-black">W</span>
                </div>

                {/* Balance cards */}
                <div className="grid grid-cols-2 gap-[1.6cqw]">
                  {[
                    { label: 'Total Balance', value: `Rp ${idDecimal(balance)}jt` },
                    { label: 'This Month', value: `Rp ${idDecimal(month)}jt` },
                  ].map(c => (
                    <div key={c.label} className="rounded-[1.4cqw] border border-white/10 bg-white/4 p-[1.8cqw]">
                      <div className="flex items-center justify-between text-[max(7px,1.4cqw)] text-white/55">
                        {c.label} <Eye className="h-[max(8px,1.5cqw)] w-[max(8px,1.5cqw)]" />
                      </div>
                      <p className="mt-[0.8cqw] text-[max(13px,3.4cqw)] font-bold tracking-tight tabular-nums">{c.value}</p>
                    </div>
                  ))}
                </div>

                {/* Chart + donut */}
                <div className="grid min-h-0 flex-1 grid-cols-[1.45fr_1fr] gap-[1.6cqw]">
                  <div className="flex min-h-0 flex-col rounded-[1.4cqw] border border-white/10 bg-white/4 p-[1.6cqw]">
                    <p className="text-[max(7px,1.4cqw)] font-medium text-white/70">Spending Overview</p>
                    <div className="mt-[1cqw] flex min-h-0 flex-1 items-end gap-[0.7cqw]">
                      {BARS.map((h, i) => (
                        <motion.div key={i}
                          initial={{ scaleY: 0 }} animate={play ? { scaleY: 1 } : { scaleY: 0 }}
                          transition={{ duration: 0.8, delay: i * 0.05, ease: EASE }}
                          className="flex-1 origin-bottom rounded-t-[0.4cqw] bg-linear-to-t from-white/50 to-white"
                          style={{ height: `${h}%` }} />
                      ))}
                    </div>
                    <div className="mt-[0.8cqw] flex justify-between text-[max(6px,1.15cqw)] text-white/40">
                      {MONTHS.map(m => <span key={m}>{m}</span>)}
                    </div>
                  </div>

                  <div className="flex min-h-0 flex-col rounded-[1.4cqw] border border-white/10 bg-white/4 p-[1.6cqw]">
                    <p className="text-[max(7px,1.4cqw)] font-medium text-white/70">Top Categories</p>
                    <div className="flex min-h-0 flex-1 items-center gap-[1.4cqw]">
                      <svg viewBox="0 0 36 36" className="h-auto w-[42%] shrink-0 -rotate-90" aria-hidden>
                        <circle cx="18" cy="18" r="14" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="5" />
                        {CATS.map(c => {
                          const el = (
                            <motion.circle key={c.label} cx="18" cy="18" r="14" fill="none" stroke={c.color} strokeWidth="5"
                              pathLength={100} strokeDashoffset={-offset}
                              initial={{ strokeDasharray: '0 100' }}
                              animate={{ strokeDasharray: play ? `${c.pct - 1} ${101 - c.pct}` : '0 100' }}
                              transition={{ duration: 1, delay: 0.2 + offset / 120, ease: EASE }} />
                          )
                          offset += c.pct
                          return el
                        })}
                      </svg>
                      <ul className="min-w-0 space-y-[0.6cqw]">
                        {CATS.map(c => (
                          <li key={c.label} className="flex items-center gap-[0.7cqw] text-[max(6px,1.15cqw)] leading-tight text-white/70">
                            <span className="h-[max(5px,0.9cqw)] w-[max(5px,0.9cqw)] shrink-0 rounded-full" style={{ background: c.color }} />
                            <span className="truncate">{c.label} <span className="text-white/40">{c.pct}%</span></span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        </div>

        {/* Hinge */}
        <div aria-hidden className="relative mx-[2%] h-1.5 rounded-b-sm bg-linear-to-b from-[#0b0b0c] via-[#2a2c30] to-[#55585e]" />

        {/* Keyboard deck: a real 3D plane folding toward the viewer. Positioned
            absolutely so its unrotated height doesn't take up layout space.
            Perspective widens the near edge, and by a different amount when the
            laptop is tilted (desktop) vs flat (phones), so the side inset differs:
            either way the front of the base ends up the same width as the screen. */}
        <div aria-hidden className="absolute top-full"
          style={{ transformStyle: 'preserve-3d', left: tilt ? '3.5%' : '1%', right: tilt ? '3.5%' : '1%' }}>
          <div className="relative origin-top rounded-b-[12px] shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]"
            style={{
              transform: `rotateX(${tilt ? 83 : 87}deg)`, aspectRatio: '16 / 5', transformStyle: 'preserve-3d',
              // polished aluminium
              background: 'linear-gradient(180deg, #f6f7f9 0%, #dfe2e6 20%, #bcc0c6 58%, #9ea3aa 100%)',
            }}>
            {/* specular sheen across the metal */}
            <div className="absolute inset-0 rounded-b-[12px]" style={{ background: 'linear-gradient(100deg, transparent 18%, rgba(255,255,255,0.65) 42%, rgba(255,255,255,0.15) 52%, transparent 66%)' }} />
            {/* keyboard well with individual keycaps */}
            <div className="absolute inset-x-[11%] top-[9%] h-[52%] rounded-[6px] bg-[#2b2d31] shadow-[inset_0_1px_2px_rgba(0,0,0,0.6)]"
              style={{
                backgroundImage:
                  'repeating-linear-gradient(90deg, transparent 0, transparent calc(100% / 15 - 2px), #0b0c0e calc(100% / 15 - 2px), #0b0c0e calc(100% / 15)),' +
                  'repeating-linear-gradient(0deg, transparent 0, transparent calc(100% / 5 - 2px), #0b0c0e calc(100% / 5 - 2px), #0b0c0e calc(100% / 5)),' +
                  'linear-gradient(180deg, rgba(255,255,255,0.10), transparent 60%)',
              }} />
            {/* glossy trackpad */}
            <div className="absolute bottom-[8%] left-1/2 h-[27%] w-[33%] -translate-x-1/2 rounded-[6px] shadow-[inset_0_0_0_1px_rgba(0,0,0,0.10),inset_0_1px_0_rgba(255,255,255,0.8)]"
              style={{ background: 'linear-gradient(180deg, #d4d7db 0%, #b3b8be 100%)' }} />
            {/* shiny front lip, standing upright at the near edge */}
            <div className="absolute inset-x-0 top-full h-[5%] origin-top rounded-b-[12px]"
              style={{ transform: 'rotateX(-90deg)', background: 'linear-gradient(180deg, #f0f2f5 0%, #a3a8af 45%, #55595f 100%)' }}>
              <span className="absolute left-1/2 top-0 h-[40%] w-[15%] -translate-x-1/2 rounded-b-md bg-black/25" />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Contact shadow under the base */}
      <div aria-hidden className="pointer-events-none mx-auto -mt-1 h-6 w-[96%] rounded-[50%] bg-black/70 blur-xl sm:h-8" />
    </div>
  )
}
