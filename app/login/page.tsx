'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff } from 'lucide-react'

const ROLES = [
  { value: 'audience', label: 'Attendee', desc: 'Buying tickets to watch the show' },
  { value: 'captain', label: 'Captain', desc: 'Team captain competing in the show' },
  { value: 'liaison', label: 'Liaison', desc: 'Team liaison / point of contact' },
  { value: 'volunteer', label: 'Volunteer', desc: 'Helping run the event' },
  { value: 'admin', label: 'Board', desc: 'Board-level organizer, full access' },
]

function redirectForRole(role: string) {
  if (role === 'admin') return '/dashboard'
  if (['liaison', 'volunteer'].includes(role)) return '/dashboard/logistics'
  if (role === 'captain') return '/dancer'
  return '/portal'
}

function PasswordInput({ value, onChange, placeholder, required, minLength }: {
  value: string; onChange: (v: string) => void
  placeholder?: string; required?: boolean; minLength?: number
}) {
  const [show, setShow] = useState(false)
  return (
    <div className="relative">
      <input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        minLength={minLength}
        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 pr-10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />
      <button
        type="button"
        onClick={() => setShow(s => !s)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
      >
        {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
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
  const [form, setForm] = useState({
    first_name: '', last_name: '', email: '', password: '', confirm: '', role_type: 'audience', team_id: '',
  })
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
    const appUrl = window.location.origin
    const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
      redirectTo: `${appUrl}/reset-password`,
    })
    setLoading(false)
    if (error) { setError(error.message); return }
    setSuccess('Check your email for a password reset link.')
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="text-gray-500 hover:text-gray-400 text-sm">← Back</Link>
          <h1 className="text-3xl font-black text-white mt-3">Raas Rodeo</h1>
        </div>

        <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
          {tab !== 'forgot' && (
            <div className="flex border-b border-gray-800">
              {(['signin', 'signup'] as const).map(t => (
                <button key={t} onClick={() => { setTab(t); setError('') }}
                  className={`flex-1 py-3.5 text-sm font-semibold transition-colors ${tab === t ? 'bg-gray-800 text-white' : 'text-gray-500 hover:text-gray-300'}`}>
                  {t === 'signin' ? 'Sign In' : 'Create Account'}
                </button>
              ))}
            </div>
          )}

          <div className="p-8">
            {tab === 'signin' && (
              <form onSubmit={handleSignIn} className="space-y-4">
                <Field label="Email">
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} required autoFocus
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </Field>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-sm text-gray-400">Password</label>
                    <button type="button" onClick={() => { setTab('forgot'); setForgotEmail(email); setError('') }}
                      className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
                      Forgot password?
                    </button>
                  </div>
                  <PasswordInput value={password} onChange={setPassword} required />
                </div>
                {error && <p className="text-red-400 text-sm">{error}</p>}
                <button type="submit" disabled={loading}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold py-3 rounded-xl text-sm transition-colors">
                  {loading ? 'Signing in...' : 'Sign In'}
                </button>
              </form>
            )}

            {tab === 'signup' && (
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <Field label="First Name">
                    <input value={form.first_name} onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))} required
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  </Field>
                  <Field label="Last Name">
                    <input value={form.last_name} onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))} required
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  </Field>
                </div>
                <Field label="Email">
                  <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </Field>
                <Field label="Password">
                  <PasswordInput value={form.password} onChange={v => setForm(f => ({ ...f, password: v }))} required minLength={6} />
                </Field>
                <Field label="Confirm Password">
                  <PasswordInput value={form.confirm} onChange={v => setForm(f => ({ ...f, confirm: v }))} required />
                </Field>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">I am a...</label>
                  <div className="grid grid-cols-2 gap-2">
                    {ROLES.map(r => (
                      <button key={r.value} type="button" onClick={() => setForm(f => ({ ...f, role_type: r.value }))}
                        className={`text-left p-3 rounded-xl border text-sm transition-colors ${form.role_type === r.value ? 'border-indigo-500 bg-indigo-900/30 text-white' : 'border-gray-700 text-gray-400 hover:border-gray-600'}`}>
                        <p className="font-semibold">{r.label}</p>
                        <p className="text-xs opacity-70 mt-0.5">{r.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>
                {['captain', 'liaison'].includes(form.role_type) && (
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Team</label>
                    <select
                      value={form.team_id}
                      onChange={e => setForm(f => ({ ...f, team_id: e.target.value }))}
                      required
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">Select your team...</option>
                      {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                  </div>
                )}
                {error && <p className="text-red-400 text-sm">{error}</p>}
                <button type="submit" disabled={loading}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold py-3 rounded-xl text-sm transition-colors">
                  {loading ? 'Creating account...' : 'Create Account'}
                </button>
              </form>
            )}

            {tab === 'forgot' && (
              <div>
                <button onClick={() => { setTab('signin'); setError(''); setSuccess('') }}
                  className="text-gray-500 hover:text-gray-300 text-sm mb-5 block">← Back to sign in</button>
                <h2 className="text-white font-bold text-lg mb-1">Reset Password</h2>
                <p className="text-gray-400 text-sm mb-5">Enter your email and we&apos;ll send you a reset link.</p>
                <form onSubmit={handleForgot} className="space-y-4">
                  <Field label="Email">
                    <input type="email" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} required autoFocus
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  </Field>
                  {error && <p className="text-red-400 text-sm">{error}</p>}
                  {success && <p className="text-green-400 text-sm">{success}</p>}
                  <button type="submit" disabled={loading || !!success}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold py-3 rounded-xl text-sm transition-colors">
                    {loading ? 'Sending...' : 'Send Reset Link'}
                  </button>
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
      <label className="block text-sm text-gray-400 mb-1">{label}</label>
      {children}
    </div>
  )
}
