'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import { Check, X, Eye, EyeOff, ArrowLeft, Shield } from 'lucide-react'

export default function RegisterPage() {
  const [fullName, setFullName]                 = useState('')
  const [email, setEmail]                       = useState('')
  const [password, setPassword]                 = useState('')
  const [confirmPassword, setConfirmPassword]   = useState('')
  const [showPassword, setShowPassword]         = useState(false)
  const [showConfirm, setShowConfirm]           = useState(false)
  const [agreedToTerms, setAgreedToTerms]       = useState(false)
  const [showTerms, setShowTerms]               = useState(false)
  const [loading, setLoading]                   = useState(false)
  const [error, setError]                       = useState('')
  const [success, setSuccess]                   = useState(false)
  const [registrationOpen, setRegistrationOpen] = useState<boolean | null>(null)
  const router = useRouter()

  const checks = {
    length: password.length >= 8,
    upper:  /[A-Z]/.test(password),
    number: /[0-9]/.test(password),
  }
  const passwordStrong = Object.values(checks).every(Boolean)
  const passwordsMatch = password === confirmPassword && confirmPassword !== ''

  // ── Check if registration is enabled on mount ─────────────────────────────
  useEffect(() => {
    const checkRegistration = async () => {
      const { data } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'registration_enabled')
        .single()
      setRegistrationOpen(data?.value === 'true')
    }
    checkRegistration()
  }, [])

  const handleRegister = async () => {
    setError('')
    if (registrationOpen === false) { setError('Registration is currently closed. Please contact the owner.'); return }
    if (!fullName.trim()) { setError('Please enter your full name.'); return }
    if (!email.trim())    { setError('Please enter your email address.'); return }
    if (!passwordStrong)  { setError('Password does not meet all requirements.'); return }
    if (!passwordsMatch)  { setError('Passwords do not match.'); return }
    if (!agreedToTerms)   { setError('You must agree to the Terms & Conditions.'); return }

    setLoading(true)
    const { error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { full_name: fullName.trim() } }
    })
    setLoading(false)

    if (signUpError) setError(signUpError.message)
    else setSuccess(true)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleRegister()
  }

  const steps = [
    'Smart spending insights',
    'Recurring bill tracking',
    'Savings goal progress',
    'CSV export anytime',
  ]

  const stats = [
    { num: '10+',  label: 'Categories' },
    { num: '∞',    label: 'Transactions' },
    { num: '100%', label: 'Free' },
  ]

  /* ─── Success screen ─── */
  if (success) {
    return (
      <>
        <style>{baseStyles}</style>
        <div className="register-root" style={{ gridTemplateColumns: '1fr' }}>
          <div style={{
            minHeight: '100vh', display: 'flex', alignItems: 'center',
            justifyContent: 'center', background: '#ffffff', padding: '40px',
          }}>
            <div style={{ textAlign: 'center', maxWidth: 360, animation: 'fadeSlideUp 0.6s ease forwards' }}>
              <div style={{
                width: 52, height: 52, background: '#111110', borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 20px',
              }}>
                <Check size={22} color="white" strokeWidth={2.5} />
              </div>
              <h2 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.04em', color: '#111110', marginBottom: 8 }}>
                Check your email
              </h2>
              <p style={{ fontSize: 13, color: '#8a8980', lineHeight: 1.7, marginBottom: 28 }}>
                We sent a verification link to{' '}
                <span style={{ color: '#111110', fontWeight: 600 }}>{email}</span>.
                Click the link to activate your account.
              </p>
              <button className="btn-primary" onClick={() => router.push('/login')}>
                Back to sign in
              </button>
            </div>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <style>{baseStyles}</style>

      {/* ─── Terms Modal ─── */}
      {showTerms && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 50,
          display: 'flex', alignItems: 'flex-end',
          justifyContent: 'center',
          background: 'rgba(0,0,0,0.35)',
          padding: '0 16px 16px',
        }}>
          <div style={{
            background: '#ffffff', borderRadius: 20, width: '100%', maxWidth: 420,
            boxShadow: '0 24px 60px rgba(0,0,0,0.18)',
            maxHeight: '82vh', display: 'flex', flexDirection: 'column',
            animation: 'fadeSlideUp 0.3s ease',
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '18px 20px', borderBottom: '1px solid #f0efea',
            }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: '#111110', letterSpacing: '-0.02em' }}>
                Terms & Conditions
              </span>
              <button onClick={() => setShowTerms(false)} style={{
                width: 28, height: 28, border: 'none', background: '#f4f3ee',
                borderRadius: 8, cursor: 'pointer', display: 'flex',
                alignItems: 'center', justifyContent: 'center', color: '#8a8980',
                transition: 'all 0.15s',
              }}>
                <X size={14} />
              </button>
            </div>

            <div style={{ overflowY: 'auto', padding: '16px 20px', flex: 1 }}>
              <p style={{ fontSize: 10, color: '#c8c7c0', textTransform: 'uppercase', letterSpacing: '0.18em', fontWeight: 600, marginBottom: 16 }}>
                Last updated: April 2026
              </p>
              {[
                ['1. What this app does', 'A personal finance tracking app to record income, expenses, savings goals, and bills. Provided as-is for personal use.'],
                ['2. Your data', 'Financial data (expenses, income, bills, goals) is stored in our database. As the app owner, I can technically see database data. Do not store sensitive info beyond intended use.'],
                ['3. No financial advice', 'This app is a tracker only. Nothing constitutes financial or legal advice. Consult a qualified professional for financial decisions.'],
                ['4. Account responsibility', 'Keep your login credentials secure. Do not share your account. You are responsible for all activity under your account.'],
                ['5. Data accuracy', 'The app displays what you input. We make no guarantees about accuracy or that data will never be lost. Use the CSV export as backup.'],
                ['6. Service availability', 'This is a personal project. It may go down, change, or be discontinued at any time without notice. No SLA or uptime guarantee.'],
                ['7. Privacy', 'Your data is stored via Supabase. We do not sell or share data with third parties. Data may be deleted upon request.'],
                ['8. Acceptable use', 'Do not misuse this service, attempt to access others\' data, or use it for illegal purposes.'],
                ['9. Changes to terms', 'Terms may be updated at any time. Continued use means you accept new terms.'],
                ['10. Contact', 'For questions or data deletion requests, reach out to the app owner directly.'],
              ].map(([title, body]) => (
                <div key={title as string} style={{ marginBottom: 14 }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: '#111110', marginBottom: 4 }}>{title}</p>
                  <p style={{ fontSize: 12, color: '#8a8980', lineHeight: 1.65 }}>{body}</p>
                </div>
              ))}
            </div>

            <div style={{ padding: '14px 20px', borderTop: '1px solid #f0efea' }}>
              <button className="btn-primary" onClick={() => { setAgreedToTerms(true); setShowTerms(false) }}>
                I agree to these terms
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Main layout ─── */}
      <div className="register-root">

        {/* ── Form panel (left) ── */}
        <div className="right-panel">
          <button className="right-back" onClick={() => router.push('/home')}>
            <ArrowLeft size={13} />
            Back to home
          </button>

          <div className="form-wrap">

            {/* Logo */}
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

            <h1 className="form-title">Create account</h1>
            <p className="form-sub">Start tracking your finances for free</p>

            {/* ── Registration closed notice ── */}
            {registrationOpen === false && (
              <div className="closed-banner">
                <div className="closed-banner-icon">
                  <Shield size={14} color="white" />
                </div>
                <div>
                  <p className="closed-banner-title">Registration is currently limited</p>
                  <p className="closed-banner-sub">
                    We're managing access carefully. If you'd like an account, please contact the owner.
                  </p>
                </div>
              </div>
            )}

            {/* Fields */}
            <div className="field-group">

              {/* Full name */}
              <div>
                <label className="field-label">Full name</label>
                <input
                  className="field-input"
                  type="text"
                  placeholder="Your Full Name"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  onKeyDown={handleKeyDown}
                  autoComplete="name"
                  disabled={registrationOpen === false}
                />
              </div>

              {/* Email */}
              <div>
                <label className="field-label">Email address</label>
                <input
                  className="field-input"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onKeyDown={handleKeyDown}
                  autoComplete="email"
                  disabled={registrationOpen === false}
                />
              </div>

              {/* Password */}
              <div>
                <label className="field-label">Password</label>
                <div className="field-pass-wrap">
                  <input
                    className="field-input"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Create a strong password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    onKeyDown={handleKeyDown}
                    autoComplete="new-password"
                    disabled={registrationOpen === false}
                    style={{ paddingRight: 44 }}
                  />
                  <button
                    type="button"
                    className="field-pass-eye"
                    onClick={() => setShowPassword(v => !v)}
                    disabled={registrationOpen === false}
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>

                {/* Strength pills */}
                {password.length > 0 && (
                  <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                    {[
                      { label: '8+ chars',  ok: checks.length },
                      { label: 'Uppercase', ok: checks.upper  },
                      { label: 'Number',    ok: checks.number },
                    ].map(c => (
                      <div key={c.label} style={{
                        display: 'flex', alignItems: 'center', gap: 5,
                        background: c.ok ? '#f0fdf4' : '#f8f8f6',
                        border: `1px solid ${c.ok ? '#bbf7d0' : '#e4e3de'}`,
                        borderRadius: 6, padding: '3px 8px',
                        transition: 'all 0.2s',
                      }}>
                        <div style={{
                          width: 5, height: 5, borderRadius: '50%',
                          background: c.ok ? '#22c55e' : '#d1d0c8',
                          flexShrink: 0,
                        }} />
                        <span style={{
                          fontSize: 10, fontWeight: 500,
                          color: c.ok ? '#16a34a' : '#a8a89a',
                        }}>{c.label}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Confirm password */}
              <div>
                <label className="field-label">Confirm password</label>
                <div className="field-pass-wrap">
                  <input
                    className="field-input"
                    type={showConfirm ? 'text' : 'password'}
                    placeholder="Repeat your password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    onKeyDown={handleKeyDown}
                    autoComplete="new-password"
                    disabled={registrationOpen === false}
                    style={{
                      paddingRight: 44,
                      borderColor: confirmPassword.length > 0
                        ? passwordsMatch ? '#86efac' : '#fca5a5'
                        : undefined,
                      boxShadow: confirmPassword.length > 0
                        ? passwordsMatch
                          ? '0 0 0 3px rgba(34,197,94,0.08)'
                          : '0 0 0 3px rgba(239,68,68,0.08)'
                        : undefined,
                    }}
                  />
                  <button
                    type="button"
                    className="field-pass-eye"
                    onClick={() => setShowConfirm(v => !v)}
                    disabled={registrationOpen === false}
                  >
                    {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {confirmPassword.length > 0 && !passwordsMatch && (
                  <p style={{ fontSize: 11, color: '#dc2626', marginTop: 5, paddingLeft: 2 }}>
                    Passwords don't match
                  </p>
                )}
              </div>
            </div>

            {/* Terms checkbox */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 20 }}>
              <button
                type="button"
                onClick={() => registrationOpen !== false && setAgreedToTerms(v => !v)}
                disabled={registrationOpen === false}
                style={{
                  marginTop: 1,
                  width: 16, height: 16,
                  borderRadius: 5,
                  border: `2px solid ${agreedToTerms ? '#111110' : '#d1d0c8'}`,
                  background: agreedToTerms ? '#111110' : '#ffffff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                  cursor: registrationOpen === false ? 'not-allowed' : 'pointer',
                  transition: 'all 0.18s',
                  opacity: registrationOpen === false ? 0.4 : 1,
                }}
              >
                {agreedToTerms && <Check size={9} color="white" strokeWidth={3} />}
              </button>
              <p style={{ fontSize: 12, color: '#8a8980', lineHeight: 1.6, opacity: registrationOpen === false ? 0.4 : 1 }}>
                I agree to the{' '}
                <button
                  type="button"
                  onClick={() => setShowTerms(true)}
                  disabled={registrationOpen === false}
                  style={{
                    background: 'none', border: 'none', padding: 0,
                    fontSize: 12, color: '#111110', fontWeight: 600,
                    textDecoration: 'underline', textUnderlineOffset: 2,
                    cursor: registrationOpen === false ? 'not-allowed' : 'pointer',
                    fontFamily: 'inherit', transition: 'color 0.15s',
                  }}
                >
                  Terms & Conditions
                </button>
                . I understand my financial data is stored and accessible by the app owner.
              </p>
            </div>

            {/* Error */}
            {error && (
              <div className="error-box">{error}</div>
            )}

            {/* Submit — disabled when closed, loading, or still checking */}
            <button
              className="btn-primary"
              onClick={handleRegister}
              disabled={loading || registrationOpen === false || registrationOpen === null}
            >
              {registrationOpen === null
                ? <><div className="spinner" /> Checking...</>
                : loading
                  ? <><div className="spinner" /> Creating account...</>
                  : registrationOpen === false
                    ? 'Registration closed'
                    : 'Create account'
              }
            </button>

            {/* Footer */}
            <div className="form-footer">
              Already have an account?{' '}
              <a onClick={() => router.push('/login')}>Sign in</a>
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

        {/* ── Dark panel (right) ── */}
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

          {/* Copy */}
          <div className="left-mid">
            <div className="left-eyebrow">Join ExpenseFlow</div>
            <h2 className="left-headline">
              Your money,<br />
              <span className="dim">finally under</span><br />
              control.
            </h2>
            <p className="left-sub">
              Set up in seconds. Start tracking expenses, income, and savings goals with full clarity — completely free.
            </p>
            <div className="left-features">
              {steps.map(f => (
                <div key={f} className="left-feature-item">
                  <div className="left-feature-dot" />
                  {f}
                </div>
              ))}
            </div>
          </div>

          {/* Stats */}
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

      </div>
    </>
  )
}

/* ─── Styles ─── */
const baseStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    font-family: 'Sora', sans-serif;
    background: #ffffff;
    color: #111110;
  }

  .register-root {
    min-height: 100vh;
    display: grid;
    grid-template-columns: 1fr 1fr;
  }

  /* ── Dark panel ── */
  .left-panel {
    background: #111110;
    position: relative; overflow: hidden;
    display: flex; flex-direction: column;
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
    background-size: 48px 48px; pointer-events: none;
  }
  .left-glow {
    position: absolute; width: 500px; height: 500px; border-radius: 50%;
    background: radial-gradient(circle, rgba(255,255,255,0.06) 0%, transparent 65%);
    top: -100px; left: -100px; pointer-events: none;
  }
  .left-glow-2 {
    position: absolute; width: 300px; height: 300px; border-radius: 50%;
    background: radial-gradient(circle, rgba(255,255,255,0.04) 0%, transparent 70%);
    bottom: 60px; right: -60px; pointer-events: none;
  }
  .left-logo {
    display: flex; align-items: center; gap: 10px;
    position: relative; z-index: 1;
    opacity: 0; transform: translateY(-12px);
    animation: fadeSlideDown 0.6s ease 0.1s forwards;
  }
  .left-logo-img {
    width: 36px; height: 36px; border-radius: 10px; object-fit: cover;
    border: 1px solid rgba(255,255,255,0.1);
  }
  .left-logo-fallback {
    width: 36px; height: 36px; border-radius: 10px;
    background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.12);
    display: flex; align-items: center; justify-content: center;
  }
  .left-logo-fallback-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 2.5px; }
  .left-logo-fallback-grid div { width: 7px; height: 7px; border-radius: 2px; }
  .left-logo-name { font-size: 16px; font-weight: 700; color: #ffffff; letter-spacing: -0.02em; }
  .left-mid {
    position: relative; z-index: 1;
    opacity: 0; transform: translateY(20px);
    animation: fadeSlideUp 0.7s ease 0.3s forwards;
  }
  .left-eyebrow {
    font-family: 'DM Mono', monospace; font-size: 10px; font-weight: 500;
    letter-spacing: 0.22em; text-transform: uppercase;
    color: rgba(255,255,255,0.3); margin-bottom: 20px;
    display: flex; align-items: center; gap: 10px;
  }
  .left-eyebrow::before { content: ''; width: 28px; height: 1px; background: rgba(255,255,255,0.2); }
  .left-headline {
    font-size: clamp(36px, 3.5vw, 52px); font-weight: 800; line-height: 1.05;
    letter-spacing: -0.04em; color: #ffffff; margin-bottom: 20px;
  }
  .left-headline .dim { color: rgba(255,255,255,0.25); }
  .left-sub {
    font-size: 14px; font-weight: 300; color: rgba(255,255,255,0.45);
    line-height: 1.7; max-width: 320px; margin-bottom: 28px;
  }
  .left-features { display: flex; flex-direction: column; gap: 10px; }
  .left-feature-item {
    display: flex; align-items: center; gap: 10px;
    font-size: 12px; color: rgba(255,255,255,0.4);
  }
  .left-feature-dot {
    width: 5px; height: 5px; border-radius: 50%;
    background: rgba(255,255,255,0.2); flex-shrink: 0;
  }
  .left-bottom { position: relative; z-index: 1; }
  .left-divider { width: 32px; height: 1px; background: rgba(255,255,255,0.1); margin-bottom: 24px; }
  .left-stats { display: flex; gap: 32px; opacity: 0; animation: fadeIn 0.7s ease 0.55s forwards; }
  .left-stat-num {
    font-size: 26px; font-weight: 800; letter-spacing: -0.04em;
    color: #ffffff; line-height: 1; margin-bottom: 4px;
  }
  .left-stat-lbl { font-size: 10px; color: rgba(255,255,255,0.3); text-transform: uppercase; letter-spacing: 0.1em; }

  /* ── Form panel ── */
  .right-panel {
    background: #ffffff;
    display: flex; align-items: center; justify-content: center;
    padding: 48px; position: relative; overflow-y: auto;
  }
  .right-panel::before {
    content: ''; position: absolute; inset: 0;
    background-image: radial-gradient(circle, #e4e3de 1px, transparent 1px);
    background-size: 28px 28px; opacity: 0.4; pointer-events: none;
  }
  .right-back {
    position: absolute; top: 28px; left: 28px;
    display: flex; align-items: center; gap: 6px;
    font-size: 12px; font-weight: 500; color: #8a8980; cursor: pointer;
    z-index: 2; background: none; border: none;
    font-family: 'Sora', sans-serif; transition: color 0.2s;
  }
  .right-back:hover { color: #111110; }
  .right-back svg { transition: transform 0.2s; }
  .right-back:hover svg { transform: translateX(-3px); }

  .form-wrap {
    width: 100%; max-width: 380px;
    opacity: 0; transform: translateY(16px);
    animation: fadeSlideUp 0.65s ease 0.2s forwards;
    position: relative; z-index: 1; padding: 8px 0;
  }
  .form-logo { display: flex; align-items: center; gap: 9px; margin-bottom: 28px; }
  .form-logo-img { width: 32px; height: 32px; border-radius: 9px; object-fit: cover; border: 1px solid #e4e3de; }
  .form-logo-fallback {
    width: 32px; height: 32px; border-radius: 9px; background: #111110;
    display: flex; align-items: center; justify-content: center;
  }
  .form-logo-fallback-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 2.5px; }
  .form-logo-fallback-grid div { width: 6px; height: 6px; border-radius: 1.5px; }
  .form-logo-name { font-size: 14px; font-weight: 700; color: #111110; letter-spacing: -0.02em; }
  .form-title { font-size: 26px; font-weight: 800; letter-spacing: -0.04em; color: #111110; margin-bottom: 6px; }
  .form-sub { font-size: 13px; font-weight: 300; color: #8a8980; margin-bottom: 20px; line-height: 1.6; }

  /* ── Closed banner ── */
  .closed-banner {
    display: flex; align-items: flex-start; gap: 10px;
    background: #f8f8f6; border: 1.5px solid #e4e3de;
    border-radius: 12px; padding: 12px 14px; margin-bottom: 18px;
  }
  .closed-banner-icon {
    width: 26px; height: 26px; background: #111110; border-radius: 7px;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0; margin-top: 1px;
  }
  .closed-banner-title { font-size: 12px; font-weight: 700; color: #111110; margin-bottom: 3px; }
  .closed-banner-sub { font-size: 11px; color: #8a8980; line-height: 1.5; }

  /* ── Fields ── */
  .field-group { display: flex; flex-direction: column; gap: 14px; margin-bottom: 18px; }
  .field-label {
    display: block; font-size: 11px; font-weight: 600; color: #5a5950;
    text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 6px;
  }
  .field-input {
    width: 100%; border: 1.5px solid #e4e3de; border-radius: 10px;
    padding: 11px 14px; font-family: 'Sora', sans-serif;
    font-size: 14px; color: #111110; background: #ffffff; outline: none;
    transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
  }
  .field-input:hover:not(:disabled) { border-color: #c8c7c0; background: #f8f8f6; }
  .field-input:focus { border-color: #111110; box-shadow: 0 0 0 3px rgba(0,0,0,0.06); background: #ffffff; }
  .field-input::placeholder { color: #c8c7c0; }
  .field-input:disabled { background: #f8f8f6; color: #c8c7c0; cursor: not-allowed; }

  .field-pass-wrap { position: relative; }
  .field-pass-eye {
    position: absolute; right: 14px; top: 50%; transform: translateY(-50%);
    background: none; border: none; color: #c8c7c0; cursor: pointer;
    padding: 2px; border-radius: 4px; display: flex; transition: color 0.2s;
  }
  .field-pass-eye:hover:not(:disabled) { color: #111110; }
  .field-pass-eye:disabled { cursor: not-allowed; }

  .error-box {
    background: #fff5f5; border: 1.5px solid #fecaca;
    border-radius: 10px; padding: 10px 14px;
    margin-bottom: 16px; font-size: 12px; color: #dc2626;
  }

  .btn-primary {
    width: 100%; background: #111110; color: #ffffff;
    border: none; border-radius: 10px; padding: 13px 20px;
    font-family: 'Sora', sans-serif; font-size: 14px; font-weight: 600;
    letter-spacing: -0.01em; cursor: pointer; transition: all 0.2s;
    display: flex; align-items: center; justify-content: center; gap: 8px;
  }
  .btn-primary:hover:not(:disabled) {
    background: #1e1d1b; transform: translateY(-1px);
    box-shadow: 0 6px 20px rgba(0,0,0,0.18);
  }
  .btn-primary:active:not(:disabled) { transform: translateY(0); box-shadow: none; }
  .btn-primary:disabled { opacity: 0.45; cursor: not-allowed; }

  .form-footer { text-align: center; margin-top: 20px; font-size: 12px; color: #8a8980; }
  .form-footer a {
    color: #111110; font-weight: 600; text-decoration: none;
    border-bottom: 1px solid #e4e3de; padding-bottom: 1px;
    transition: border-color 0.2s; cursor: pointer;
  }
  .form-footer a:hover { border-color: #111110; }

  .trust-badge {
    display: flex; align-items: center; justify-content: center;
    gap: 6px; margin-top: 16px; font-size: 11px; color: #c8c7c0;
  }
  .trust-dot { width: 4px; height: 4px; border-radius: 50%; background: #e4e3de; }

  .spinner {
    width: 16px; height: 16px;
    border: 2px solid rgba(255,255,255,0.3);
    border-top-color: #ffffff; border-radius: 50%;
    animation: spin 0.7s linear infinite; flex-shrink: 0;
  }

  @keyframes fadeSlideUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes fadeSlideDown { from { opacity: 0; transform: translateY(-12px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  @keyframes spin { to { transform: rotate(360deg); } }

  @media (max-width: 768px) {
    .register-root { grid-template-columns: 1fr; }
    .left-panel { display: none; }
    .right-panel { padding: 32px 24px; align-items: flex-start; padding-top: 72px; }
    .right-back { top: 20px; left: 20px; }
  }
`