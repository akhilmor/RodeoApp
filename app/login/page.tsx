'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff } from 'lucide-react'

const ROLES = [
  { value: 'audience', label: 'Attendee', desc: 'Watching the show' },
  { value: 'captain', label: 'Captain', desc: 'Competing team captain' },
  { value: 'liaison', label: 'Liaison', desc: 'Team point of contact' },
  { value: 'volunteer', label: 'Volunteer', desc: 'Helping run the event' },
  { value: 'admin', label: 'Board', desc: 'Full operations access' },
]

function redirectForRole(role: string) {
  if (role === 'admin') return '/dashboard'
  if (['liaison', 'volunteer'].includes(role)) return '/dashboard/logistics'
  if (role === 'captain') return '/dancer'
  return '/portal'
}

const inp = {
  width: '100%',
  background: '#1a1a24',
  border: '1px solid #2a2a3a',
  borderRadius: 10,
  padding: '10px 14px',
  color: '#e2e8f0',
  fontSize: 14,
  outline: 'none',
} as React.CSSProperties

function PasswordInput({ value, onChange, placeholder, required, minLength }: {
  value: string; onChange: (v: string) => void
  placeholder?: string; required?: boolean; minLength?: number
}) {
  const [show, setShow] = useState(false)
  return (
    <div style={{ position: 'relative' }}>
      <input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        minLength={minLength}
        style={{ ...inp, paddingRight: 40 }}
      />
      <button
        type="button"
        onClick={() => setShow(s => !s)}
        style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#4b5563', padding: 0 }}
      >
        {show ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  )
}

export default function LoginPage() {
  const [tab, setTab] = useState<'signin' | 'signup' | 'forgot'>('signin')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [forgotEmail, setForgotEmail] = useState('')
  const [form, setForm] = useState({ first_name: '', last_name: '', email: '', password: '', confirm: '', role_type: 'audience', team_id: '' })
  const [teams, setTeams] = useState<{ id: string; name: string }[]>([])

  useEffect(() => {
    fetch('/api/dashboard/teams').then(r => r.json()).then(data => setTeams(Array.isArray(data) ? data : []))
  }, [])

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError(error.message); setLoading(false); return }
    const res = await fetch('/api/auth/role')
    const { role } = await res.json()
    router.push(redirectForRole(role || 'audience'))
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    if (form.password !== form.confirm) { setError('Passwords do not match'); setLoading(false); return }
    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ first_name: form.first_name, last_name: form.last_name, email: form.email, password: form.password, role_type: form.role_type, team_id: form.team_id || null }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error); setLoading(false); return }
    const { error: signInErr } = await supabase.auth.signInWithPassword({ email: form.email, password: form.password })
    if (signInErr) { setError(signInErr.message); setLoading(false); return }
    router.push(redirectForRole(form.role_type))
  }

  async function handleForgot(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError(''); setSuccess('')
    const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, { redirectTo: `${window.location.origin}/reset-password` })
    setLoading(false)
    if (error) { setError(error.message); return }
    setSuccess('Check your email for a password reset link.')
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 16px', fontFamily: 'system-ui,sans-serif' }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Link href="/" style={{ color: '#4b5563', fontSize: 13, textDecoration: 'none', display: 'block', marginBottom: 20 }}>← Back</Link>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
            <div style={{
              width: 56, height: 56, borderRadius: 16, background: '#f5c518',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 30px rgba(245,197,24,0.4)',
            }}>
              <svg viewBox="0 0 24 16" fill="none" width="34" height="22">
                <path d="M12 2C10 2 8.5 3.5 8 5C6 4 3.5 4.5 2 6C3 6 4 6.5 4.5 7.5C3 8 2 9 2 10C3.5 9.5 5 9.5 6 10C6.5 11 7.5 12 9 12.5C9.5 11.5 10.5 11 12 11C13.5 11 14.5 11.5 15 12.5C16.5 12 17.5 11 18 10C19 9.5 20.5 9.5 22 10C22 9 21 8 19.5 7.5C20 6.5 21 6 22 6C20.5 4.5 18 4 16 5C15.5 3.5 14 2 12 2Z" fill="#0a0a0f"/>
              </svg>
            </div>
          </div>
          <p style={{ color: '#f5c518', letterSpacing: '0.3em', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', margin: '0 0 6px' }}>A Night in Gotham</p>
          <h1 style={{ color: '#f1f5f9', fontSize: 22, fontWeight: 900, margin: 0, letterSpacing: '-0.01em' }}>Raas Rodeo 2026</h1>
        </div>

        {/* Card */}
        <div style={{ background: '#16161f', border: '1px solid #2a2a3a', borderRadius: 20, overflow: 'hidden' }}>
          {tab !== 'forgot' && (
            <div style={{ display: 'flex', borderBottom: '1px solid #2a2a3a' }}>
              {(['signin', 'signup'] as const).map(t => (
                <button key={t} onClick={() => { setTab(t); setError('') }} style={{
                  flex: 1, padding: '14px 0', fontSize: 13, fontWeight: 700,
                  background: tab === t ? '#22222e' : 'transparent',
                  color: tab === t ? '#f1f5f9' : '#4b5563',
                  border: 'none', cursor: 'pointer',
                  borderBottom: tab === t ? '2px solid #f5c518' : '2px solid transparent',
                  transition: 'all 0.15s',
                }}>
                  {t === 'signin' ? 'Sign In' : 'Create Account'}
                </button>
              ))}
            </div>
          )}

          <div style={{ padding: 28 }}>
            {tab === 'signin' && (
              <form onSubmit={handleSignIn} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <Field label="Email">
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} required autoFocus style={inp} />
                </Field>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <label style={{ fontSize: 13, color: '#6b7280' }}>Password</label>
                    <button type="button" onClick={() => { setTab('forgot'); setForgotEmail(email); setError('') }}
                      style={{ background: 'none', border: 'none', color: '#f5c518', fontSize: 12, cursor: 'pointer', padding: 0 }}>
                      Forgot password?
                    </button>
                  </div>
                  <PasswordInput value={password} onChange={setPassword} required />
                </div>
                {error && <p style={{ color: '#ef4444', fontSize: 13, margin: 0 }}>{error}</p>}
                <GoldButton loading={loading} label="Sign In" loadingLabel="Signing in..." />
              </form>
            )}

            {tab === 'signup' && (
              <form onSubmit={handleSignUp} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <Field label="First Name">
                    <input value={form.first_name} onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))} required style={inp} />
                  </Field>
                  <Field label="Last Name">
                    <input value={form.last_name} onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))} required style={inp} />
                  </Field>
                </div>
                <Field label="Email">
                  <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required style={inp} />
                </Field>
                <Field label="Password">
                  <PasswordInput value={form.password} onChange={v => setForm(f => ({ ...f, password: v }))} required minLength={6} />
                </Field>
                <Field label="Confirm Password">
                  <PasswordInput value={form.confirm} onChange={v => setForm(f => ({ ...f, confirm: v }))} required />
                </Field>
                <div>
                  <p style={{ fontSize: 13, color: '#6b7280', margin: '0 0 8px' }}>I am a...</p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    {ROLES.map(r => (
                      <button key={r.value} type="button" onClick={() => setForm(f => ({ ...f, role_type: r.value }))} style={{
                        textAlign: 'left', padding: '10px 12px', borderRadius: 12,
                        border: `1px solid ${form.role_type === r.value ? '#f5c518' : '#2a2a3a'}`,
                        background: form.role_type === r.value ? 'rgba(245,197,24,0.08)' : 'transparent',
                        cursor: 'pointer', transition: 'all 0.15s',
                      }}>
                        <p style={{ fontWeight: 700, fontSize: 13, color: form.role_type === r.value ? '#f5c518' : '#e2e8f0', margin: '0 0 2px' }}>{r.label}</p>
                        <p style={{ fontSize: 11, color: '#4b5563', margin: 0 }}>{r.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>
                {['captain', 'liaison'].includes(form.role_type) && (
                  <Field label="Team">
                    <select value={form.team_id} onChange={e => setForm(f => ({ ...f, team_id: e.target.value }))} required style={inp}>
                      <option value="">Select your team...</option>
                      {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                  </Field>
                )}
                {error && <p style={{ color: '#ef4444', fontSize: 13, margin: 0 }}>{error}</p>}
                <GoldButton loading={loading} label="Create Account" loadingLabel="Creating account..." />
              </form>
            )}

            {tab === 'forgot' && (
              <div>
                <button onClick={() => { setTab('signin'); setError(''); setSuccess('') }}
                  style={{ background: 'none', border: 'none', color: '#4b5563', fontSize: 13, cursor: 'pointer', padding: 0, marginBottom: 20, display: 'block' }}>
                  ← Back to sign in
                </button>
                <h2 style={{ color: '#f1f5f9', fontSize: 18, fontWeight: 800, margin: '0 0 6px' }}>Reset Password</h2>
                <p style={{ color: '#6b7280', fontSize: 13, margin: '0 0 20px' }}>Enter your email and we&apos;ll send you a reset link.</p>
                <form onSubmit={handleForgot} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <Field label="Email">
                    <input type="email" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} required autoFocus style={inp} />
                  </Field>
                  {error && <p style={{ color: '#ef4444', fontSize: 13, margin: 0 }}>{error}</p>}
                  {success && <p style={{ color: '#4ade80', fontSize: 13, margin: 0 }}>{success}</p>}
                  <GoldButton loading={loading} disabled={!!success} label="Send Reset Link" loadingLabel="Sending..." />
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactElement }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 13, color: '#6b7280', marginBottom: 6 }}>{label}</label>
      {children}
    </div>
  )
}

function GoldButton({ loading, disabled, label, loadingLabel }: { loading: boolean; disabled?: boolean; label: string; loadingLabel: string }) {
  return (
    <button type="submit" disabled={loading || disabled} style={{
      width: '100%',
      background: loading || disabled ? '#2a2a3a' : '#f5c518',
      color: loading || disabled ? '#6b7280' : '#0a0a0f',
      fontWeight: 800, fontSize: 14,
      padding: '13px 0', borderRadius: 12,
      border: 'none', cursor: loading || disabled ? 'not-allowed' : 'pointer',
      transition: 'all 0.15s',
      letterSpacing: '0.02em',
    }}>
      {loading ? loadingLabel : label}
    </button>
  )
}
