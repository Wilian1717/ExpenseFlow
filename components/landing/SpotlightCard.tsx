'use client'

import { useRef } from 'react'
import { motion } from 'framer-motion'
import { EASE, useIsDesktop } from './motion'
import { GLASS } from './ui'

// Glass card with a cursor-following glow and a slight lift on hover (desktop only)
export default function SpotlightCard({ children, className = '', delay = 0 }: {
  children: React.ReactNode; className?: string; delay?: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const desktop = useIsDesktop()

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!desktop || !ref.current) return
    const r = ref.current.getBoundingClientRect()
    ref.current.style.setProperty('--mx', `${e.clientX - r.left}px`)
    ref.current.style.setProperty('--my', `${e.clientY - r.top}px`)
  }

  return (
    <motion.div ref={ref} onMouseMove={onMove}
      initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.8, delay, ease: EASE }}
      whileHover={desktop ? { y: -4 } : undefined}
      className={`group/card ${GLASS} overflow-hidden ${className}`}>
      {desktop && (
        <div aria-hidden
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover/card:opacity-100"
          style={{ background: 'radial-gradient(320px circle at var(--mx, 50%) var(--my, 50%), rgba(255,255,255,0.08), transparent 70%)' }} />
      )}
      <div className="relative">{children}</div>
    </motion.div>
  )
}
