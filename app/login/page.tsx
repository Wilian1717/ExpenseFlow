'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, ArrowRight, ArrowLeft } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [mounted, setMounted]   = useState(false)
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
    checkUser()
  }, [])

  const checkUser = async () => {
    const { data } = await supabase.auth.getUser()
    if (data.user) router.push('/dashboard')
  }

  const handleLogin = async () => {
    setError('')
    if (!email.trim() || !password) { setError('Please fill in all fields.'); return }
    setLoading(true)
    const { error: err } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (err) setError(err.message)
    else router.push('/dashboard')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleLogin()
  }

  const stats = [
    { num: '10+', label: 'Categories' },
    { num: '∞',   label: 'Transactions' },
    { num: '100%', label: 'Free' },
  ]

  const features = [
    'Smart spending insights',
    'Recurring bill tracking',
    'Savings goal progress',
    'CSV export anytime',
  ]

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        body {
          font-family: 'Sora', sans-serif;
          background: #ffffff;
          color: #111110;
        }

        .login-root {
          min-height: 100vh;
          display: grid;
          grid-template-columns: 1fr 1fr;
        }

        /* ── Left panel ── */
        .left-panel {
          background: #111110;
          position: relative;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 48px;
        }
        .left-noise {
          position: absolute; inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E");
          pointer-events: none;
        }
        .left-grid {
          position: absolute; inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
          background-size: 48px 48px;
          pointer-events: none;
        }
        .left-glow {
          position: absolute;
          width: 500px; height: 500px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(255,255,255,0.06) 0%, transparent 65%);
          top: -100px; left: -100px;
          pointer-events: none;
        }
        .left-glow-2 {
          position: absolute;
          width: 300px; height: 300px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(255,255,255,0.04) 0%, transparent 70%);
          bottom: 60px; right: -60px;
          pointer-events: none;
        }

        .left-logo {
          display: flex; align-items: center; gap: 10px;
          position: relative; z-index: 1;
          opacity: 0;
          transform: translateY(-12px);
          animation: fadeSlideDown 0.6s ease 0.1s forwards;
        }
        .left-logo-img {
          width: 36px; height: 36px;
          border-radius: 10px;
          object-fit: cover;
          border: 1px solid rgba(255,255,255,0.1);
        }
        .left-logo-fallback {
          width: 36px; height: 36px;
          border-radius: 10px;
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.12);
          display: flex; align-items: center; justify-content: center;
        }
        .left-logo-fallback-grid {
          display: grid; grid-template-columns: 1fr 1fr; gap: 2.5px;
        }
        .left-logo-fallback-grid div {
          width: 7px; height: 7px;
          border-radius: 2px;
        }
        .left-logo-name {
          font-size: 16px; font-weight: 700;
          color: #ffffff;
          letter-spacing: -0.02em;
        }

        .left-mid {
          position: relative; z-index: 1;
          opacity: 0;
          transform: translateY(20px);
          animation: fadeSlideUp 0.7s ease 0.3s forwards;
        }
        .left-eyebrow {
          font-family: 'DM Mono', monospace;
          font-size: 10px; font-weight: 500;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.3);
          margin-bottom: 20px;
          display: flex; align-items: center; gap: 10px;
        }
        .left-eyebrow::before {
          content: '';
          width: 28px; height: 1px;
          background: rgba(255,255,255,0.2);
        }
        .left-headline {
          font-size: clamp(36px, 3.5vw, 52px);
          font-weight: 800;
          line-height: 1.05;
          letter-spacing: -0.04em;
          color: #ffffff;
          margin-bottom: 20px;
        }
        .left-headline .dim {
          color: rgba(255,255,255,0.25);
        }
        .left-sub {
          font-size: 14px; font-weight: 300;
          color: rgba(255,255,255,0.45);
          line-height: 1.7;
          max-width: 320px;
          margin-bottom: 28px;
        }

        /* Feature list */
        .left-features {
          display: flex;
          flex-direction: column;
          gap: 10px;
          position: relative;
          z-index: 1;
        }
        .left-feature-item {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 12px;
          font-weight: 400;
          color: rgba(255,255,255,0.4);
        }
        .left-feature-dot {
          width: 5px; height: 5px;
          border-radius: 50%;
          background: rgba(255,255,255,0.2);
          flex-shrink: 0;
        }

        .left-bottom {
          position: relative; z-index: 1;
        }

        /* Divider in left panel */
        .left-divider {
          width: 32px; height: 1px;
          background: rgba(255,255,255,0.1);
          margin-bottom: 24px;
        }

        .left-stats {
          display: flex; gap: 32px;
          opacity: 0;
          animation: fadeIn 0.7s ease 0.55s forwards;
        }
        .left-stat-num {
          font-size: 26px; font-weight: 800;
          letter-spacing: -0.04em;
          color: #ffffff;
          line-height: 1;
          margin-bottom: 4px;
        }
        .left-stat-lbl {
          font-size: 10px; font-weight: 400;
          color: rgba(255,255,255,0.3);
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }

        /* ── Right panel ── */
        .right-panel {
          background: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 48px;
          position: relative;
        }

        /* Subtle dot pattern on right */
        .right-panel::before {
          content: '';
          position: absolute; inset: 0;
          background-image: radial-gradient(circle, #e4e3de 1px, transparent 1px);
          background-size: 28px 28px;
          opacity: 0.4;
          pointer-events: none;
        }

        .right-back {
          position: absolute; top: 28px; left: 28px;
          display: flex; align-items: center; gap: 6px;
          font-size: 12px; font-weight: 500;
          color: #8a8980;
          text-decoration: none;
          transition: color 0.2s;
          cursor: pointer;
          z-index: 2;
          background: none; border: none;
          font-family: 'Sora', sans-serif;
        }
        .right-back:hover { color: #111110; }
        .right-back svg { transition: transform 0.2s; }
        .right-back:hover svg { transform: translateX(-3px); }

        .form-wrap {
          width: 100%;
          max-width: 360px;
          opacity: 0;
          transform: translateY(16px);
          animation: fadeSlideUp 0.65s ease 0.2s forwards;
          position: relative;
          z-index: 1;
        }

        /* NEW: Logo on right panel */
        .form-logo {
          display: flex; align-items: center; gap: 9px;
          margin-bottom: 32px;
        }
        .form-logo-img {
          width: 32px; height: 32px;
          border-radius: 9px;
          object-fit: cover;
          border: 1px solid #e4e3de;
        }
        .form-logo-fallback {
          width: 32px; height: 32px;
          border-radius: 9px;
          background: #111110;
          display: flex; align-items: center; justify-content: center;
        }
        .form-logo-fallback-grid {
          display: grid; grid-template-columns: 1fr 1fr; gap: 2.5px;
        }
        .form-logo-fallback-grid div {
          width: 6px; height: 6px;
          border-radius: 1.5px;
        }
        .form-logo-name {
          font-size: 14px; font-weight: 700;
          color: #111110;
          letter-spacing: -0.02em;
        }

        .form-title {
          font-size: 26px; font-weight: 800;
          letter-spacing: -0.04em;
          color: #111110;
          margin-bottom: 6px;
        }
        .form-sub {
          font-size: 13px; font-weight: 300;
          color: #8a8980;
          margin-bottom: 32px;
          line-height: 1.6;
        }

        .field-group { display: flex; flex-direction: column; gap: 12px; margin-bottom: 20px; }

        .field-label {
          display: block;
          font-size: 11px; font-weight: 600;
          color: #5a5950;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin-bottom: 6px;
        }
        .field-input {
          width: 100%;
          border: 1.5px solid #e4e3de;
          border-radius: 10px;
          padding: 11px 14px;
          font-family: 'Sora', sans-serif;
          font-size: 14px; font-weight: 400;
          color: #111110;
          background: #ffffff;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
        }
        .field-input:hover { border-color: #c8c7c0; background: #f8f8f6; }
        .field-input:focus { border-color: #111110; box-shadow: 0 0 0 3px rgba(0,0,0,0.06); background: #ffffff; }
        .field-input::placeholder { color: #c8c7c0; }

        .field-pass-wrap { position: relative; }
        .field-pass-wrap .field-input { padding-right: 44px; }
        .field-pass-eye {
          position: absolute; right: 14px; top: 50%;
          transform: translateY(-50%);
          background: none; border: none;
          color: #c8c7c0; cursor: pointer;
          padding: 2px; border-radius: 4px;
          display: flex; transition: color 0.2s;
        }
        .field-pass-eye:hover { color: #111110; }

        .field-row-end {
          display: flex; justify-content: flex-end;
          margin-top: -4px; margin-bottom: 24px;
        }
        .field-forgot {
          font-size: 11px; font-weight: 500;
          color: #8a8980;
          background: none; border: none;
          cursor: pointer; padding: 0;
          font-family: 'Sora', sans-serif;
          transition: color 0.2s;
        }
        .field-forgot:hover { color: #111110; }

        .error-box {
          background: #fff5f5;
          border: 1.5px solid #fecaca;
          border-radius: 10px;
          padding: 10px 14px;
          margin-bottom: 16px;
          font-size: 12px;
          color: #dc2626;
        }

        .btn-primary {
          width: 100%;
          background: #111110;
          color: #ffffff;
          border: none;
          border-radius: 10px;
          padding: 13px 20px;
          font-family: 'Sora', sans-serif;
          font-size: 14px; font-weight: 600;
          letter-spacing: -0.01em;
          cursor: pointer;
          transition: all 0.2s;
          display: flex; align-items: center; justify-content: center; gap: 8px;
        }
        .btn-primary:hover:not(:disabled) {
          background: #1e1d1b;
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(0,0,0,0.18);
        }
        .btn-primary:active:not(:disabled) { transform: translateY(0); box-shadow: none; }
        .btn-primary:disabled { opacity: 0.55; cursor: not-allowed; }

        .divider {
          display: flex; align-items: center; gap: 12px;
          margin: 18px 0;
        }
        .divider-line { flex: 1; height: 1px; background: #e4e3de; }
        .divider-text { font-size: 11px; color: #c8c7c0; font-weight: 400; }

        .btn-secondary {
          width: 100%;
          background: #ffffff;
          color: #111110;
          border: 1.5px solid #e4e3de;
          border-radius: 10px;
          padding: 12px 20px;
          font-family: 'Sora', sans-serif;
          font-size: 14px; font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-secondary:hover { border-color: #111110; background: #f8f8f6; }

        .form-footer {
          text-align: center;
          margin-top: 24px;
          font-size: 12px;
          color: #8a8980;
        }
        .form-footer a {
          color: #111110; font-weight: 600;
          text-decoration: none;
          border-bottom: 1px solid #e4e3de;
          padding-bottom: 1px;
          transition: border-color 0.2s;
          cursor: pointer;
        }
        .form-footer a:hover { border-color: #111110; }

        /* Trust badge */
        .trust-badge {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          margin-top: 20px;
          font-size: 11px;
          color: #c8c7c0;
          font-weight: 400;
        }
        .trust-dot {
          width: 4px; height: 4px;
          border-radius: 50%;
          background: #e4e3de;
        }

        .spinner {
          width: 16px; height: 16px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #ffffff;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
          flex-shrink: 0;
        }

        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeSlideDown {
          from { opacity: 0; transform: translateY(-12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
          .login-root { grid-template-columns: 1fr; }
          .left-panel { display: none; }
          .right-panel { padding: 32px 24px; align-items: flex-start; padding-top: 72px; }
          .right-back { top: 20px; left: 20px; }
        }
      `}</style>

      <div className="login-root">
        {/* ── Left panel ── */}
        <div className="left-panel">
          <div className="left-noise" />
          <div className="left-grid" />
          <div className="left-glow" />
          <div className="left-glow-2" />

          {/* Logo */}
          <div className="left-logo">
            <img
              src="/logo2.png"
              alt="ExpenseFlow"
              className="left-logo-img"
              onError={e => {
                const t = e.currentTarget
                t.style.display = 'none'
                const fb = t.nextElementSibling as HTMLElement
                if (fb) fb.style.display = 'flex'
              }}
            />
            <div className="left-logo-fallback" style={{ display: 'none' }}>
              <div className="left-logo-fallback-grid">
                <div style={{ background: 'rgba(255,255,255,0.9)' }} />
                <div style={{ background: 'rgba(255,255,255,0.35)' }} />
                <div style={{ background: 'rgba(255,255,255,0.35)' }} />
                <div style={{ background: 'rgba(255,255,255,0.9)' }} />
              </div>
            </div>
            <span className="left-logo-name">ExpenseFlow</span>
          </div>

          {/* Middle copy */}
          <div className="left-mid">
            <div className="left-eyebrow">Personal finance</div>
            <h2 className="left-headline">
              Track every<br />
              <span className="dim">rupiah you</span><br />
              spend.
            </h2>
            <p className="left-sub">
              Clean dashboards, smart insights, and total clarity over your money. Free forever.
            </p>

            {/* Feature list */}
            <div className="left-features">
              {features.map(f => (
                <div key={f} className="left-feature-item">
                  <div className="left-feature-dot" />
                  {f}
                </div>
              ))}
            </div>
          </div>

          {/* Bottom stats */}
          <div className="left-bottom">
            <div className="left-divider" />
            <div className="left-stats">
              {stats.map(s => (
                <div key={s.label}>
                  <div className="left-stat-num">{s.num}</div>
                  <div className="left-stat-lbl">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Right panel ── */}
        <div className="right-panel">
          <button className="right-back" onClick={() => router.push('/')}>
            <ArrowLeft size={13} />
            Back to home
          </button>

          <div className="form-wrap">
            {/* NEW: Logo on right panel using logo.png */}
            <div className="form-logo">
              <img
                src="/logo.png"
                alt="ExpenseFlow"
                className="form-logo-img"
                onError={e => {
                  const t = e.currentTarget
                  t.style.display = 'none'
                  const fb = t.nextElementSibling as HTMLElement
                  if (fb) fb.style.display = 'flex'
                }}
              />
              <div className="form-logo-fallback" style={{ display: 'none' }}>
                <div className="form-logo-fallback-grid">
                  <div style={{ background: 'rgba(255,255,255,0.9)' }} />
                  <div style={{ background: 'rgba(255,255,255,0.35)' }} />
                  <div style={{ background: 'rgba(255,255,255,0.35)' }} />
                  <div style={{ background: 'rgba(255,255,255,0.9)' }} />
                </div>
              </div>
              <span className="form-logo-name">ExpenseFlow</span>
            </div>

            <h1 className="form-title">Welcome back</h1>
            <p className="form-sub">Sign in to your ExpenseFlow account</p>

            <div className="field-group">
              <div>
                <label className="field-label">Email</label>
                <input
                  className="field-input"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onKeyDown={handleKeyDown}
                  autoComplete="email"
                />
              </div>

              <div>
                <label className="field-label">Password</label>
                <div className="field-pass-wrap">
                  <input
                    className="field-input"
                    type={showPass ? 'text' : 'password'}
                    placeholder="Your password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    onKeyDown={handleKeyDown}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="field-pass-eye"
                    onClick={() => setShowPass(v => !v)}
                  >
                    {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
            </div>

            <div className="field-row-end">
              <button className="field-forgot">Forgot password?</button>
            </div>

            {error && <div className="error-box">{error}</div>}

            <button
              className="btn-primary"
              onClick={handleLogin}
              disabled={loading}
            >
              {loading
                ? <><div className="spinner" /> Signing in...</>
                : <>Sign in </>
              }
            </button>

            <div className="divider">
              <div className="divider-line" />
              <span className="divider-text">or</span>
              <div className="divider-line" />
            </div>

            <button
              className="btn-secondary"
              onClick={() => router.push('/register')}
            >
              Create an account
            </button>

            <div className="form-footer">
              New to ExpenseFlow?{' '}
              <a onClick={() => router.push('/register')}>
                Sign up free
              </a>
            </div>

            {/* Trust badge */}
            <div className="trust-badge">
              <span>Free forever</span>
              <div className="trust-dot" />
              <span>No credit card</span>
              <div className="trust-dot" />
              <span>Private & secure</span>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}