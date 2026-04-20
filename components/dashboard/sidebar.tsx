'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
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

  const nav = role === 'volunteer'
    ? volunteerNav
    : role === 'liaison'
    ? liaisonNav
    : boardNav

  const roleLabel = role === 'volunteer' ? 'Volunteer'
    : role === 'liaison' ? 'Liaison'
    : 'Operations Platform'

  return (
    <aside className="w-60 min-h-screen bg-gray-900 flex flex-col">
      <div className="px-6 py-5 border-b border-gray-700">
        <p className="text-white font-bold text-lg leading-tight">Raas Rodeo</p>
        <p className="text-gray-400 text-xs mt-0.5">{roleLabel}</p>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {nav.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
              pathname === href
                ? 'bg-indigo-600 text-white'
                : 'text-gray-300 hover:bg-gray-800 hover:text-white'
            )}
          >
            <Icon className="w-4 h-4 shrink-0" />
            {label}
          </Link>
        ))}
      </nav>
      <div className="px-3 py-4 border-t border-gray-700">
        <form action="/auth/signout" method="post">
          <button className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors w-full">
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </form>
      </div>
    </aside>
  )
}
