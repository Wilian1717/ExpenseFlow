'use client'

import React, { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()
  const [scrolled, setScrolled] = useState(false)
  const [activeFeature, setActiveFeature] = useState(0)
  const [activeTab, setActiveTab] = useState(0)
  const [visible, setVisible] = useState<Record<string, boolean>>({})
  const [menuOpen, setMenuOpen] = useState(false)
  const observerRefs = useRef<(HTMLElement | null)[]>([])
  const statsRef = useRef<HTMLDivElement | null>(null)
  const [statsIn, setStatsIn] = useState(false)
  const featGridRef = useRef<HTMLDivElement | null>(null)
  const [featIn, setFeatIn] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Live switcher auto-advance — resettable so manual clicks restart the countdown
  useEffect(() => {
    const t = setTimeout(() => setActiveFeature(prev => (prev + 1) % 6), 3400)
    return () => clearTimeout(t)
  }, [activeFeature])

  // App-nav tab strip auto-cycles its highlighted tab
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTab(prev => (prev + 1) % 7)
    }, 1900)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setVisible(prev => ({ ...prev, [entry.target.id]: true }))
          }
        })
      },
      { threshold: 0.1 }
    )
    document.querySelectorAll('[data-observe]').forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  // Trigger the stats panel animations once it scrolls into view
  useEffect(() => {
    const el = statsRef.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setStatsIn(true)
          obs.disconnect()
        }
      },
      { threshold: 0.3 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  // Cascade the feature cards in once the grid scrolls into view
  useEffect(() => {
    const el = featGridRef.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setFeatIn(true)
          obs.disconnect()
        }
      },
      { threshold: 0.15 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  // Count-up numbers + progress-driven visuals for the stats panel
  useEffect(() => {
    if (!statsIn) return
    const el = statsRef.current
    if (!el) return
    const nums = Array.from(el.querySelectorAll<HTMLElement>('[data-count]'))
    const finalText = (n: HTMLElement) =>
      (n.dataset.prefix || '') + n.dataset.count + (n.dataset.suffix || '')

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      el.style.setProperty('--p', '1')
      nums.forEach(n => { n.textContent = finalText(n) })
      return
    }

    let raf = 0
    const duration = 1700
    const start = performance.now()
    const easeOut = (t: number) => 1 - Math.pow(1 - t, 3)
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1)
      const e = easeOut(p)
      el.style.setProperty('--p', String(e))
      nums.forEach(n => {
        const target = Number(n.dataset.count)
        n.textContent = (n.dataset.prefix || '') + Math.round(e * target) + (n.dataset.suffix || '')
      })
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [statsIn])

  // Close menu when clicking outside
  useEffect(() => {
    if (!menuOpen) return
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest('.mobile-menu') && !target.closest('.hamburger-btn')) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [menuOpen])

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [menuOpen])

  const handleStatsMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = statsRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    el.style.setProperty('--mx', `${e.clientX - r.left}px`)
    el.style.setProperty('--my', `${e.clientY - r.top}px`)
  }

  // Generic cursor-spotlight: writes pointer position onto the hovered element
  const handleSpotlight = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = e.currentTarget
    const r = el.getBoundingClientRect()
    el.style.setProperty('--mx', `${e.clientX - r.left}px`)
    el.style.setProperty('--my', `${e.clientY - r.top}px`)
  }

  const statItems = [
    { n: '100%', count: 100, suffix: '%', label: 'Free to use', kind: 'ring' as const },
    { n: '<1s', label: 'Load time', kind: 'bar' as const },
    { n: '10+', count: 10, suffix: '+', label: 'Categories', kind: 'dots' as const },
    { n: '∞', label: 'Transactions', kind: 'infinity' as const },
  ]

  const features = [
    { label: 'Track every cent', sub: 'Expenses & income', val: 'Rp 7.2jt', desc: 'spent this month' },
    { label: 'Set smart budgets', sub: 'Category limits', val: 'Rp 3.1jt', desc: 'under budget limit' },
    { label: 'Build your savings', sub: 'Goal tracking', val: '68%', desc: 'of goal reached' },
    { label: 'Know your bills', sub: 'Recurring payments', val: '5 bills', desc: 'due this month' },
    { label: 'Split with friends', sub: 'Shared bills', val: 'Rp 240k', desc: 'still owed to you' },
    { label: 'Settle your debts', sub: 'Money in & out', val: '2 open', desc: 'debts to settle' },
  ]

  const featureCards = [
    { icon: '↕', title: 'Expense Tracking', desc: 'Log every transaction instantly across 10+ categories with search, sort, and filters.', tag: 'Core' },
    { icon: '⊕', title: 'Income Tracking', desc: 'Record salary, freelance, business, and investment income to see your true net flow.', tag: 'New' },
    { icon: '◎', title: 'Budget Alerts', desc: 'Set monthly limits per category with live warnings before you overspend.', tag: 'Smart' },
    { icon: '◈', title: 'Savings Goals', desc: 'Name a goal, set a target, and watch the progress bar fill as you save.', tag: 'Goals' },
    { icon: '⟳', title: 'Recurring Bills', desc: 'Track daily, weekly, or monthly bills. Paid status persists across sessions.', tag: 'Bills' },
    { icon: '⊟', title: 'Split Bills', desc: 'Split any bill with friends, track each person\'s share, and see who has paid.', tag: 'New' },
    { icon: '⊗', title: 'Debt Tracking', desc: 'Track money you owe or are owed, log payments, and never miss a due date.', tag: 'New' },
    { icon: '◰', title: 'Smart Insights', desc: 'Automatic analysis of your trends, top categories, and projected spend.', tag: 'Analytics' },
    { icon: '⤓', title: 'CSV Export', desc: 'Download your full financial history any time as a clean spreadsheet.', tag: 'Export' },
  ]

  const appTabs = [
    { name: 'Expenses', icon: '↕' },
    { name: 'Income', icon: '⊕' },
    { name: 'Bills', icon: '⟳' },
    { name: 'Budgets', icon: '◎', badge: 3 },
    { name: 'Split Bills', icon: '⊟' },
    { name: 'Debts', icon: '⊗', badge: 2 },
    { name: 'Goals', icon: '◈', badge: 1 },
  ]

  const testimonials = [
    { q: 'Finally a finance app that doesn\'t try to do too much. Just clean tracking.', name: 'A.P.', role: 'Freelancer' },
    { q: 'The budget alerts saved me from overspending on food three months in a row.', name: 'R.L.', role: 'Student' },
    { q: 'Bills stay paid after I log back in. That was always the issue with other apps.', name: 'W.N.', role: 'Professional' },
    { q: 'Savings goals feature is genuinely motivating. Watching the bar fill is satisfying.', name: 'D.K.', role: 'Designer' },
    { q: 'Simple, fast, and free. Recommended it to everyone on my team.', name: 'M.S.', role: 'Team Lead' },
    { q: 'Finally a finance app that doesn\'t try to do too much. Just clean tracking.', name: 'A.P.', role: 'Freelancer' },
    { q: 'The budget alerts saved me from overspending on food three months in a row.', name: 'R.L.', role: 'Student' },
    { q: 'Bills stay paid after I log back in. That was always the issue with other apps.', name: 'W.N.', role: 'Professional' },
    { q: 'Savings goals feature is genuinely motivating. Watching the bar fill is satisfying.', name: 'D.K.', role: 'Designer' },
    { q: 'Simple, fast, and free. Recommended it to everyone on my team.', name: 'M.S.', role: 'Team Lead' },
  ]

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --white: #ffffff;
          --off-white: #f8f8f6;
          --cream: #f2f1ed;
          --gray-1: #f0efeb;
          --gray-2: #e4e3de;
          --gray-3: #c8c7c0;
          --gray-4: #8a8980;
          --gray-5: #5a5950;
          --black: #111110;
          --black-soft: #1e1d1b;
          --accent: #111110;
        }

        html { scroll-behavior: smooth; }
        body {
          background: var(--white);
          color: var(--black);
          font-family: 'Sora', sans-serif;
          font-weight: 300;
          overflow-x: hidden;
        }

        /* ── Nav ── */
        .nav {
          position: fixed; top: 0; left: 0; right: 0; z-index: 100;
          display: flex; align-items: center; justify-content: space-between;
          padding: 20px 48px;
          transition: all 0.4s ease;
        }
        .nav.scrolled {
          padding: 14px 48px;
          background: rgba(255,255,255,0.95);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid var(--gray-2);
          box-shadow: 0 1px 24px rgba(0,0,0,0.06);
        }
        .nav-logo {
          display: flex; align-items: center; gap: 10px;
          text-decoration: none;
        }
        .nav-logo-img {
          width: 32px; height: 32px;
          border-radius: 8px;
          object-fit: cover;
        }
        .nav-logo-text {
          font-size: 16px; font-weight: 700;
          color: var(--black);
          letter-spacing: -0.02em;
        }
        .nav-links {
          display: flex; align-items: center; gap: 36px; list-style: none;
        }
        .nav-links a {
          font-size: 13px; font-weight: 400;
          color: var(--gray-4);
          text-decoration: none;
          transition: color 0.2s;
        }
        .nav-links a:hover { color: var(--black); }
        .nav-cta { display: flex; gap: 8px; }

        /* ── Hamburger button ── */
        .hamburger-btn {
          display: none;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          width: 38px; height: 38px;
          border-radius: 10px;
          border: 1.5px solid var(--gray-2);
          background: var(--white);
          cursor: pointer;
          gap: 5px;
          transition: all 0.2s;
          flex-shrink: 0;
        }
        .hamburger-btn:hover { border-color: var(--black); background: var(--gray-1); }
        .hamburger-btn.open { background: var(--black); border-color: var(--black); }
        .ham-line {
          width: 16px; height: 1.5px;
          background: var(--black);
          border-radius: 2px;
          transition: all 0.25s ease;
          transform-origin: center;
        }
        .hamburger-btn.open .ham-line { background: var(--white); }
        .hamburger-btn.open .ham-line:nth-child(1) { transform: translateY(6.5px) rotate(45deg); }
        .hamburger-btn.open .ham-line:nth-child(2) { opacity: 0; transform: scaleX(0); }
        .hamburger-btn.open .ham-line:nth-child(3) { transform: translateY(-6.5px) rotate(-45deg); }

        /* ── Mobile drawer overlay ── */
        .mobile-overlay {
          display: none;
          position: fixed; inset: 0;
          background: rgba(0,0,0,0.35);
          z-index: 199;
          animation: fadeIn 0.2s ease;
        }
        .mobile-overlay.open { display: block; }

        /* ── Mobile menu drawer ── */
        .mobile-menu {
          display: none;
          position: fixed;
          top: 0; right: 0;
          width: min(320px, 100vw);
          height: 100vh;
          background: var(--white);
          z-index: 200;
          border-left: 1.5px solid var(--gray-2);
          padding: 24px;
          flex-direction: column;
          transform: translateX(100%);
          transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: -8px 0 40px rgba(0,0,0,0.15);
          overflow-y: auto;
        }
        .mobile-menu.open {
          transform: translateX(0);
        }

        .mobile-menu-header {
          display: flex; justify-content: space-between; align-items: center;
          margin-bottom: 32px;
          padding-bottom: 20px;
          border-bottom: 1px solid var(--gray-2);
        }
        .mobile-menu-logo {
          display: flex; align-items: center; gap: 8px;
        }
        .mobile-menu-logo img {
          width: 28px; height: 28px; border-radius: 7px; object-fit: cover;
        }
        .mobile-menu-logo span {
          font-size: 15px; font-weight: 700; color: var(--black); letter-spacing: -0.02em;
        }
        .mobile-menu-close {
          width: 32px; height: 32px;
          border-radius: 8px;
          border: 1.5px solid var(--gray-2);
          background: var(--gray-1);
          display: flex; align-items: center; justify-content: center;
          cursor: pointer;
          font-size: 14px; color: var(--gray-4);
          transition: all 0.15s;
        }
        .mobile-menu-close:hover { border-color: var(--black); color: var(--black); background: var(--gray-2); }

        .mobile-nav-links {
          list-style: none;
          display: flex; flex-direction: column; gap: 2px;
          margin-bottom: 28px;
        }
        .mobile-nav-links a {
          display: flex; align-items: center;
          padding: 13px 14px;
          font-size: 15px; font-weight: 400;
          color: var(--gray-5);
          text-decoration: none;
          border-radius: 10px;
          transition: all 0.15s;
        }
        .mobile-nav-links a:hover {
          background: var(--gray-1);
          color: var(--black);
        }

        .mobile-menu-divider {
          height: 1px; background: var(--gray-2);
          margin-bottom: 24px;
        }

        .mobile-cta {
          display: flex; flex-direction: column; gap: 10px;
          margin-top: auto;
        }
        .mobile-cta-label {
          font-family: 'DM Mono', monospace;
          font-size: 9px; font-weight: 500;
          letter-spacing: 0.2em; text-transform: uppercase;
          color: var(--gray-3);
          margin-bottom: 4px;
        }
        .btn-mobile-outline {
          font-family: 'Sora', sans-serif;
          font-size: 14px; font-weight: 600;
          padding: 13px 20px;
          border-radius: 12px;
          border: 1.5px solid var(--gray-2);
          background: var(--white);
          color: var(--black);
          cursor: pointer;
          transition: all 0.2s;
          text-align: center;
          width: 100%;
        }
        .btn-mobile-outline:hover { border-color: var(--black); background: var(--gray-1); }
        .btn-mobile-black {
          font-family: 'Sora', sans-serif;
          font-size: 14px; font-weight: 600;
          padding: 13px 20px;
          border-radius: 12px;
          border: none;
          background: var(--black);
          color: var(--white);
          cursor: pointer;
          transition: all 0.2s;
          text-align: center;
          width: 100%;
        }
        .btn-mobile-black:hover { background: var(--black-soft); }

        .mobile-menu-footer {
          margin-top: 32px;
          padding-top: 20px;
          border-top: 1px solid var(--gray-2);
        }
        .mobile-menu-badge {
          font-family: 'DM Mono', monospace;
          font-size: 10px; color: var(--gray-4);
          letter-spacing: 0.08em;
          display: flex; align-items: center; gap: 6px;
        }
        .mobile-menu-badge-dot {
          width: 5px; height: 5px; border-radius: 50%; background: #22c55e;
          animation: pulse-dot 2s ease-in-out infinite;
        }

        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

        /* ── Buttons ── */
        .btn {
          font-family: 'Sora', sans-serif;
          font-size: 12px; font-weight: 600;
          letter-spacing: 0.01em;
          text-decoration: none;
          padding: 10px 22px;
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.2s;
          border: none;
          display: inline-flex; align-items: center; gap: 6px;
        }
        .btn-black {
          background: var(--black);
          color: var(--white);
        }
        .btn-black:hover { background: var(--black-soft); transform: translateY(-1px); box-shadow: 0 4px 16px rgba(0,0,0,0.2); }
        .btn-outline {
          background: transparent;
          color: var(--black);
          border: 1.5px solid var(--gray-2);
        }
        .btn-outline:hover { border-color: var(--black); background: var(--gray-1); }
        .btn-lg { font-size: 14px; padding: 14px 32px; border-radius: 12px; }
        .btn-play-icon {
          width: 20px; height: 20px; border-radius: 50%;
          background: var(--black); color: var(--white);
          display: inline-flex; align-items: center; justify-content: center;
          font-size: 8px;
        }
        .btn-xl { font-size: 15px; padding: 16px 40px; border-radius: 14px; }
        .btn-black.btn-xl { position: relative; overflow: hidden; }
        .btn-black.btn-xl::after {
          content: '';
          position: absolute;
          top: 0; left: -60%;
          width: 40%; height: 100%;
          background: linear-gradient(120deg, transparent, rgba(255,255,255,0.35), transparent);
          transform: skewX(-20deg);
          transition: left 0.6s ease;
        }
        .btn-black.btn-xl:hover::after { left: 130%; }

        /* ── Hero ── */
        .hero {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: left;
          padding: 120px 48px 80px;
          position: relative;
          overflow: hidden;
          background: var(--white);
        }
        .hero-inner {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(0, 1.35fr);
          align-items: center;
          gap: 56px;
          width: 100%;
          max-width: 1280px;
        }
        .hero-content {
          position: relative; z-index: 1;
        }
        .hero-bg {
          position: absolute; inset: 0; pointer-events: none;
          background:
            radial-gradient(ellipse 80% 60% at 50% -10%, rgba(0,0,0,0.04) 0%, transparent 70%),
            linear-gradient(180deg, var(--off-white) 0%, var(--white) 30%);
        }
        .hero-dots {
          position: absolute; inset: 0; pointer-events: none;
          background-image: radial-gradient(circle, rgba(0,0,0,0.06) 1px, transparent 1px);
          background-size: 32px 32px;
          mask-image: radial-gradient(ellipse 70% 50% at 50% 0%, black 0%, transparent 80%);
        }
        .hero-wave {
          position: absolute; left: 0; right: 0; bottom: -2px;
          width: 100%; height: 180px;
          z-index: 0; pointer-events: none;
        }
        .hero-badge {
          display: inline-flex; align-items: center; gap: 6px;
          background: var(--gray-1);
          border: 1px solid var(--gray-2);
          border-radius: 100px;
          padding: 6px 14px;
          font-size: 11px; font-weight: 500;
          color: var(--gray-5);
          letter-spacing: 0.04em;
          text-transform: uppercase;
          margin-bottom: 28px;
          position: relative; z-index: 1;
        }
        .hero-badge-dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          background: #22c55e;
          animation: pulse-dot 2s ease-in-out infinite;
        }
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.4); }
        }
        .hero-title {
          font-size: clamp(40px, 5.4vw, 72px);
          font-weight: 800;
          line-height: 1.05;
          letter-spacing: -0.04em;
          color: var(--black);
          margin-bottom: 24px;
          position: relative; z-index: 1;
          max-width: 520px;
        }
        .hero-title .accent-line {
          position: relative; display: inline-block;
        }
        .hero-title .accent-line::after {
          content: '';
          position: absolute;
          bottom: 4px; left: 0; right: 0;
          height: 6px;
          background: rgba(0,0,0,0.08);
          border-radius: 3px;
          z-index: -1;
        }
        .hero-sub {
          font-size: 17px; font-weight: 300;
          color: var(--gray-4);
          line-height: 1.7;
          max-width: 460px;
          margin: 0 0 40px;
          position: relative; z-index: 1;
        }
        .hero-actions {
          display: flex; gap: 12px; align-items: center; justify-content: flex-start;
          flex-wrap: wrap;
          position: relative; z-index: 1;
          margin-bottom: 64px;
        }
        .hero-features-strip {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          align-items: center;
          position: relative; z-index: 1;
        }
        .hero-feature-item {
          display: flex; align-items: center; gap: 9px;
          padding: 0 18px;
          min-width: 0;
          position: relative;
        }
        .hero-feature-item:first-child { padding-left: 0; }
        .hero-feature-item:last-child { padding-right: 0; }
        .hero-feature-item + .hero-feature-item::before {
          content: '';
          position: absolute; left: 0; top: 50%;
          transform: translateY(-50%);
          width: 1px; height: 30px;
          background: var(--gray-2);
        }
        .hero-feature-icon {
          width: 34px; height: 34px;
          border-radius: 10px;
          background: var(--gray-1);
          border: 1px solid var(--gray-2);
          display: flex; align-items: center; justify-content: center;
          font-size: 14px; color: var(--black);
          flex-shrink: 0;
        }
        .hero-feature-text { text-align: left; min-width: 0; }
        .hero-feature-title { font-size: 13px; font-weight: 600; color: var(--black); }
        .hero-feature-sub { font-size: 11px; color: var(--gray-4); line-height: 1.35; }

        /* ── Mock Dashboard Preview ── */
        .hero-preview {
          position: relative; z-index: 1;
          width: 100%;
          padding-bottom: 56px;
        }
        .hero-preview-glow {
          position: absolute;
          inset: -10% -6% 6% -6%;
          background: radial-gradient(ellipse 60% 55% at 55% 35%, rgba(0,0,0,0.10) 0%, transparent 72%);
          filter: blur(30px);
          z-index: 0;
          pointer-events: none;
        }
        @keyframes gentle-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        @media (prefers-reduced-motion: no-preference) {
          .preview-frame { animation: gentle-float 6s ease-in-out infinite; }
          .preview-goal-float { animation: gentle-float 6s ease-in-out infinite; }
        }
        .preview-frame {
          background: var(--white);
          border: 1.5px solid var(--gray-2);
          border-radius: 20px;
          overflow: hidden;
          box-shadow:
            0 0 0 1px rgba(0,0,0,0.04),
            0 20px 60px rgba(0,0,0,0.1),
            0 60px 120px rgba(0,0,0,0.06);
          position: relative;
          z-index: 1;
        }
        .preview-bar {
          background: var(--gray-1);
          border-bottom: 1px solid var(--gray-2);
          padding: 12px 16px;
          display: flex; align-items: center; gap: 8px;
        }
        .preview-dot { width: 10px; height: 10px; border-radius: 50%; }
        .preview-url {
          flex: 1;
          background: var(--white);
          border: 1px solid var(--gray-2);
          border-radius: 6px;
          padding: 4px 12px;
          font-family: 'DM Mono', monospace;
          font-size: 11px; color: var(--gray-4);
          text-align: center;
          margin: 0 8px;
        }
        .preview-body {
          display: flex;
          min-height: 460px;
        }

        /* Sidebar */
        .preview-sidebar {
          width: 130px; flex-shrink: 0;
          background: var(--black);
          padding: 16px 10px;
          display: flex; flex-direction: column; gap: 2px;
        }
        .preview-sidebar-logo {
          display: flex; align-items: center; gap: 7px;
          padding: 0 6px 14px;
          margin-bottom: 10px;
          border-bottom: 1px solid rgba(255,255,255,0.1);
        }
        .preview-sidebar-logo img { width: 20px; height: 20px; border-radius: 5px; object-fit: cover; }
        .preview-sidebar-logo span { font-size: 11px; font-weight: 700; color: var(--white); letter-spacing: -0.02em; }
        .preview-nav-item {
          display: flex; align-items: center; gap: 8px;
          padding: 7px 8px;
          border-radius: 8px;
          font-size: 10px; font-weight: 500;
          color: rgba(255,255,255,0.45);
        }
        .preview-nav-icon { font-size: 11px; width: 14px; text-align: center; flex-shrink: 0; }
        .preview-nav-item.active { background: rgba(255,255,255,0.12); color: var(--white); font-weight: 600; }

        /* Main content */
        .preview-main { flex: 1; min-width: 0; padding: 20px; background: var(--white); }
        .preview-topbar { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; }
        .preview-welcome-title { font-size: 14px; font-weight: 700; color: var(--black); margin-bottom: 3px; letter-spacing: -0.01em; }
        .preview-welcome-sub { font-size: 9px; color: var(--gray-4); }
        .preview-topbar-actions { display: flex; align-items: center; gap: 6px; }
        .preview-icon-pill {
          width: 22px; height: 22px; border-radius: 7px;
          background: var(--gray-1); border: 1px solid var(--gray-2);
          display: flex; align-items: center; justify-content: center;
          font-size: 10px; color: var(--gray-4);
        }
        .preview-avatar-pill {
          width: 22px; height: 22px; border-radius: 50%;
          background: var(--black); color: var(--white);
          display: flex; align-items: center; justify-content: center;
          font-size: 9px; font-weight: 700;
        }
        .preview-month-pill {
          font-size: 9px; font-weight: 600; color: var(--gray-5);
          background: var(--gray-1); border: 1px solid var(--gray-2);
          border-radius: 100px; padding: 4px 10px;
        }

        /* Stat cards */
        .preview-stat-cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-bottom: 14px; }
        .preview-stat-card { background: var(--gray-1); border: 1px solid var(--gray-2); border-radius: 10px; padding: 11px; }
        .preview-stat-card-label { font-size: 8px; color: var(--gray-4); text-transform: uppercase; letter-spacing: 0.06em; font-weight: 600; margin-bottom: 6px; }
        .preview-stat-card-val { font-size: 14px; font-weight: 700; color: var(--black); letter-spacing: -0.02em; margin-bottom: 4px; }
        .preview-stat-card-delta { font-size: 8px; font-weight: 600; }
        .preview-stat-card-delta.up { color: #16a34a; }
        .preview-stat-card-delta.down { color: #dc2626; }

        /* Chart panels */
        .preview-panels { display: grid; grid-template-columns: 1.4fr 1fr; gap: 8px; }
        .preview-panel { background: var(--off-white); border: 1px solid var(--gray-2); border-radius: 12px; padding: 14px; }
        .preview-panel-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
        .preview-panel-title { font-size: 10px; font-weight: 700; color: var(--black); }

        .preview-bars { display: flex; align-items: flex-end; gap: 6px; height: 74px; position: relative; padding-top: 20px; }
        .preview-bars-line { position: absolute; left: 0; top: 20px; width: 100%; height: 74px; pointer-events: none; }
        .preview-bar-col { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 5px; height: 100%; justify-content: flex-end; position: relative; }
        .preview-chart-bar { width: 100%; max-width: 14px; border-radius: 3px 3px 0 0; background: var(--gray-3); }
        .preview-chart-bar.current { background: var(--black); }
        .preview-bar-label { font-size: 7px; color: var(--gray-4); }
        .preview-bar-pill {
          position: absolute; top: -2px; left: 50%; transform: translate(-50%, -100%);
          background: var(--black); color: var(--white);
          font-size: 8px; font-weight: 700; padding: 3px 7px; border-radius: 100px; white-space: nowrap;
        }

        .preview-donut-wrap { display: flex; flex-direction: column; align-items: center; gap: 10px; }
        .preview-donut { width: 72px; height: 72px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .preview-donut-center { width: 42px; height: 42px; border-radius: 50%; background: var(--off-white); display: flex; flex-direction: column; align-items: center; justify-content: center; }
        .preview-donut-center-val { font-size: 9px; font-weight: 700; color: var(--black); }
        .preview-donut-center-lbl { font-size: 6px; color: var(--gray-4); }
        .preview-legend { display: flex; flex-direction: column; gap: 5px; width: 100%; }
        .preview-legend-item { display: flex; align-items: center; gap: 6px; font-size: 8px; color: var(--gray-5); }
        .preview-legend-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
        .preview-legend-name { flex: 1; }
        .preview-legend-pct { font-weight: 700; color: var(--black); }

        /* Floating goal card */
        .preview-goal-float {
          position: absolute; left: 20px; right: 20px; bottom: -34px;
          background: rgba(255,255,255,0.78);
          backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(228,227,222,0.8); border-radius: 14px;
          padding: 14px 16px;
          display: flex; align-items: center; gap: 12px;
          box-shadow: 0 16px 40px rgba(0,0,0,0.14);
          z-index: 2;
        }
        .preview-goal-icon {
          width: 34px; height: 34px; border-radius: 10px;
          background: var(--gray-1); border: 1px solid var(--gray-2);
          display: flex; align-items: center; justify-content: center;
          font-size: 14px; flex-shrink: 0;
        }
        .preview-goal-body { flex: 1; min-width: 0; }
        .preview-goal-label { font-size: 8px; color: var(--gray-4); text-transform: uppercase; letter-spacing: 0.06em; font-weight: 600; }
        .preview-goal-title { font-size: 12px; font-weight: 700; color: var(--black); margin: 2px 0 3px; }
        .preview-goal-sub { font-size: 8px; color: var(--gray-4); margin-bottom: 6px; }
        .preview-goal-bar-track { height: 5px; background: var(--gray-2); border-radius: 100px; overflow: hidden; }
        .preview-goal-bar-fill { height: 100%; background: var(--black); border-radius: 100px; }
        .preview-goal-pct { font-size: 18px; font-weight: 800; color: var(--black); letter-spacing: -0.02em; flex-shrink: 0; }

        /* ── Ticker ── */
        .ticker {
          background: var(--black);
          color: var(--white);
          overflow: hidden;
          padding: 13px 0;
          white-space: nowrap;
        }
        .ticker-inner {
          display: inline-flex;
          animation: ticker 28s linear infinite;
        }
        .ticker-item {
          display: inline-flex; align-items: center; gap: 24px;
          padding-right: 60px;
          font-size: 12px; font-weight: 500;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.7);
        }
        .ticker-item strong { color: var(--white); }
        .ticker-dot { width: 3px; height: 3px; border-radius: 50%; background: rgba(255,255,255,0.3); flex-shrink: 0; }
        @keyframes ticker { from { transform: translateX(0); } to { transform: translateX(-50%); } }

        /* ── Section ── */
        .section { padding: 100px 48px; }
        .section-tag {
          display: inline-flex; align-items: center; gap: 8px;
          font-family: 'DM Mono', monospace;
          font-size: 10px; font-weight: 500;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--gray-4);
          margin-bottom: 20px;
        }
        .section-tag::before {
          content: '';
          width: 24px; height: 1px;
          background: var(--gray-3);
        }
        .section-title {
          font-size: clamp(36px, 5vw, 64px);
          font-weight: 800;
          letter-spacing: -0.04em;
          line-height: 1.05;
          color: var(--black);
          margin-bottom: 16px;
        }
        .section-sub {
          font-size: 16px; font-weight: 300;
          color: var(--gray-4);
          line-height: 1.7;
          max-width: 480px;
        }

        /* ── Fade in on scroll ── */
        [data-observe] {
          opacity: 0;
          transform: translateY(24px);
          transition: opacity 0.7s ease, transform 0.7s ease;
        }
        [data-observe].visible {
          opacity: 1;
          transform: translateY(0);
        }

        /* ── Stats ── */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1.5px;
          background: var(--gray-2);
          border: 1.5px solid var(--gray-2);
          border-radius: 24px;
          overflow: hidden;
          margin-top: 60px;
          position: relative;
        }
        /* Cursor-following spotlight across the whole panel */
        .stats-grid::after {
          content: '';
          position: absolute; inset: 0;
          background: radial-gradient(260px circle at var(--mx, 50%) var(--my, 50%), rgba(0,0,0,0.05), transparent 62%);
          opacity: 0; transition: opacity 0.4s ease;
          pointer-events: none; z-index: 4;
        }
        .stats-grid:hover::after { opacity: 1; }

        .stat-box {
          background: var(--white);
          padding: 40px 32px 34px;
          position: relative;
          overflow: hidden;
          opacity: 0;
          transition: background 0.35s ease;
        }
        .stats-grid.in .stat-box {
          animation: statRise 0.7s cubic-bezier(0.2, 0.8, 0.2, 1) both;
          animation-delay: calc(var(--i) * 0.11s);
        }
        @keyframes statRise {
          from { opacity: 0; transform: translateY(22px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .stat-box:hover { background: var(--off-white); }
        /* top line-draw on hover */
        .stat-box::before {
          content: '';
          position: absolute; top: 0; left: 0; right: 0; height: 3px;
          background: var(--black);
          transform: scaleX(0); transform-origin: left;
          transition: transform 0.45s cubic-bezier(0.2, 0.8, 0.2, 1);
          z-index: 2;
        }
        .stat-box:hover::before { transform: scaleX(1); }

        .stat-index {
          font-family: 'DM Mono', monospace;
          font-size: 10px; font-weight: 500;
          letter-spacing: 0.16em;
          color: var(--gray-3);
          display: block;
          margin-bottom: 24px;
          transition: color 0.35s ease;
        }
        .stat-box:hover .stat-index { color: var(--gray-5); }
        .stat-num {
          font-size: clamp(38px, 4vw, 60px);
          font-weight: 800;
          letter-spacing: -0.04em;
          color: var(--black);
          line-height: 1;
          margin-bottom: 8px;
          font-variant-numeric: tabular-nums;
          transition: transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1);
        }
        .stat-box:hover .stat-num { transform: translateY(-3px); }
        .stat-lbl {
          font-size: 12px; font-weight: 400;
          color: var(--gray-4);
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }

        /* Per-stat mini-visuals */
        .stat-visual { margin-top: 22px; height: 40px; display: flex; align-items: center; }

        .stat-ring {
          width: 40px; height: 40px; border-radius: 50%;
          background: conic-gradient(var(--black) calc(var(--p, 0) * 1turn), var(--gray-2) 0);
          -webkit-mask: radial-gradient(farthest-side, #0000 calc(100% - 5px), #000 calc(100% - 4px));
          mask: radial-gradient(farthest-side, #0000 calc(100% - 5px), #000 calc(100% - 4px));
        }

        .stat-bar { width: 100%; max-width: 120px; height: 5px; background: var(--gray-2); border-radius: 100px; overflow: hidden; }
        .stat-bar-fill {
          height: 100%; width: calc(var(--p, 0) * 100%);
          background: linear-gradient(90deg, var(--gray-5), var(--black));
          border-radius: 100px;
        }

        .stat-dots { display: flex; gap: 5px; }
        .stat-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--gray-2); }
        .stats-grid.in .stat-dot {
          animation: dotPop 0.5s cubic-bezier(0.2, 0.8, 0.2, 1) both;
          animation-delay: calc(0.25s + var(--d) * 0.13s);
        }
        @keyframes dotPop {
          0% { background: var(--gray-2); transform: scale(1); }
          55% { transform: scale(1.45); }
          100% { background: var(--black); transform: scale(1); }
        }

        .stat-infinity { width: 48px; height: 24px; overflow: visible; }
        .stat-infinity path {
          fill: none; stroke: var(--black); stroke-width: 2.4; stroke-linecap: round;
          stroke-dasharray: 0.1 6;
        }
        .stats-grid.in .stat-infinity path { animation: infFlow 1.1s linear infinite; }
        @keyframes infFlow { to { stroke-dashoffset: -6.1; } }

        @media (prefers-reduced-motion: reduce) {
          .stat-box { opacity: 1; }
          .stats-grid.in .stat-box,
          .stats-grid.in .stat-dot,
          .stats-grid.in .stat-infinity path { animation: none; }
          .stat-dot { background: var(--black); }
        }

        /* ── App-nav tabs strip ── */
        .app-tabs {
          margin-top: 40px;
          display: flex; align-items: center; gap: 4px;
          padding: 7px;
          border: 1.5px solid var(--gray-2);
          border-radius: 100px;
          background: var(--white);
          overflow-x: auto;
          scrollbar-width: none;
        }
        .app-tabs::-webkit-scrollbar { display: none; }
        .app-tab {
          position: relative;
          flex: 1 0 auto;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          padding: 11px 20px;
          border-radius: 100px;
          font-size: 13px; font-weight: 600;
          color: var(--gray-4);
          white-space: nowrap;
          background: transparent;
          transition: background 0.5s cubic-bezier(0.4, 0, 0.2, 1), color 0.5s ease;
          opacity: 0;
        }
        .app-tabs.in .app-tab {
          animation: tabIn 0.5s ease both;
          animation-delay: calc(var(--t) * 0.06s);
        }
        @keyframes tabIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .app-tab.active { background: var(--black); color: var(--white); }
        .app-tab-icon { font-size: 13px; opacity: 0.55; transition: opacity 0.4s ease; }
        .app-tab.active .app-tab-icon { opacity: 1; }
        .app-tab-badge {
          position: relative;
          min-width: 17px; height: 17px; padding: 0 5px;
          border-radius: 100px;
          background: var(--black); color: var(--white);
          font-size: 9px; font-weight: 700; line-height: 1;
          display: inline-flex; align-items: center; justify-content: center;
          transition: background 0.4s ease, color 0.4s ease;
        }
        .app-tab.active .app-tab-badge { background: var(--white); color: var(--black); }
        .app-tab-badge::after {
          content: '';
          position: absolute; inset: 0; border-radius: 100px;
          border: 1.5px solid var(--black);
          animation: badgePulse 2.4s ease-out infinite;
        }
        .app-tab.active .app-tab-badge::after { border-color: var(--white); }
        @keyframes badgePulse {
          0% { transform: scale(1); opacity: 0.55; }
          70%, 100% { transform: scale(2.1); opacity: 0; }
        }

        /* ── Feature Cards ── */
        .features-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.5px;
          background: var(--gray-2);
          border: 1.5px solid var(--gray-2);
          border-radius: 20px;
          overflow: hidden;
          margin-top: 40px;
          position: relative;
        }
        .features-grid::after {
          content: '';
          position: absolute; inset: 0; z-index: 5;
          background: radial-gradient(320px circle at var(--mx, 50%) var(--my, 50%), rgba(0,0,0,0.045), transparent 60%);
          opacity: 0; transition: opacity 0.4s ease;
          pointer-events: none;
        }
        .features-grid:hover::after { opacity: 1; }
        .feature-card {
          background: var(--white);
          padding: 40px 36px 50px;
          position: relative;
          overflow: hidden;
          opacity: 0;
          transition: background 0.3s ease;
        }
        .features-grid.in .feature-card {
          animation: cardRise 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) both;
          animation-delay: calc(var(--i) * 0.07s);
        }
        @keyframes cardRise { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .feature-card:hover { background: var(--off-white); }
        .feature-card::before {
          content: '';
          position: absolute; top: 0; left: 0; right: 0; height: 3px;
          background: var(--black);
          transform: scaleX(0); transform-origin: left;
          transition: transform 0.45s cubic-bezier(0.2, 0.8, 0.2, 1);
          z-index: 3;
        }
        .feature-card:hover::before { transform: scaleX(1); }
        .feature-icon-box {
          width: 44px; height: 44px;
          background: var(--gray-1);
          border: 1.5px solid var(--gray-2);
          border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
          font-size: 20px;
          color: var(--black);
          margin-bottom: 24px;
          transition: background 0.35s ease, border-color 0.35s ease, color 0.35s ease,
                      transform 0.45s cubic-bezier(0.2, 0.8, 0.2, 1);
        }
        .feature-card:hover .feature-icon-box {
          background: var(--black); border-color: var(--black); color: var(--white);
          transform: translateY(-3px) rotate(-8deg);
        }
        .feature-tag-pill {
          position: absolute; top: 28px; right: 28px;
          background: var(--gray-1);
          border: 1px solid var(--gray-2);
          border-radius: 100px;
          padding: 3px 10px;
          font-size: 9px; font-weight: 600;
          color: var(--gray-4);
          letter-spacing: 0.08em;
          text-transform: uppercase;
          transition: all 0.3s ease;
        }
        .feature-card:hover .feature-tag-pill { border-color: var(--gray-3); color: var(--gray-5); }
        .feature-tag-pill.new {
          background: var(--black); color: var(--white); border-color: var(--black);
        }
        .feature-card:hover .feature-tag-pill.new { color: var(--white); border-color: var(--black); }
        .feature-title {
          font-size: 17px; font-weight: 700;
          color: var(--black);
          letter-spacing: -0.02em;
          margin-bottom: 10px;
        }
        .feature-desc {
          font-size: 13px; font-weight: 300;
          color: var(--gray-4);
          line-height: 1.7;
        }
        .feature-arrow {
          position: absolute; right: 32px; bottom: 30px;
          font-size: 16px; color: var(--gray-3);
          opacity: 0; transform: translateX(-6px);
          transition: opacity 0.35s ease, transform 0.35s ease, color 0.35s ease;
        }
        .feature-card:hover .feature-arrow { opacity: 1; transform: translateX(0); color: var(--black); }

        @media (prefers-reduced-motion: reduce) {
          .app-tab, .feature-card { opacity: 1; }
          .app-tabs.in .app-tab,
          .features-grid.in .feature-card,
          .app-tab-badge::after { animation: none; }
        }

        /* ── Live Switcher ── */
        .live-panel {
          display: grid; grid-template-columns: 1fr 320px;
          gap: 0;
          border: 1.5px solid var(--gray-2);
          border-radius: 20px;
          overflow: hidden;
          margin-top: 60px;
        }
        .live-list { padding: 40px; border-right: 1.5px solid var(--gray-2); }
        .live-list-label {
          font-family: 'DM Mono', monospace;
          font-size: 9px; font-weight: 500;
          letter-spacing: 0.2em; text-transform: uppercase;
          color: var(--gray-3);
          margin-bottom: 28px;
        }
        .live-item {
          position: relative;
          display: flex; align-items: center; gap: 14px;
          padding: 18px 12px 18px 0;
          border-bottom: 1px solid var(--gray-2);
          cursor: pointer;
        }
        .live-item:last-child { border-bottom: none; }
        .live-dot {
          position: relative;
          width: 7px; height: 7px; border-radius: 50%;
          background: var(--gray-2);
          flex-shrink: 0;
          transition: background 0.3s, transform 0.3s;
        }
        .live-item.active .live-dot { background: var(--black); transform: scale(1.25); }
        .live-item.active .live-dot::after {
          content: '';
          position: absolute; inset: -5px; border-radius: 50%;
          border: 1.5px solid var(--black); opacity: 0;
          animation: dotRing 2s ease-out infinite;
        }
        @keyframes dotRing {
          0% { transform: scale(0.6); opacity: 0.5; }
          100% { transform: scale(1.7); opacity: 0; }
        }
        .live-item-text { flex: 1; }
        .live-item-title {
          font-size: 15px; font-weight: 400;
          color: var(--gray-4);
          transition: color 0.3s, transform 0.3s;
        }
        .live-item:hover .live-item-title { color: var(--gray-5); }
        .live-item.active .live-item-title { color: var(--black); font-weight: 600; transform: translateX(2px); }
        .live-item-sub { font-size: 11px; color: var(--gray-3); margin-top: 1px; }
        /* auto-advance progress bar under the active item */
        .live-progress {
          position: absolute; left: 0; bottom: -1px; height: 2px; width: 0;
          background: var(--black); border-radius: 2px;
        }
        .live-item.active .live-progress { animation: liveProgress 3.4s linear forwards; }
        @keyframes liveProgress { from { width: 0; } to { width: 100%; } }

        .live-display {
          position: relative;
          background: var(--off-white);
          padding: 40px;
          display: flex; flex-direction: column; justify-content: center;
          overflow: hidden;
        }
        .live-display-tag {
          font-family: 'DM Mono', monospace;
          font-size: 9px; font-weight: 500;
          letter-spacing: 0.2em; text-transform: uppercase;
          color: var(--gray-4);
          margin-bottom: 16px;
          animation: liveFade 0.5s ease both;
        }
        .live-display-val {
          font-size: 52px; font-weight: 800;
          letter-spacing: -0.04em;
          color: var(--black);
          line-height: 1;
          margin-bottom: 8px;
          font-variant-numeric: tabular-nums;
          animation: liveRise 0.55s cubic-bezier(0.2, 0.8, 0.2, 1) both;
        }
        .live-display-sub { font-size: 13px; color: var(--gray-4); animation: liveFade 0.5s ease 0.06s both; }
        @keyframes liveRise { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes liveFade { from { opacity: 0; } to { opacity: 1; } }
        @media (prefers-reduced-motion: reduce) {
          .live-item.active .live-progress,
          .live-item.active .live-dot::after,
          .live-display-tag, .live-display-val, .live-display-sub { animation: none; }
          .live-display-val, .live-display-tag, .live-display-sub { opacity: 1; }
        }

        /* ── How it works ── */
        .steps-grid {
          display: grid; grid-template-columns: repeat(3, 1fr);
          gap: 0;
          border: 1.5px solid var(--gray-2);
          border-radius: 20px;
          overflow: hidden;
          margin-top: 60px;
        }
        .step-card {
          padding: 48px 40px;
          border-right: 1.5px solid var(--gray-2);
          position: relative;
        }
        .step-card:last-child { border-right: none; }
        .step-num {
          font-size: 72px; font-weight: 800;
          letter-spacing: -0.06em;
          color: var(--gray-2);
          line-height: 1;
          margin-bottom: 28px;
        }
        .step-title {
          font-size: 18px; font-weight: 700;
          color: var(--black);
          letter-spacing: -0.02em;
          margin-bottom: 12px;
        }
        .step-desc { font-size: 13px; font-weight: 300; color: var(--gray-4); line-height: 1.8; }
        .step-arrow {
          position: absolute; right: -16px; top: 48px;
          width: 32px; height: 32px;
          background: var(--white);
          border: 1.5px solid var(--gray-2);
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 13px; color: var(--gray-4);
          z-index: 2;
        }

        /* ── Testimonials ── */
        .marquee-track {
          display: flex; gap: 16px;
          animation: marquee 30s linear infinite;
          width: max-content;
        }
        .marquee-card {
          background: var(--off-white);
          border: 1.5px solid var(--gray-2);
          border-radius: 16px;
          padding: 28px 30px;
          width: 300px; flex-shrink: 0;
        }
        .marquee-quote {
          font-size: 13px; font-weight: 300;
          color: var(--gray-5);
          line-height: 1.8;
          margin-bottom: 20px;
        }
        .marquee-author { display: flex; align-items: center; gap: 10px; }
        .marquee-avatar {
          width: 30px; height: 30px;
          border-radius: 50%;
          background: var(--gray-2);
          display: flex; align-items: center; justify-content: center;
          font-size: 12px; font-weight: 700;
          color: var(--gray-5);
        }
        .marquee-name { font-size: 12px; font-weight: 600; color: var(--black); }
        .marquee-role { font-size: 11px; color: var(--gray-4); }
        @keyframes marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }

        /* ── CTA ── */
        .cta-section {
          margin: 0 48px 100px;
          background: var(--black);
          border-radius: 24px;
          padding: 80px;
          text-align: center;
          position: relative;
          overflow: hidden;
        }
        .cta-bg-grid {
          position: absolute; inset: 0; pointer-events: none;
          background-image:
            linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px);
          background-size: 48px 48px;
        }
        .cta-title {
          font-size: clamp(40px, 6vw, 80px);
          font-weight: 800;
          letter-spacing: -0.04em;
          line-height: 1.0;
          color: var(--white);
          margin-bottom: 20px;
          position: relative; z-index: 1;
        }
        .cta-sub {
          font-size: 16px; font-weight: 300;
          color: rgba(255,255,255,0.5);
          margin-bottom: 40px;
          position: relative; z-index: 1;
        }
        .cta-actions {
          display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;
          position: relative; z-index: 1;
        }
        .btn-white {
          background: var(--white);
          color: var(--black);
          font-family: 'Sora', sans-serif;
          font-size: 14px; font-weight: 600;
          padding: 14px 32px;
          border-radius: 12px;
          border: none; cursor: pointer;
          transition: all 0.2s;
          display: inline-flex; align-items: center; gap: 6px;
          text-decoration: none;
        }
        .btn-white:hover { background: var(--off-white); transform: translateY(-1px); box-shadow: 0 8px 24px rgba(0,0,0,0.3); }
        .btn-ghost {
          background: rgba(255,255,255,0.08);
          color: rgba(255,255,255,0.7);
          font-family: 'Sora', sans-serif;
          font-size: 14px; font-weight: 500;
          padding: 14px 32px;
          border-radius: 12px;
          border: 1.5px solid rgba(255,255,255,0.15);
          cursor: pointer;
          transition: all 0.2s;
          display: inline-flex; align-items: center; gap: 6px;
          text-decoration: none;
        }
        .btn-ghost:hover { background: rgba(255,255,255,0.12); border-color: rgba(255,255,255,0.3); color: var(--white); }
        .cta-note {
          font-family: 'DM Mono', monospace;
          font-size: 10px; color: rgba(255,255,255,0.25);
          letter-spacing: 0.1em;
          margin-top: 20px;
          position: relative; z-index: 1;
        }

        /* ── Footer ── */
        footer {
          padding: 60px 48px 40px;
          border-top: 1.5px solid var(--gray-2);
        }
        .footer-top {
          display: flex; justify-content: space-between; align-items: flex-start;
          margin-bottom: 60px;
        }
        .footer-brand { max-width: 240px; }
        .footer-logo {
          display: flex; align-items: center; gap: 10px;
          margin-bottom: 12px;
        }
        .footer-logo-img { width: 28px; height: 28px; border-radius: 7px; object-fit: cover; }
        .footer-logo-name { font-size: 15px; font-weight: 700; color: var(--black); letter-spacing: -0.02em; }
        .footer-tagline { font-size: 12px; color: var(--gray-4); line-height: 1.6; }
        .footer-links { display: flex; gap: 64px; }
        .footer-col-title { font-size: 11px; font-weight: 600; color: var(--black); text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 16px; }
        .footer-col-list { list-style: none; display: flex; flex-direction: column; gap: 10px; }
        .footer-col-list a { font-size: 13px; color: var(--gray-4); text-decoration: none; transition: color 0.2s; }
        .footer-col-list a:hover { color: var(--black); }
        .footer-bottom {
          display: flex; justify-content: space-between; align-items: center;
          padding-top: 24px;
          border-top: 1px solid var(--gray-2);
        }
        .footer-copy { font-size: 12px; color: var(--gray-4); }
        .footer-badge {
          font-family: 'DM Mono', monospace;
          font-size: 10px; color: var(--gray-4);
          letter-spacing: 0.08em;
          background: var(--gray-1);
          border: 1px solid var(--gray-2);
          padding: 5px 12px; border-radius: 100px;
        }

        /* ── Responsive ── */
        @media (max-width: 900px) {
          .nav { padding: 16px 20px; }
          .nav.scrolled { padding: 12px 20px; }
          /* Hide desktop links and cta, show hamburger */
          .nav-links { display: none; }
          .nav-cta { display: none; }
          .hamburger-btn { display: flex; }
          /* Show mobile menu */
          .mobile-menu { display: flex; }

          .hero {
            text-align: center;
            padding: 100px 20px 60px;
          }
          .hero-inner {
            display: flex; flex-direction: column; align-items: center;
          }
          .hero-title { max-width: 100%; }
          .hero-sub { margin: 0 auto 40px; }
          .hero-actions, .hero-features-strip { justify-content: center; }
          .hero-preview { margin: 56px auto 0; max-width: 100%; }
          .section { padding: 72px 20px; }
          .stats-grid { grid-template-columns: 1fr 1fr; }
          .stat-box { padding: 32px 24px 28px; }
          .stat-index { margin-bottom: 18px; }
          .features-grid { grid-template-columns: 1fr; }
          .live-panel { grid-template-columns: 1fr; }
          .live-display { border-top: 1.5px solid var(--gray-2); }
          .steps-grid { grid-template-columns: 1fr; }
          .step-card { border-right: none; border-bottom: 1.5px solid var(--gray-2); }
          .step-card:last-child { border-bottom: none; }
          .step-arrow { display: none; }
          .hero-features-strip {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 10px;
            width: 100%; max-width: 360px; margin: 0 auto;
          }
          .hero-feature-item {
            flex-direction: column;
            align-items: center;
            text-align: center;
            gap: 8px;
            width: auto; padding: 0;
          }
          .hero-feature-item + .hero-feature-item::before { display: none; }
          .hero-feature-text { text-align: center; }
          .hero-feature-sub { line-height: 1.3; }

          .preview-sidebar { width: 52px; padding: 14px 6px; }
          .preview-sidebar-logo span, .preview-nav-text { display: none; }
          .preview-sidebar-logo { justify-content: center; padding: 0 0 12px; }
          .preview-nav-item { justify-content: center; }
          .preview-stat-cards { grid-template-columns: 1fr 1fr; }
          .preview-panels { grid-template-columns: 1fr; }
          .preview-goal-float { left: 12px; right: 12px; bottom: -30px; padding: 12px; }
          .cta-section { margin: 0 20px 80px; padding: 60px 32px; }
          .footer-top { flex-direction: column; gap: 40px; }
          .footer-links { gap: 40px; }
          footer { padding: 48px 20px 32px; }
        }

        /* Compact the dashboard mock on phones so it doesn't feel oversized */
        @media (max-width: 600px) {
          .preview-bar { padding: 9px 12px; }
          .preview-dot { width: 8px; height: 8px; }
          .preview-url { font-size: 9px; padding: 3px 8px; }
          .preview-body { min-height: 0; }

          .preview-sidebar { width: 46px; padding: 12px 5px; }
          .preview-nav-item { padding: 6px; }
          .preview-nav-icon { font-size: 10px; }

          .preview-main { padding: 13px; }
          .preview-topbar { margin-bottom: 12px; }
          .preview-welcome-title { font-size: 12px; }
          .preview-welcome-sub { font-size: 8px; }
          .preview-month-pill { font-size: 8px; padding: 3px 8px; }
          .preview-icon-pill, .preview-avatar-pill { width: 19px; height: 19px; }
          .preview-topbar-actions { gap: 5px; }

          .preview-stat-cards { gap: 6px; margin-bottom: 10px; }
          .preview-stat-card { padding: 9px; }
          .preview-stat-card-val { font-size: 12px; }
          .preview-stat-card-delta { font-size: 7px; }

          .preview-panels { gap: 6px; }
          .preview-panel { padding: 11px; }
          .preview-bars { height: 64px; }
          .preview-donut { width: 62px; height: 62px; }
          .preview-donut-center { width: 36px; height: 36px; }

          .preview-goal-float { padding: 10px 12px; gap: 10px; bottom: -26px; }
          .preview-goal-icon { width: 30px; height: 30px; font-size: 12px; }
          .preview-goal-title { font-size: 11px; }
          .preview-goal-pct { font-size: 15px; }
          .hero-preview { padding-bottom: 44px; }
        }
      `}</style>

      {/* ── Mobile overlay ── */}
      <div className={`mobile-overlay ${menuOpen ? 'open' : ''}`} onClick={() => setMenuOpen(false)} />

      {/* ── Mobile drawer ── */}
      <div className={`mobile-menu ${menuOpen ? 'open' : ''}`}>
        <div className="mobile-menu-header">
          <div className="mobile-menu-logo">
            <img src="/logo.png" alt="ExpenseFlow" onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
            <span>ExpenseFlow</span>
          </div>
          <button className="mobile-menu-close" onClick={() => setMenuOpen(false)}>✕</button>
        </div>

        <ul className="mobile-nav-links">
          <li><a href="#about" onClick={() => setMenuOpen(false)}>About</a></li>
          <li><a href="#features" onClick={() => setMenuOpen(false)}>Features</a></li>
          <li><a href="#how" onClick={() => setMenuOpen(false)}>How it works</a></li>
        </ul>

        <div className="mobile-menu-divider" />

        <div className="mobile-cta">
          <div className="mobile-cta-label">Get started</div>
          <button className="btn-mobile-outline" onClick={() => { setMenuOpen(false); router.push('/login') }}>
            Sign in
          </button>
          <button className="btn-mobile-black" onClick={() => { setMenuOpen(false); router.push('/register') }}>
            Get started →
          </button>
        </div>

        <div className="mobile-menu-footer">
          <div className="mobile-menu-badge">
            <span className="mobile-menu-badge-dot" />
            Free forever · No credit card needed
          </div>
        </div>
      </div>

      {/* ── Nav ── */}
      <nav className={`nav ${scrolled ? 'scrolled' : ''}`}>
        <a href="#" className="nav-logo">
          <img src="/logo.png" alt="ExpenseFlow" className="nav-logo-img" onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
          <span className="nav-logo-text">ExpenseFlow</span>
        </a>
        <ul className="nav-links">
          <li><a href="#about">About</a></li>
          <li><a href="#features">Features</a></li>
          <li><a href="#how">How it works</a></li>
        </ul>
        <div className="nav-cta">
          <button className="btn btn-outline" onClick={() => router.push('/login')}>Sign in</button>
          <button className="btn btn-black" onClick={() => router.push('/register')}>Get started →</button>
        </div>
        {/* Hamburger — mobile only */}
        <button
          className={`hamburger-btn ${menuOpen ? 'open' : ''}`}
          onClick={() => setMenuOpen(v => !v)}
          aria-label="Open menu"
        >
          <span className="ham-line" />
          <span className="ham-line" />
          <span className="ham-line" />
        </button>
      </nav>

      {/* ── Hero ── */}
      <section className="hero">
        <div className="hero-bg" />
        <div className="hero-dots" />
        <svg className="hero-wave" viewBox="0 0 1600 200" preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <linearGradient id="heroWaveGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#1e1d1b" />
              <stop offset="100%" stopColor="#111110" />
            </linearGradient>
          </defs>
          <path d="M0,130 C260,190 480,50 800,95 C1120,140 1340,30 1600,85 L1600,200 L0,200 Z" fill="url(#heroWaveGrad)" opacity="0.9" />
        </svg>

        <div className="hero-inner">
        <div
          id="hero-content"
          data-observe
          className={`hero-content ${visible['hero-content'] ? 'visible' : ''}`}
        >
          <div className="hero-badge">
            <span className="hero-badge-dot" />
            Free forever · No credit card needed
          </div>

          <h1 className="hero-title">
            Take control of<br />
            <span className="accent-line">your money.</span>
          </h1>

          <p className="hero-sub">
            ExpenseFlow is the personal finance tracker built for Indonesian people who take money seriously — clean, fast, and completely free.
          </p>

          <div className="hero-actions">
            <button className="btn btn-black btn-xl" onClick={() => router.push('/register')}>
              Start tracking free →
            </button>
            <button
              className="btn btn-outline btn-lg"
              onClick={() => document.getElementById('how')?.scrollIntoView({ behavior: 'smooth' })}
            >
              <span className="btn-play-icon">▶</span>
              See how it works
            </button>
          </div>

          <div className="hero-features-strip">
            {[
              { icon: '↗', title: 'Track', sub: 'every transaction' },
              { icon: '◐', title: 'Understand', sub: 'your spending' },
              { icon: '◎', title: 'Achieve', sub: 'your financial goals' },
            ].map(f => (
              <div key={f.title} className="hero-feature-item">
                <div className="hero-feature-icon">{f.icon}</div>
                <div className="hero-feature-text">
                  <div className="hero-feature-title">{f.title}</div>
                  <div className="hero-feature-sub">{f.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Dashboard Preview */}
        <div
          id="hero-preview"
          data-observe
          className={`hero-preview ${visible['hero-preview'] ? 'visible' : ''}`}
          style={{ transitionDelay: '0.15s' }}
        >
          <div className="hero-preview-glow" />
          <div className="preview-frame">
            <div className="preview-bar">
              <div className="preview-dot" style={{ background: '#FF5F57' }} />
              <div className="preview-dot" style={{ background: '#FEBC2E' }} />
              <div className="preview-dot" style={{ background: '#28C840' }} />
              <div className="preview-url">expenseflow.app/dashboard</div>
            </div>
            <div className="preview-body">
              <div className="preview-sidebar">
                <div className="preview-sidebar-logo">
                  <img src="/logo.png" alt="" onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                  <span>ExpenseFlow</span>
                </div>
                {[
                  { icon: '▦', label: 'Dashboard', active: true },
                  { icon: '⇄', label: 'Transactions' },
                  { icon: '◔', label: 'Budgets' },
                  { icon: '◈', label: 'Goals' },
                  { icon: '◱', label: 'Analytics' },
                  { icon: '⚙', label: 'Settings' },
                ].map(n => (
                  <div key={n.label} className={`preview-nav-item ${n.active ? 'active' : ''}`}>
                    <span className="preview-nav-icon">{n.icon}</span>
                    <span className="preview-nav-text">{n.label}</span>
                  </div>
                ))}
              </div>

              <div className="preview-main">
                <div className="preview-topbar">
                  <div>
                    <div className="preview-welcome-title">Welcome back, Wilian</div>
                    <div className="preview-welcome-sub">Here's your financial overview for this month.</div>
                  </div>
                  <div className="preview-topbar-actions">
                    <span className="preview-month-pill">This Month</span>
                    <span className="preview-icon-pill">⌕</span>
                    <span className="preview-icon-pill">◌</span>
                    <span className="preview-avatar-pill">W</span>
                  </div>
                </div>

                <div className="preview-stat-cards">
                  {[
                    { l: 'Total Balance', v: 'Rp 88.8jt', d: '↑ 12.5% from last month', dir: 'up' },
                    { l: 'Total Income', v: 'Rp 12.4jt', d: '↑ 8.2% from last month', dir: 'up' },
                    { l: 'Total Expenses', v: 'Rp 8.6jt', d: '↓ 4.1% from last month', dir: 'down' },
                  ].map(s => (
                    <div key={s.l} className="preview-stat-card">
                      <div className="preview-stat-card-label">{s.l}</div>
                      <div className="preview-stat-card-val">{s.v}</div>
                      <div className={`preview-stat-card-delta ${s.dir}`}>{s.d}</div>
                    </div>
                  ))}
                </div>

                <div className="preview-panels">
                  <div className="preview-panel">
                    <div className="preview-panel-head">
                      <span className="preview-panel-title">Spending Overview</span>
                      <span className="preview-month-pill">This Month</span>
                    </div>
                    <div className="preview-bars">
                      <svg className="preview-bars-line" viewBox="0 0 280 74" preserveAspectRatio="none">
                        <polyline
                          points="20,44 60,33 100,38 140,28 180,22 220,31 260,6"
                          fill="none"
                          stroke="rgba(0,0,0,0.16)"
                          strokeWidth="1.5"
                        />
                      </svg>
                      {[
                        { m: 'Jan', h: 40 },
                        { m: 'Feb', h: 55 },
                        { m: 'Mar', h: 48 },
                        { m: 'Apr', h: 62 },
                        { m: 'May', h: 70 },
                        { m: 'Jun', h: 58 },
                        { m: 'Jul', h: 92, current: true },
                      ].map(b => (
                        <div key={b.m} className="preview-bar-col">
                          {b.current && <span className="preview-bar-pill">Rp 8.6jt</span>}
                          <div className={`preview-chart-bar ${b.current ? 'current' : ''}`} style={{ height: `${b.h}%` }} />
                          <span className="preview-bar-label">{b.m}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="preview-panel">
                    <div className="preview-panel-head">
                      <span className="preview-panel-title">Expense Breakdown</span>
                    </div>
                    <div className="preview-donut-wrap">
                      <div
                        className="preview-donut"
                        style={{ background: 'conic-gradient(var(--black) 0% 35%, var(--gray-5) 35% 59%, var(--gray-4) 59% 75%, var(--gray-3) 75% 87%, var(--gray-2) 87% 100%)' }}
                      >
                        <div className="preview-donut-center">
                          <div className="preview-donut-center-val">Rp 8.6jt</div>
                          <div className="preview-donut-center-lbl">Total</div>
                        </div>
                      </div>
                      <div className="preview-legend">
                        {[
                          { n: 'Food & Beverages', p: '35%', c: 'var(--black)' },
                          { n: 'Shopping', p: '24%', c: 'var(--gray-5)' },
                          { n: 'Transportation', p: '16%', c: 'var(--gray-4)' },
                          { n: 'Entertainment', p: '12%', c: 'var(--gray-3)' },
                          { n: 'Others', p: '13%', c: 'var(--gray-2)' },
                        ].map(l => (
                          <div key={l.n} className="preview-legend-item">
                            <span className="preview-legend-dot" style={{ background: l.c }} />
                            <span className="preview-legend-name">{l.n}</span>
                            <span className="preview-legend-pct">{l.p}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="preview-goal-float">
            <div className="preview-goal-icon">◎</div>
            <div className="preview-goal-body">
              <div className="preview-goal-label">Your Goal</div>
              <div className="preview-goal-title">Financial Freedom</div>
              <div className="preview-goal-sub">Keep going! You're on the right track.</div>
              <div className="preview-goal-bar-track">
                <div className="preview-goal-bar-fill" style={{ width: '68%' }} />
              </div>
            </div>
            <div className="preview-goal-pct">68%</div>
          </div>
        </div>
        </div>
      </section>

      {/* ── Ticker ── */}
      <div className="ticker">
        <div className="ticker-inner">
          {[...Array(2)].map((_, outer) => (
            ['Track Expenses', 'Monitor Income', 'Set Budgets', 'Build Savings', 'Manage Bills', 'Smart Insights', 'Export CSV', 'Free Forever'].map((item, i) => (
              <span key={`${outer}-${i}`} className="ticker-item">
                <strong>{item}</strong>
                <span className="ticker-dot" />
              </span>
            ))
          ))}
        </div>
      </div>

      {/* ── About ── */}
      <section className="section" id="about">
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div
            id="about-head"
            data-observe
            className={visible['about-head'] ? 'visible' : ''}
          >
            <div className="section-tag">01 — What is ExpenseFlow</div>
            <h2 className="section-title">Built for clarity.<br />Designed for action.</h2>
            <p className="section-sub">
              Everything you need to understand and control your personal finances — without the complexity.
            </p>
          </div>

          <div
            ref={statsRef}
            className={`stats-grid ${statsIn ? 'in' : ''}`}
            onMouseMove={handleStatsMove}
          >
            {statItems.map((s, i) => (
              <div key={s.label} className="stat-box" style={{ '--i': i } as React.CSSProperties}>
                <span className="stat-index">0{i + 1}</span>
                <div className="stat-num" data-count={s.count} data-suffix={s.suffix}>{s.n}</div>
                <div className="stat-lbl">{s.label}</div>
                <div className="stat-visual">
                  {s.kind === 'ring' && <div className="stat-ring" />}
                  {s.kind === 'bar' && (
                    <div className="stat-bar"><div className="stat-bar-fill" /></div>
                  )}
                  {s.kind === 'dots' && (
                    <div className="stat-dots">
                      {Array.from({ length: 10 }).map((_, d) => (
                        <span key={d} className="stat-dot" style={{ '--d': d } as React.CSSProperties} />
                      ))}
                    </div>
                  )}
                  {s.kind === 'infinity' && (
                    <svg className="stat-infinity" viewBox="0 0 60 24" aria-hidden="true">
                      <path d="M30 12 C 30 4, 44 4, 44 12 C 44 20, 30 20, 30 12 C 30 4, 16 4, 16 12 C 16 20, 30 20, 30 12 Z" />
                    </svg>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="section" id="features" style={{ paddingTop: 0 }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div
            id="feat-head"
            data-observe
            className={visible['feat-head'] ? 'visible' : ''}
          >
            <div className="section-tag">02 — Features</div>
            <h2 className="section-title">Every tool you need.</h2>
            <p className="section-sub">Nine connected tools covering every side of your money — from daily expenses to shared bills and debts.</p>
          </div>

          {/* App-nav tabs preview */}
          <div className={`app-tabs ${visible['feat-head'] ? 'in' : ''}`}>
            {appTabs.map((t, i) => (
              <div
                key={t.name}
                className={`app-tab ${activeTab === i ? 'active' : ''}`}
                style={{ '--t': i } as React.CSSProperties}
              >
                <span className="app-tab-icon">{t.icon}</span>
                {t.name}
                {t.badge && <span className="app-tab-badge">{t.badge}</span>}
              </div>
            ))}
          </div>

          <div
            ref={featGridRef}
            className={`features-grid ${featIn ? 'in' : ''}`}
            onMouseMove={handleSpotlight}
          >
            {featureCards.map((f, i) => (
              <div key={f.title} className="feature-card" style={{ '--i': i } as React.CSSProperties}>
                <div className={`feature-tag-pill ${f.tag === 'New' ? 'new' : ''}`}>{f.tag}</div>
                <div className="feature-icon-box">{f.icon}</div>
                <div className="feature-title">{f.title}</div>
                <p className="feature-desc">{f.desc}</p>
                <span className="feature-arrow">→</span>
              </div>
            ))}
          </div>

          {/* Live switcher */}
          <div
            id="live-panel"
            data-observe
            className={visible['live-panel'] ? 'visible' : ''}
            style={{ transitionDelay: '0.2s', marginTop: 60 }}
          >
            <div className="live-panel">
              <div className="live-list">
                <div className="live-list-label">What you can do</div>
                {features.map((f, i) => (
                  <div
                    key={i}
                    className={`live-item ${activeFeature === i ? 'active' : ''}`}
                    onClick={() => setActiveFeature(i)}
                  >
                    <div className="live-dot" />
                    <div className="live-item-text">
                      <div className="live-item-title">{f.label}</div>
                      <div className="live-item-sub">{f.sub}</div>
                    </div>
                    <div className="live-progress" />
                  </div>
                ))}
              </div>
              <div className="live-display">
                <div className="live-display-tag" key={`tag-${activeFeature}`}>{features[activeFeature].sub}</div>
                <div className="live-display-val" key={`val-${activeFeature}`}>{features[activeFeature].val}</div>
                <div className="live-display-sub" key={`sub-${activeFeature}`}>{features[activeFeature].desc}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <div style={{ padding: '60px 0', overflow: 'hidden', borderTop: '1.5px solid var(--gray-2)', borderBottom: '1.5px solid var(--gray-2)' }}>
        <div className="marquee-track">
          {testimonials.map((t, i) => (
            <div key={i} className="marquee-card">
              <p className="marquee-quote">"{t.q}"</p>
              <div className="marquee-author">
                <div className="marquee-avatar">{t.name[0]}</div>
                <div>
                  <div className="marquee-name">{t.name}</div>
                  <div className="marquee-role">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── How it works ── */}
      <section className="section" id="how">
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div
            id="how-head"
            data-observe
            className={visible['how-head'] ? 'visible' : ''}
          >
            <div className="section-tag">03 — How it works</div>
            <h2 className="section-title">Simple. Powerful.</h2>
            <p className="section-sub">Up and running in under 60 seconds.</p>
          </div>

          <div
            id="steps"
            data-observe
            className={visible['steps'] ? 'visible' : ''}
            style={{ transitionDelay: '0.15s' }}
          >
            <div className="steps-grid">
              {[
                { n: '1', title: 'Create your account', desc: 'Sign up in under 30 seconds. No credit card, no trial period — ExpenseFlow is completely free.' },
                { n: '2', title: 'Add income & expenses', desc: 'Log your money in and out. Set category budgets, add recurring bills, and create savings goals.' },
                { n: '3', title: 'Track and grow', desc: 'Watch your dashboard fill with insights. Get alerts, hit savings targets, and export your data.' },
              ].map((s, i) => (
                <div key={s.n} className="step-card">
                  {i < 2 && <div className="step-arrow">→</div>}
                  <div className="step-num">{s.n}</div>
                  <div className="step-title">{s.title}</div>
                  <p className="step-desc">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <div
        id="cta-block"
        data-observe
        className={visible['cta-block'] ? 'visible' : ''}
      >
        <div className="cta-section">
          <div className="cta-bg-grid" />
          <h2 className="cta-title">Start today.<br />It's free.</h2>
          <p className="cta-sub">No subscription. No hidden costs. Just a clean dashboard that helps you own your finances.</p>
          <div className="cta-actions">
            <button className="btn-white" onClick={() => router.push('/register')}>
              Create account →
            </button>
            <button className="btn-ghost" onClick={() => router.push('/login')}>
              Already have an account
            </button>
          </div>
          <p className="cta-note">Free · No credit card · Indonesian Rupiah (IDR)</p>
        </div>
      </div>

      {/* ── Footer ── */}
      <footer>
        <div className="footer-top">
          <div className="footer-brand">
            <div className="footer-logo">
              <img src="/logo.png" alt="" className="footer-logo-img" onError={e => { (e.target as HTMLImageElement).style.display='none' }} />
              <span className="footer-logo-name">ExpenseFlow</span>
            </div>
            <p className="footer-tagline">Personal finance tracking for people who mean business.</p>
          </div>
          <div className="footer-links">
            <div>
              <div className="footer-col-title">Product</div>
              <ul className="footer-col-list">
                <li><a href="#features">Features</a></li>
                <li><a href="#how">How it works</a></li>
                <li><a href="#about">About</a></li>
              </ul>
            </div>
            <div>
              <div className="footer-col-title">Account</div>
              <ul className="footer-col-list">
                <li><a href="#" onClick={e => { e.preventDefault(); router.push('/login') }}>Sign in</a></li>
                <li><a href="#" onClick={e => { e.preventDefault(); router.push('/register') }}>Register</a></li>
                <li><a href="#" onClick={e => { e.preventDefault(); router.push('/dashboard') }}>Dashboard</a></li>
              </ul>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <span className="footer-copy">© 2026 ExpenseFlow by Wilian. Personal use only.</span>
          <span className="footer-badge">Next.js + Supabase</span>
        </div>
      </footer>
    </>
  )
}