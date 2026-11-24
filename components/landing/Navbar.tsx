'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight } from 'lucide-react'
import { scrollToTop } from './motion'
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

  // Background states. The frosted blur switches on instantly; only the colour is
  // transitioned. Animating backdrop-filter re-computes the blur every frame, which
  // (with mounting the menu on each tap) is what made opening stutter on phones.
  const bg = open || scrolled
    ? 'border-white/8 bg-[#0A0A0A]/70 backdrop-blur-xl'
    : 'border-transparent bg-transparent'
  return (
    <>
    <header
      className={`${styles.enterDown} fixed inset-x-0 top-0 z-50 border-b transition-[background-color,border-color] duration-300 ${bg}`}
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
    </header>

      {/* Mobile menu: rendered once and kept in the page, so opening is just a class
          toggle (CSS transition) with no mounting work on the first frame.
          It is a sibling of the header, not a child: a blurred element nested inside
          another blurred element (the header) can't see the page behind it, so its
          blur silently did nothing. The blurred panel only fades (moving a blurred
          box re-blurs every frame); the links inside do the sliding. */}
      <div id="mobile-menu" inert={!open}
        className={`fixed inset-x-0 top-16 z-40 border-y border-white/8 bg-[#0A0A0A]/75 backdrop-blur-md transition-[opacity,visibility] duration-250 ease-out motion-reduce:transition-none md:hidden ${
          open ? 'visible opacity-100' : 'invisible opacity-0'}`}>
        <ul className={`${CONTAINER} flex flex-col py-3`}>
          {LINKS.map((l, i) => (
            <li key={l.href} style={{ transitionDelay: open ? `${60 + i * 50}ms` : '0ms' }}
              className={`transition-[opacity,transform] duration-400 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
                open ? 'translate-y-0 opacity-100' : '-translate-y-2 opacity-0'}`}>
              <a href={l.href} onClick={() => setOpen(false)}
                className="flex min-h-12 items-center text-base text-white/80 hover:text-white">
                {l.label}
              </a>
            </li>
          ))}
          <li style={{ transitionDelay: open ? `${60 + LINKS.length * 50}ms` : '0ms' }}
            className={`mt-3 grid grid-cols-2 gap-2.5 pb-2 transition-[opacity,transform] duration-400 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
              open ? 'translate-y-0 opacity-100' : '-translate-y-2 opacity-0'}`}>
            <Link href="/login" onClick={() => setOpen(false)} className={`${BTN_SECONDARY} min-h-12`}>Sign in</Link>
            <Link href="/register" onClick={() => setOpen(false)} className={`${BTN_PRIMARY} min-h-12`}>
              Get started <ArrowRight size={15} />
            </Link>
          </li>
        </ul>
      </div>
    </>
  )
}
