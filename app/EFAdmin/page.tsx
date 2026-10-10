'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Shield, LogOut, Users, ToggleLeft, ToggleRight, AlertTriangle, Check } from 'lucide-react'

// The admin password is checked inside Supabase (admin_check / admin_set_registration
// in supabase/admin-registration.sql), so it never ships in the browser bundle.

export default function AdminPage() {
  const [authed, setAuthed]             = useState(false)
  const [pass, setPass]                 = useState('')
  const [passError, setPassError]       = useState('')
  const [checking, setChecking]         = useState(false)
  const [regEnabled, setRegEnabled]     = useState<boolean | null>(null)
  const [userCount, setUserCount]       = useState<number | null>(null)
  const [toggling, setToggling]         = useState(false)
  const [savedMsg, setSavedMsg]         = useState('')
  const [loading, setLoading]           = useState(false)

  useEffect(() => {
    if (authed) fetchData()
  }, [authed])

  const fetchData = async () => {
    setLoading(true)
    // Fetch registration setting
    const { data: setting } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'registration_enabled')
      .single()

    if (setting) setRegEnabled(setting.value === 'true')

    // Fetch user count from auth (uses admin API via supabase)
    const { count } = await supabase
      .from('expenses')
      .select('user_id', { count: 'exact', head: true })

    setUserCount(count ?? null)
    setLoading(false)
  }

  const handleLogin = async () => {
    if (!pass || checking) return
    setChecking(true)
    const { data, error } = await supabase.rpc('admin_check', { p_pass: pass })
    setChecking(false)

    if (error) {
      setPassError('Admin setup missing. Run supabase/admin-registration.sql in Supabase.')
    } else if (data === true) {
      // Keep the password in memory; every toggle re-sends it for the database to check
      setAuthed(true)
      setPassError('')
    } else {
      setPassError('Incorrect password.')
      setPass('')
    }
  }

  const handleSignOut = () => {
    setAuthed(false)
    setPass('')
  }

  const handleToggle = async () => {
    if (regEnabled === null) return
    setToggling(true)
    const newVal = !regEnabled

    const { data, error } = await supabase.rpc('admin_set_registration', {
      p_pass: pass,
      p_enabled: newVal,
    })

    if (!error && data === true) {
      setRegEnabled(newVal)
      setSavedMsg(newVal ? 'Registration opened' : 'Registration closed')
    } else {
      setSavedMsg('Not saved. Please try again.')
    }
    setTimeout(() => setSavedMsg(''), 4000)
    setToggling(false)
  }

  /* ── Password gate ── */
  if (!authed) {
    return (
      <>
        <style>{styles}</style>
        <div className="efa-root">
          <div className="efa-bg-dots" />
          <div className="efa-gate">
            <div className="efa-gate-icon">
              <Shield size={22} color="white" strokeWidth={2} />
            </div>
            <h1 className="efa-gate-title">Admin access</h1>
            <p className="efa-gate-sub">ExpenseFlow · Private area</p>

            <div className="efa-gate-field">
              <input
                className="efa-input"
                type="password"
                placeholder="Enter admin password"
                value={pass}
                onChange={e => setPass(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                autoFocus
              />
            </div>

            {passError && (
              <div className="efa-gate-error">
                <AlertTriangle size={13} />
                {passError}
              </div>
            )}

            <button className="efa-btn-primary" onClick={handleLogin} disabled={checking}>
              {checking ? 'Checking...' : 'Enter'}
            </button>
          </div>
        </div>
      </>
    )
  }

  /* ── Admin dashboard ── */
  return (
    <>
      <style>{styles}</style>
      <div className="efa-root">
        <div className="efa-bg-dots" />

        <div className="efa-dashboard">

          {/* Header */}
          <div className="efa-header">
            <div className="efa-header-left">
              <div className="efa-header-icon">
                <Shield size={16} color="white" strokeWidth={2} />
              </div>
              <div>
                <h1 className="efa-header-title">ExpenseFlow Admin</h1>
                <p className="efa-header-sub">Registration control panel</p>
              </div>
            </div>
            <button className="efa-logout" onClick={handleSignOut}>
              <LogOut size={14} />
              Sign out
            </button>
          </div>

          {/* Status card */}
          <div className={`efa-status-card ${regEnabled ? 'open' : 'closed'}`}>
            <div className="efa-status-left">
              <div className={`efa-status-dot ${regEnabled ? 'active' : ''}`} />
              <div>
                <p className="efa-status-title">
                  {regEnabled === null
                    ? 'Loading...'
                    : regEnabled
                      ? 'Registration is open'
                      : 'Registration is closed'
                  }
                </p>
                <p className="efa-status-sub">
                  {regEnabled
                    ? 'Anyone can create an account right now'
                    : 'New signups are blocked — users see a closed message'
                  }
                </p>
              </div>
            </div>
          </div>

          {/* Main toggle card */}
          <div className="efa-card">
            <div className="efa-card-row">
              <div className="efa-card-info">
                <p className="efa-card-label">Public registration</p>
                <p className="efa-card-desc">
                  {regEnabled
                    ? 'Turn off to block new signups. Existing users are unaffected.'
                    : 'Turn on to allow new users to register.'
                  }
                </p>
              </div>

              {/* Toggle switch */}
              <button
                className={`efa-toggle ${regEnabled ? 'on' : 'off'} ${toggling ? 'loading' : ''}`}
                onClick={handleToggle}
                disabled={toggling || regEnabled === null}
              >
                <div className="efa-toggle-thumb" />
              </button>
            </div>

            {/* Saved confirmation */}
            {savedMsg && (
              <div className={`efa-saved ${regEnabled ? 'green' : 'gray'}`}>
                <Check size={13} />
                {savedMsg}
              </div>
            )}
          </div>

          {/* Info cards row */}
          <div className="efa-info-row">
            <div className="efa-info-card">
              <div className="efa-info-icon">
                <Users size={15} />
              </div>
              <p className="efa-info-label">Active data</p>
              <p className="efa-info-val">
                {loading ? '—' : userCount !== null ? `${userCount} records` : 'N/A'}
              </p>
            </div>

            <div className="efa-info-card">
              <div className="efa-info-icon">
                <Shield size={15} />
              </div>
              <p className="efa-info-label">Access</p>
              <p className="efa-info-val">Password protected</p>
            </div>

            <div className="efa-info-card">
              <div className={`efa-info-icon ${regEnabled ? 'green' : ''}`}>
                {regEnabled ? <ToggleRight size={15} /> : <ToggleLeft size={15} />}
              </div>
              <p className="efa-info-label">Signups</p>
              <p className={`efa-info-val ${regEnabled ? 'green' : ''}`}>
                {regEnabled === null ? '—' : regEnabled ? 'Enabled' : 'Disabled'}
              </p>
            </div>
          </div>

          {/* Instruction box */}
          <div className="efa-instruction">
            <p className="efa-instruction-title">How to use</p>
            <div className="efa-instruction-steps">
              <div className="efa-instruction-step">
                <div className="efa-instruction-num">1</div>
                <p>Friend wants to join → they message you</p>
              </div>
              <div className="efa-instruction-step">
                <div className="efa-instruction-num">2</div>
                <p>You open this page and flip the toggle ON</p>
              </div>
              <div className="efa-instruction-step">
                <div className="efa-instruction-num">3</div>
                <p>Friend registers at <span className="mono">/register</span></p>
              </div>
              <div className="efa-instruction-step">
                <div className="efa-instruction-num">4</div>
                <p>You flip the toggle OFF immediately after</p>
              </div>
            </div>
          </div>

          <p className="efa-footer">ExpenseFlow · Admin · {new Date().getFullYear()}</p>
        </div>
      </div>
    </>
  )
}

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Sora', sans-serif; background: #f8f8f6; color: #111110; }

  .efa-root {
    min-height: 100vh;
    display: flex; align-items: center; justify-content: center;
    padding: 40px 20px; position: relative;
  }
  .efa-bg-dots {
    position: fixed; inset: 0;
    background-image: radial-gradient(circle, #d4d3cc 1px, transparent 1px);
    background-size: 28px 28px; opacity: 0.5;
    pointer-events: none; z-index: 0;
  }

  /* ── Gate ── */
  .efa-gate {
    width: 100%; max-width: 340px;
    background: #ffffff;
    border: 1.5px solid #e4e3de;
    border-radius: 20px; padding: 36px;
    text-align: center;
    box-shadow: 0 4px 32px rgba(0,0,0,0.07);
    position: relative; z-index: 1;
    animation: efaFadeUp 0.5s ease both;
  }
  .efa-gate-icon {
    width: 48px; height: 48px; background: #111110;
    border-radius: 14px;
    display: flex; align-items: center; justify-content: center;
    margin: 0 auto 16px;
  }
  .efa-gate-title {
    font-size: 20px; font-weight: 800;
    letter-spacing: -0.04em; color: #111110; margin-bottom: 4px;
  }
  .efa-gate-sub {
    font-size: 12px; color: #8a8980; margin-bottom: 24px;
  }
  .efa-gate-field { margin-bottom: 10px; }
  .efa-gate-error {
    display: flex; align-items: center; justify-content: center; gap: 6px;
    font-size: 12px; color: #dc2626;
    background: #fff5f5; border: 1px solid #fecaca;
    border-radius: 8px; padding: 8px 12px; margin-bottom: 12px;
  }

  /* ── Dashboard ── */
  .efa-dashboard {
    width: 100%; max-width: 520px;
    position: relative; z-index: 1;
    animation: efaFadeUp 0.5s ease both;
    display: flex; flex-direction: column; gap: 12px;
  }
  .efa-header {
    background: #111110;
    border-radius: 16px; padding: 20px 24px;
    display: flex; align-items: center; justify-content: space-between;
  }
  .efa-header-left { display: flex; align-items: center; gap: 12px; }
  .efa-header-icon {
    width: 36px; height: 36px;
    background: rgba(255,255,255,0.1);
    border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
  }
  .efa-header-title {
    font-size: 15px; font-weight: 700;
    color: #ffffff; letter-spacing: -0.02em;
  }
  .efa-header-sub { font-size: 11px; color: rgba(255,255,255,0.4); margin-top: 1px; }
  .efa-logout {
    display: flex; align-items: center; gap: 6px;
    background: rgba(255,255,255,0.08);
    border: 1px solid rgba(255,255,255,0.12);
    border-radius: 8px; padding: 7px 12px;
    font-family: 'Sora', sans-serif;
    font-size: 12px; font-weight: 500; color: rgba(255,255,255,0.6);
    cursor: pointer; transition: all 0.2s;
  }
  .efa-logout:hover { background: rgba(255,255,255,0.14); color: white; }

  /* Status card */
  .efa-status-card {
    border-radius: 14px; padding: 16px 20px;
    display: flex; align-items: center; justify-content: space-between;
    border: 1.5px solid;
    transition: all 0.3s;
  }
  .efa-status-card.open { background: #f0fdf4; border-color: #bbf7d0; }
  .efa-status-card.closed { background: #fafaf8; border-color: #e4e3de; }
  .efa-status-left { display: flex; align-items: center; gap: 12px; }
  .efa-status-dot {
    width: 10px; height: 10px; border-radius: 50%;
    background: #d1d0c8; flex-shrink: 0;
    transition: background 0.3s;
  }
  .efa-status-dot.active {
    background: #22c55e;
    box-shadow: 0 0 0 3px rgba(34,197,94,0.2);
    animation: efaPulse 2s ease-in-out infinite;
  }
  .efa-status-title {
    font-size: 14px; font-weight: 700; color: #111110; margin-bottom: 2px;
  }
  .efa-status-sub { font-size: 12px; color: #8a8980; line-height: 1.5; }

  /* Main toggle card */
  .efa-card {
    background: #ffffff;
    border: 1.5px solid #e4e3de;
    border-radius: 16px; padding: 20px 24px;
  }
  .efa-card-row {
    display: flex; align-items: center; justify-content: space-between; gap: 16px;
  }
  .efa-card-info { flex: 1; }
  .efa-card-label {
    font-size: 14px; font-weight: 700; color: #111110; margin-bottom: 4px;
  }
  .efa-card-desc { font-size: 12px; color: #8a8980; line-height: 1.5; }

  /* Toggle switch */
  .efa-toggle {
    width: 52px; height: 28px;
    border-radius: 14px; border: none;
    cursor: pointer; position: relative;
    flex-shrink: 0;
    transition: background 0.3s;
  }
  .efa-toggle.on { background: #111110; }
  .efa-toggle.off { background: #d1d0c8; }
  .efa-toggle.loading { opacity: 0.6; cursor: not-allowed; }
  .efa-toggle-thumb {
    width: 22px; height: 22px;
    border-radius: 50%; background: #ffffff;
    position: absolute; top: 3px;
    box-shadow: 0 1px 4px rgba(0,0,0,0.2);
    transition: left 0.3s;
  }
  .efa-toggle.on .efa-toggle-thumb { left: 27px; }
  .efa-toggle.off .efa-toggle-thumb { left: 3px; }

  .efa-saved {
    display: flex; align-items: center; gap: 6px;
    font-size: 12px; font-weight: 500;
    margin-top: 14px; padding: 8px 12px;
    border-radius: 8px;
    animation: efaFadeUp 0.3s ease;
  }
  .efa-saved.green { background: #f0fdf4; color: #16a34a; }
  .efa-saved.gray { background: #f8f8f6; color: #5a5950; }

  /* Info row */
  .efa-info-row {
    display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px;
  }
  .efa-info-card {
    background: #ffffff;
    border: 1.5px solid #e4e3de;
    border-radius: 14px; padding: 16px;
  }
  .efa-info-icon {
    width: 30px; height: 30px;
    background: #f8f8f6; border-radius: 8px;
    display: flex; align-items: center; justify-content: center;
    color: #8a8980; margin-bottom: 10px;
    transition: all 0.2s;
  }
  .efa-info-icon.green { background: #f0fdf4; color: #16a34a; }
  .efa-info-label {
    font-size: 10px; font-weight: 600; color: #a8a89a;
    text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 4px;
  }
  .efa-info-val { font-size: 13px; font-weight: 600; color: #111110; }
  .efa-info-val.green { color: #16a34a; }

  /* Instructions */
  .efa-instruction {
    background: #ffffff;
    border: 1.5px solid #e4e3de;
    border-radius: 16px; padding: 20px 24px;
  }
  .efa-instruction-title {
    font-size: 12px; font-weight: 700; color: #111110;
    text-transform: uppercase; letter-spacing: 0.08em;
    margin-bottom: 14px;
  }
  .efa-instruction-steps { display: flex; flex-direction: column; gap: 10px; }
  .efa-instruction-step {
    display: flex; align-items: center; gap: 12px;
    font-size: 13px; color: #5a5950;
  }
  .efa-instruction-num {
    width: 22px; height: 22px;
    background: #f8f8f6; border: 1px solid #e4e3de;
    border-radius: 6px;
    display: flex; align-items: center; justify-content: center;
    font-size: 11px; font-weight: 700; color: #8a8980;
    flex-shrink: 0;
  }
  .mono {
    font-family: 'DM Mono', monospace;
    font-size: 12px; background: #f8f8f6;
    border: 1px solid #e4e3de; border-radius: 4px;
    padding: 1px 6px; color: #5a5950;
  }

  .efa-footer {
    text-align: center; font-size: 11px; color: #c8c7c0;
    font-family: 'DM Mono', monospace; letter-spacing: 0.06em;
    margin-top: 4px;
  }

  /* ── Shared ── */
  .efa-input {
    width: 100%;
    border: 1.5px solid #e4e3de; border-radius: 10px;
    padding: 11px 14px;
    font-family: 'Sora', sans-serif;
    font-size: 14px; color: #111110;
    background: #ffffff; outline: none;
    text-align: center;
    transition: border-color 0.2s, box-shadow 0.2s;
  }
  .efa-input:focus { border-color: #111110; box-shadow: 0 0 0 3px rgba(0,0,0,0.06); }
  .efa-input::placeholder { color: #c8c7c0; }

  .efa-btn-primary {
    width: 100%;
    background: #111110; color: #ffffff;
    border: none; border-radius: 10px;
    padding: 13px 20px;
    font-family: 'Sora', sans-serif;
    font-size: 14px; font-weight: 600;
    cursor: pointer; transition: all 0.2s;
  }
  .efa-btn-primary:hover {
    background: #1e1d1b;
    transform: translateY(-1px);
    box-shadow: 0 6px 20px rgba(0,0,0,0.18);
  }

  @keyframes efaFadeUp {
    from { opacity: 0; transform: translateY(14px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes efaPulse {
    0%, 100% { box-shadow: 0 0 0 3px rgba(34,197,94,0.2); }
    50%       { box-shadow: 0 0 0 6px rgba(34,197,94,0.08); }
  }

  @media (max-width: 520px) {
    .efa-info-row { grid-template-columns: 1fr 1fr; }
    .efa-header { flex-direction: column; gap: 12px; align-items: flex-start; }
  }
`