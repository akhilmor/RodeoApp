'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'

type ScanResult =
  | { state: 'loading' }
  | { state: 'valid'; person: { first_name: string; last_name: string; email: string }; ticketType: string }
  | { state: 'already_scanned'; person: { first_name: string; last_name: string }; scanned_at: string }
  | { state: 'invalid' }
  | { state: 'confirmed' }

const TYPE_LABELS: Record<string, string> = {
  competitor: 'Competitor',
  ff: 'Friends & Family',
  public: 'General Admission',
}

export default function ScanPage() {
  const { token } = useParams<{ token: string }>()
  const [result, setResult] = useState<ScanResult>({ state: 'loading' })

  useEffect(() => {
    fetch(`/api/scan/${token}`)
      .then(r => r.json())
      .then(data => {
        if (data.reason === 'invalid') return setResult({ state: 'invalid' })
        if (data.reason === 'already_scanned') return setResult({
          state: 'already_scanned',
          person: data.person,
          scanned_at: data.scanned_at,
        })
        setResult({ state: 'valid', person: data.person, ticketType: data.ticket?.type })
      })
      .catch(() => setResult({ state: 'invalid' }))
  }, [token])

  async function confirmCheckin() {
    const res = await fetch(`/api/scan/${token}`, { method: 'POST' })
    const data = await res.json()
    if (data.valid) setResult({ state: 'confirmed' })
    else if (data.reason === 'already_scanned') setResult({
      state: 'already_scanned',
      person: data.person,
      scanned_at: data.scanned_at,
    })
  }

  if (result.state === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-400 text-lg">Checking ticket...</div>
      </div>
    )
  }

  if (result.state === 'invalid') {
    return (
      <Screen bg="bg-red-50" icon="❌" iconBg="bg-red-100">
        <h1 className="text-2xl font-bold text-red-700">Invalid Ticket</h1>
        <p className="text-red-500 mt-2">This QR code is not valid.</p>
      </Screen>
    )
  }

  if (result.state === 'already_scanned') {
    const scannedTime = new Date(result.scanned_at).toLocaleString()
    return (
      <Screen bg="bg-red-50" icon="⛔" iconBg="bg-red-100">
        <h1 className="text-2xl font-bold text-red-700">Already Used</h1>
        <p className="text-red-600 font-medium mt-1">{result.person.first_name} {result.person.last_name}</p>
        <p className="text-red-400 text-sm mt-1">Scanned at {scannedTime}</p>
        <p className="text-red-500 text-sm mt-3">This ticket has already been scanned. Re-entry is not permitted.</p>
      </Screen>
    )
  }

  if (result.state === 'confirmed') {
    return (
      <Screen bg="bg-green-50" icon="✅" iconBg="bg-green-100">
        <h1 className="text-2xl font-bold text-green-700">Checked In!</h1>
        <p className="text-green-600 mt-2">Enjoy the show!</p>
      </Screen>
    )
  }

  // valid — show ticket info and confirm button
  return (
    <Screen bg="bg-green-50" icon="🎟️" iconBg="bg-green-100">
      <h1 className="text-2xl font-bold text-green-700">Valid Ticket</h1>
      <p className="text-green-800 font-semibold text-lg mt-2">
        {result.person.first_name} {result.person.last_name}
      </p>
      <p className="text-green-600 text-sm">{result.person.email}</p>
      <p className="text-green-700 mt-2 font-medium">{TYPE_LABELS[result.ticketType] || result.ticketType}</p>
      <button
        onClick={confirmCheckin}
        className="mt-6 w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-6 rounded-2xl text-lg transition-colors"
      >
        Confirm Check-in
      </button>
    </Screen>
  )
}

function Screen({ bg, icon, iconBg, children }: {
  bg: string; icon: string; iconBg: string; children: React.ReactNode
}) {
  return (
    <div className={`min-h-screen flex items-center justify-center ${bg} p-6`}>
      <div className="bg-white rounded-3xl shadow-lg p-10 w-full max-w-sm text-center">
        <div className={`${iconBg} rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6 text-4xl`}>
          {icon}
        </div>
        {children}
      </div>
    </div>
  )
}
