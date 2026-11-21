'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Zap } from 'lucide-react'
import { CONTAINER } from './ui'
import { scrollToTop } from './motion'

const linkCls = 'inline-flex min-h-9 items-center text-sm text-white/55 transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white rounded'

export default function Footer() {
  return (
    <footer className="border-t border-white/6 bg-[#0A0A0A]">
      <div className={`${CONTAINER} grid grid-cols-2 gap-x-6 gap-y-8 py-12 lg:grid-cols-[1.4fr_0.8fr_0.8fr_1.4fr]`}>
        <div className="col-span-2 lg:col-span-1">
          <Link href="/" aria-label="ExpenseFlow home" onClick={scrollToTop} className="inline-flex items-center gap-2.5 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">
            <Image src="/logo2.png" alt="" width={30} height={30} />
            <span className="text-lg font-semibold tracking-tight text-white">ExpenseFlow</span>
          </Link>
          <p className="mt-2 text-sm text-white/55">Track. Plan. Achieve.</p>
        </div>

        <nav aria-label="Product">
          <p className="text-sm font-semibold text-white">Product</p>
          <ul className="mt-2">
            <li><a href="#features" className={linkCls}>Features</a></li>
            <li><a href="#how" className={linkCls}>How it works</a></li>
            <li><a href="#about" className={linkCls}>About</a></li>
          </ul>
        </nav>

        <nav aria-label="Account">
          <p className="text-sm font-semibold text-white">Account</p>
          <ul className="mt-2">
            <li><Link href="/login" className={linkCls}>Sign in</Link></li>
            <li><Link href="/register" className={linkCls}>Get started</Link></li>
          </ul>
        </nav>

        <div className="col-span-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between lg:col-span-1 lg:flex-col lg:items-end lg:justify-start">
          <p className="text-sm text-white/55">© 2026 ExpenseFlow by Wilian</p>
          <span className="inline-flex min-h-9 items-center gap-1.5 self-start rounded-full border border-white/12 px-3.5 text-xs text-white/70 lg:self-end">
            <Zap size={13} className="fill-white text-white" aria-hidden /> Built with Next.js + Supabase
          </span>
        </div>
      </div>
    </footer>
  )
}
