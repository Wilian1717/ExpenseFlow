'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { EASE, scrollToTop } from './motion'
import { BTN_PRIMARY, BTN_SECONDARY, CONTAINER } from './ui'
import styles from './landing.module.css'

const LINKS = [
  { label: 'Features', href: '#features' },
  { label: 'How it works', href: '#how' },
  { label: 'About', href: '#about' },
]

// Hamburger that morphs into an X. Opening: the outer lines slide to the centre,
// then rotate into an X while the middle line shrinks away. Closing plays it in reverse.
// Each outer line is two nested spans so the slide and the rotation can be sequenced.
const MORPH = 'transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none'
function MenuIcon({ open }: { open: boolean }) {
  const slide = open ? 'delay-0' : 'delay-200'      // slide first when opening, last when closing
  const turn = open ? 'delay-200' : 'delay-0'       // rotate last when opening, first when closing
  return (
    <span aria-hidden className="relative block h-3.5 w-5">
      <span className={`absolute inset-x-0 top-0 ${MORPH} ${slide} ${open ? 'translate-y-1.5' : ''}`}>
        <span className={`block h-0.5 w-full rounded-full bg-white ${MORPH} ${turn} ${open ? 'rotate-45' : ''}`} />
      </span>
      <span className={`absolute right-0 top-1.5 block h-0.5 w-full origin-right rounded-full bg-white transition-[transform,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
        open ? 'scale-x-0 opacity-0' : 'scale-x-100 opacity-100 delay-200'}`} />
      <span className={`absolute inset-x-0 top-3 ${MORPH} ${slide} ${open ? '-translate-y-1.5' : ''}`}>
        <span className={`block h-0.5 w-full rounded-full bg-white ${MORPH} ${turn} ${open ? '-rotate-45' : ''}`} />
      </span>
    </span>
  )
}

export function Logo({ size = 28, onClick }: { size?: number; onClick?: () => void }) {
  return (
    <Link href="/" aria-label="ExpenseFlow home" onClick={e => { onClick?.(); scrollToTop(e) }}
      className="inline-flex min-h-11 items-center gap-2.5 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">
      {/* White version of the real logo (public/logo2.png) for the dark theme */}
      <Image src="/logo2.png" alt="" width={size} height={size} className="shrink-0" priority />
      <span className="text-[17px] font-semibold tracking-tight text-white">ExpenseFlow</span>
    </Link>
  )
}

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Close the mobile menu on Escape
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const glass = scrolled || open
  return (
    <header
      className={`${styles.enterDown} fixed inset-x-0 top-0 z-50 border-b transition-[background-color,border-color,backdrop-filter] duration-500 ${
        glass ? 'border-white/8 bg-[#0A0A0A]/70 backdrop-blur-xl' : 'border-transparent bg-transparent'}`}
    >
      <nav aria-label="Main" className={`${CONTAINER} flex h-16 items-center justify-between`}>
        <Logo onClick={() => setOpen(false)} />

        <ul className="hidden items-center gap-8 md:flex">
          {LINKS.map(l => (
            <li key={l.href}>
              <a href={l.href} className="rounded text-sm text-white/65 transition-colors duration-300 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">
                {l.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="hidden items-center gap-2.5 md:flex">
          <Link href="/login" className={`${BTN_SECONDARY} min-h-10`}>Sign in</Link>
          <Link href="/register" className={`${BTN_PRIMARY} ${styles.shine} min-h-10`}>Get started</Link>
        </div>

        <button type="button" onClick={() => setOpen(v => !v)}
          aria-expanded={open} aria-controls="mobile-menu" aria-label={open ? 'Close menu' : 'Open menu'}
          className={`inline-flex h-11 w-11 items-center justify-center rounded-full border text-white transition-colors duration-500 md:hidden focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${
            open ? 'border-white/30 bg-white/8' : 'border-white/15'}`}>
          <MenuIcon open={open} />
        </button>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div id="mobile-menu"
            initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.45, ease: EASE }}
            className="border-t border-white/8 md:hidden">
            <motion.ul className={`${CONTAINER} flex flex-col py-3`}
              initial="hidden" animate="show"
              variants={{ show: { transition: { staggerChildren: 0.06, delayChildren: 0.05 } } }}>
              {LINKS.map(l => (
                <motion.li key={l.href} variants={{ hidden: { opacity: 0, y: -8 }, show: { opacity: 1, y: 0 } }}>
                  <a href={l.href} onClick={() => setOpen(false)}
                    className="flex min-h-12 items-center text-base text-white/80 hover:text-white">
                    {l.label}
                  </a>
                </motion.li>
              ))}
              <motion.li variants={{ hidden: { opacity: 0, y: -8 }, show: { opacity: 1, y: 0 } }}
                className="mt-3 grid grid-cols-2 gap-2.5 pb-2">
                <Link href="/login" onClick={() => setOpen(false)} className={`${BTN_SECONDARY} min-h-12`}>Sign in</Link>
                <Link href="/register" onClick={() => setOpen(false)} className={`${BTN_PRIMARY} min-h-12`}>
                  Get started <ArrowRight size={15} />
                </Link>
              </motion.li>
            </motion.ul>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
