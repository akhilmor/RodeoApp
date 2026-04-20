'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Users, Ticket, CreditCard,
  Shield, ClipboardList, Mail, LogOut, CalendarDays, UserCog
} from 'lucide-react'

const boardNav = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/users', label: 'Users', icon: UserCog },
  { href: '/dashboard/people', label: 'People', icon: Users },
  { href: '/dashboard/tickets', label: 'Tickets', icon: Ticket },
  { href: '/dashboard/payments', label: 'Payments', icon: CreditCard },
  { href: '/dashboard/teams', label: 'Teams', icon: Shield },
  { href: '/dashboard/logistics', label: 'Logistics', icon: ClipboardList },
  { href: '/dashboard/outreach', label: 'Outreach', icon: Mail },
  { href: '/dashboard/event', label: 'Event Info', icon: CalendarDays },
]

const volunteerNav = [
  { href: '/dashboard/logistics', label: 'Logistics', icon: ClipboardList },
  { href: '/dashboard/event', label: 'Event Info', icon: CalendarDays },
]

const liaisonNav = [
  { href: '/dashboard/logistics', label: 'Logistics', icon: ClipboardList },
  { href: '/dashboard/teams', label: 'Teams', icon: Shield },
  { href: '/dashboard/event', label: 'Event Info', icon: CalendarDays },
]

export function Sidebar({ role }: { role?: string }) {
  const pathname = usePathname()

  const nav = role === 'volunteer' ? volunteerNav
    : role === 'liaison' ? liaisonNav
    : boardNav

  const roleLabel = role === 'volunteer' ? 'Volunteer'
    : role === 'liaison' ? 'Liaison'
    : 'Operations'

  return (
    <aside className="w-60 min-h-screen flex flex-col" style={{
      background: 'linear-gradient(180deg, #0d0d14 0%, #0a0a0f 100%)',
      borderRight: '1px solid #1e1e2a',
    }}>
      {/* Logo */}
      <div className="px-5 py-6" style={{ borderBottom: '1px solid #1e1e2a' }}>
        <div className="flex items-center gap-3 mb-1">
          {/* Bat logo SVG */}
          <div className="w-8 h-8 flex items-center justify-center rounded-lg" style={{ background: 'var(--bat-gold)', boxShadow: '0 0 12px rgba(245,197,24,0.4)' }}>
            <svg viewBox="0 0 24 16" fill="none" className="w-5 h-4" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C10 2 8.5 3.5 8 5C6 4 3.5 4.5 2 6C3 6 4 6.5 4.5 7.5C3 8 2 9 2 10C3.5 9.5 5 9.5 6 10C6.5 11 7.5 12 9 12.5C9.5 11.5 10.5 11 12 11C13.5 11 14.5 11.5 15 12.5C16.5 12 17.5 11 18 10C19 9.5 20.5 9.5 22 10C22 9 21 8 19.5 7.5C20 6.5 21 6 22 6C20.5 4.5 18 4 16 5C15.5 3.5 14 2 12 2Z" fill="#0a0a0f"/>
            </svg>
          </div>
          <div>
            <p className="font-bold text-sm leading-tight" style={{ color: '#f5c518' }}>Raas Rodeo</p>
            <p className="text-xs" style={{ color: '#4b5563' }}>{roleLabel} · 2026</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group"
              style={active ? {
                background: 'rgba(245, 197, 24, 0.12)',
                color: '#f5c518',
                boxShadow: 'inset 2px 0 0 #f5c518',
              } : {
                color: '#6b7280',
              }}
              onMouseEnter={e => {
                if (!active) {
                  (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)'
                  ;(e.currentTarget as HTMLElement).style.color = '#d1d5db'
                }
              }}
              onMouseLeave={e => {
                if (!active) {
                  (e.currentTarget as HTMLElement).style.background = 'transparent'
                  ;(e.currentTarget as HTMLElement).style.color = '#6b7280'
                }
              }}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Sign out */}
      <div className="px-3 py-4" style={{ borderTop: '1px solid #1e1e2a' }}>
        <form action="/auth/signout" method="post">
          <button
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm w-full transition-all"
            style={{ color: '#4b5563' }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.color = '#ef4444'
              ;(e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.06)'
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.color = '#4b5563'
              ;(e.currentTarget as HTMLElement).style.background = 'transparent'
            }}
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </form>
      </div>
    </aside>
  )
}
