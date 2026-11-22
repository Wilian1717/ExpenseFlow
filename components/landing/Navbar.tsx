'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, Menu, X } from 'lucide-react'
import { EASE, scrollToTop } from './motion'
import { BTN_PRIMARY, BTN_SECONDARY, CONTAINER } from './ui'
import styles from './landing.module.css'

const LINKS = [
  { label: 'Features', href: '#features' },
  { label: 'How it works', href: '#how' },
  { label: 'About', href: '#about' },
]

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
          className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/15 text-white md:hidden focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
          {open ? <X size={20} /> : <Menu size={20} />}
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
