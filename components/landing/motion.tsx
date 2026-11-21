'use client'

import { useEffect, useRef, useState } from 'react'
import { MotionConfig, animate, motion, useInView, useReducedMotion } from 'framer-motion'

export const EASE = [0.22, 1, 0.36, 1] as const

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

// Glide back to the top (used by the logo, which links to the page you're already on)
export function scrollToTop(e?: React.MouseEvent) {
  if (window.location.pathname !== '/') return          // on other pages, let the link navigate home
  e?.preventDefault()
  window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? 'auto' : 'smooth' })
  history.replaceState(null, '', '/')                   // drop any #section from the URL
}

// Respects prefers-reduced-motion for every framer-motion animation below it
export function LandingMotion({ children }: { children: React.ReactNode }) {
  // Smooth scrolling for #section links, only while the landing page is mounted
  // (so the dashboard and other pages keep normal scrolling) and never for reduced motion
  useEffect(() => {
    if (prefersReducedMotion()) return
    const html = document.documentElement
    const prev = html.style.scrollBehavior
    html.style.scrollBehavior = 'smooth'
    return () => { html.style.scrollBehavior = prev }
  }, [])

  return (
    <MotionConfig reducedMotion="user" transition={{ ease: EASE, duration: 0.8 }}>
      {children}
    </MotionConfig>
  )
}

// Fade up once as it enters the viewport
export function Reveal({ children, delay = 0, y = 24, className }: {
  children: React.ReactNode; delay?: number; y?: number; className?: string
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.8, ease: EASE, delay }}
    >
      {children}
    </motion.div>
  )
}

// True on large screens with a real mouse; used to switch off parallax/spotlight on touch
export function useIsDesktop() {
  const [desktop, setDesktop] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px) and (hover: hover) and (pointer: fine)')
    const update = () => setDesktop(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])
  return desktop
}

// Counts from 0 to `to` once `start` is true (instant when reduced motion is on)
export function useCountUp(to: number, start: boolean, duration = 1.6, delay = 0) {
  const reduced = useReducedMotion()
  const [value, setValue] = useState(0)
  useEffect(() => {
    if (!start) return
    if (reduced) { setValue(to); return }
    const controls = animate(0, to, { duration, delay, ease: EASE, onUpdate: v => setValue(v) })
    return () => controls.stop()
  }, [start, to, duration, delay, reduced])
  return value
}

// Count up when the element scrolls into view
export function CountUpInView({ to, format, className }: {
  to: number; format: (v: number) => string; className?: string
}) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: '-40px' })
  const v = useCountUp(to, inView, 1.4)
  return <span ref={ref} className={className}>{format(v)}</span>
}

// Indonesian decimal comma, e.g. 88.8 -> "88,8"
export const idDecimal = (v: number, digits = 1) => v.toFixed(digits).replace('.', ',')
