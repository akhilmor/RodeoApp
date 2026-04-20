'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const TICKET_TYPES = [
  {
    id: 'public',
    label: 'General Admission',
    description: 'Open to all guests. Experience the full show.',
    price: parseInt(process.env.NEXT_PUBLIC_PRICE_PUBLIC || '3500'),
  },
  {
    id: 'ff',
    label: 'Friends & Family',
    description: 'For friends and family of competing teams.',
    price: parseInt(process.env.NEXT_PUBLIC_PRICE_FF || '3000'),
  },
  {
    id: 'competitor',
    label: 'Competitor',
    description: 'For registered competitors only.',
    price: parseInt(process.env.NEXT_PUBLIC_PRICE_COMPETITOR || '2500'),
  },
]

export default function TicketsPage() {
  const router = useRouter()
  const [step, setStep] = useState<'select' | 'info'>('select')
  const [ticketType, setTicketType] = useState('public')
  const [quantity, setQuantity] = useState(1)
  const [form, setForm] = useState({ first_name: '', last_name: '', email: '', phone: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const selected = TICKET_TYPES.find(t => t.id === ticketType)!

  async function handleCheckout() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, ticket_type: ticketType, quantity }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to create checkout')
      window.location.href = data.url
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-2xl mx-auto px-6 py-16">
        <div className="mb-10">
          <a href="/" className="text-indigo-400 text-sm hover:text-indigo-300">← Back to Raas Rodeo</a>
          <h1 className="text-3xl font-bold mt-4">Get Your Tickets</h1>
          <p className="text-gray-400 mt-2">Secure your spot at the most exciting night of Raas.</p>
        </div>

        {step === 'select' && (
          <div className="space-y-6">
            <div className="space-y-3">
              {TICKET_TYPES.map(t => (
                <button
                  key={t.id}
                  onClick={() => setTicketType(t.id)}
                  className={`w-full text-left p-5 rounded-xl border transition-all ${
                    ticketType === t.id
                      ? 'border-indigo-500 bg-indigo-500/10'
                      : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-white">{t.label}</p>
                      <p className="text-gray-400 text-sm mt-0.5">{t.description}</p>
                    </div>
                    <p className="font-bold text-white">${(t.price / 100).toFixed(2)}</p>
                  </div>
                </button>
              ))}
            </div>

            <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-5">
              <label className="block text-sm text-gray-400 mb-2">Quantity</label>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  className="w-9 h-9 rounded-full border border-gray-600 flex items-center justify-center text-white hover:bg-gray-700"
                >−</button>
                <span className="text-2xl font-bold w-8 text-center">{quantity}</span>
                <button
                  onClick={() => setQuantity(q => Math.min(10, q + 1))}
                  className="w-9 h-9 rounded-full border border-gray-600 flex items-center justify-center text-white hover:bg-gray-700"
                >+</button>
              </div>
            </div>

            <div className="flex justify-between items-center py-3">
              <span className="text-gray-400">Total</span>
              <span className="text-2xl font-bold">${((selected.price * quantity) / 100).toFixed(2)}</span>
            </div>

            <button
              onClick={() => setStep('info')}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-4 rounded-xl text-lg transition-colors"
            >
              Continue →
            </button>
          </div>
        )}

        {step === 'info' && (
          <div className="space-y-6">
            <button onClick={() => setStep('select')} className="text-indigo-400 text-sm hover:text-indigo-300">← Change ticket</button>

            <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-5">
              <p className="text-sm text-gray-400">Selected</p>
              <p className="font-semibold">{selected.label} × {quantity}</p>
              <p className="text-indigo-400 font-bold mt-1">${((selected.price * quantity) / 100).toFixed(2)}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">First Name</label>
                <input
                  value={form.first_name}
                  onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Last Name</label>
                <input
                  value={form.last_name}
                  onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm text-gray-400 mb-1">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm text-gray-400 mb-1">Phone</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
            </div>

            {error && <p className="text-red-400 text-sm">{error}</p>}

            <button
              onClick={handleCheckout}
              disabled={loading || !form.first_name || !form.last_name || !form.email || !form.phone}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold py-4 rounded-xl text-lg transition-colors"
            >
              {loading ? 'Redirecting to payment...' : 'Checkout with Stripe →'}
            </button>

            <p className="text-center text-gray-500 text-xs">Secured by Stripe. Your card info never touches our servers.</p>
          </div>
        )}
      </div>
    </div>
  )
}
