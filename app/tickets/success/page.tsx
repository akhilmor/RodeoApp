import Link from 'next/link'
import { stripe } from '@/lib/stripe'

export default async function SuccessPage({ searchParams }: { searchParams: Promise<{ session_id?: string }> }) {
  const { session_id } = await searchParams
  let customerEmail = ''
  let amountTotal = 0

  if (session_id) {
    try {
      const session = await stripe.checkout.sessions.retrieve(session_id)
      customerEmail = session.customer_email || ''
      amountTotal = session.amount_total || 0
    } catch {
      // session not found
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold mb-3">You&apos;re In!</h1>
        <p className="text-gray-400 text-lg mb-2">Your ticket purchase is confirmed.</p>
        {customerEmail && (
          <p className="text-gray-500 text-sm mb-2">
            Confirmation sent to <span className="text-white">{customerEmail}</span>
          </p>
        )}
        {amountTotal > 0 && (
          <p className="text-green-400 font-bold text-xl mb-8">${(amountTotal / 100).toFixed(2)} paid</p>
        )}
        <p className="text-gray-500 text-sm mb-8">
          Please bring a valid photo ID for ticket pickup at the venue.
          Keep your confirmation email handy.
        </p>
        <Link href="/" className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-8 py-3 rounded-full transition-colors">
          Back to Home
        </Link>
      </div>
    </div>
  )
}
