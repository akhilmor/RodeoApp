import Link from 'next/link'
import { createServiceClient } from '@/lib/supabase/server'

const TEAMS = [
  { abbr: 'GT', name: "GT Ramblin' Raas", school: 'Georgia Tech', city: 'Atlanta, GA' },
  { abbr: 'ILL', name: 'Illini Raas', school: 'Univ. of Illinois', city: 'Champaign, IL' },
  { abbr: 'BU', name: 'BU Fatakada', school: 'Boston University', city: 'Boston, MA' },
  { abbr: 'UCLA', name: 'UCLA Raas', school: 'UC Los Angeles', city: 'Los Angeles, CA' },
  { abbr: 'UCSD', name: 'UCSD Raas Ruckus', school: 'UC San Diego', city: 'San Diego, CA' },
  { abbr: 'UTD', name: 'UTD TaRaas', school: 'UT Dallas', city: 'Dallas, TX' },
  { abbr: 'UVA', name: 'UVA Hooraas', school: 'Univ. of Virginia', city: 'Charlottesville, VA' },
  { abbr: 'WU', name: 'WashU Raas', school: 'Wash. Univ. St. Louis', city: 'St. Louis, MO' },
]

async function getTicketCount() {
  try {
    const supabase = await createServiceClient()
    const { count } = await supabase.from('tickets').select('*', { count: 'exact', head: true })
    return count ?? 0
  } catch { return 0 }
}

export default async function HomePage() {
  const ticketCount = await getTicketCount()

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f', color: '#e5e7eb', fontFamily: 'system-ui,sans-serif', overflowX: 'hidden' }}>

      {/* Hero */}
      <div style={{
        background: 'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(245,197,24,0.12) 0%, transparent 70%)',
        borderBottom: '1px solid #1e1e2a',
        padding: '96px 24px 72px',
        textAlign: 'center',
        position: 'relative',
      }}>
        {/* Bat logo */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 28 }}>
          <div style={{
            width: 80, height: 80, borderRadius: 22,
            background: '#f5c518',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 60px rgba(245,197,24,0.5), 0 0 120px rgba(245,197,24,0.15)',
          }}>
            <svg viewBox="0 0 24 16" fill="none" width="50" height="34" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C10 2 8.5 3.5 8 5C6 4 3.5 4.5 2 6C3 6 4 6.5 4.5 7.5C3 8 2 9 2 10C3.5 9.5 5 9.5 6 10C6.5 11 7.5 12 9 12.5C9.5 11.5 10.5 11 12 11C13.5 11 14.5 11.5 15 12.5C16.5 12 17.5 11 18 10C19 9.5 20.5 9.5 22 10C22 9 21 8 19.5 7.5C20 6.5 21 6 22 6C20.5 4.5 18 4 16 5C15.5 3.5 14 2 12 2Z" fill="#0a0a0f"/>
            </svg>
          </div>
        </div>

        <p style={{ color: '#f5c518', letterSpacing: '0.35em', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', marginBottom: 14 }}>
          A Night in Gotham
        </p>

        <h1 style={{
          fontSize: 'clamp(52px, 9vw, 88px)',
          fontWeight: 900,
          letterSpacing: '-0.03em',
          margin: '0 0 12px',
          lineHeight: 1,
          background: 'linear-gradient(180deg, #ffffff 0%, #d1d5db 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>
          Raas Rodeo 2026
        </h1>

        <p style={{ color: '#6b7280', fontSize: 17, marginBottom: 48, letterSpacing: '0.02em' }}>
          February 28, 2026 &nbsp;·&nbsp; Dell Fine Arts Center &nbsp;·&nbsp; Austin, TX
        </p>

        {/* Stats */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 52 }}>
          {[
            { value: '8', label: 'Competing Teams' },
            { value: ticketCount > 0 ? `${ticketCount}` : '170+', label: 'Tickets Sold' },
            { value: '500+', label: 'Attendees' },
          ].map(s => (
            <div key={s.label} style={{
              background: 'rgba(22,22,31,0.8)',
              border: '1px solid #2a2a3a',
              borderRadius: 18,
              padding: '20px 36px',
              textAlign: 'center',
              backdropFilter: 'blur(10px)',
            }}>
              <p style={{ fontSize: 30, fontWeight: 900, color: '#f5c518', margin: '0 0 4px', letterSpacing: '-0.02em' }}>{s.value}</p>
              <p style={{ fontSize: 11, color: '#6b7280', margin: 0, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{s.label}</p>
            </div>
          ))}
        </div>

        <Link href="/login" style={{
          display: 'inline-block',
          background: '#f5c518',
          color: '#0a0a0f',
          fontWeight: 800,
          fontSize: 15,
          padding: '15px 52px',
          borderRadius: 50,
          textDecoration: 'none',
          boxShadow: '0 0 40px rgba(245,197,24,0.35)',
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
        }}>
          Sign In / Portal
        </Link>
      </div>

      {/* Teams Section */}
      <div style={{ maxWidth: 1080, margin: '0 auto', padding: '72px 24px 80px' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <p style={{ color: '#f5c518', letterSpacing: '0.35em', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', marginBottom: 10 }}>
            The Lineup
          </p>
          <h2 style={{ fontSize: 36, fontWeight: 900, margin: '0 0 12px', letterSpacing: '-0.02em' }}>
            8 Teams. One Night.
          </h2>
          <p style={{ color: '#4b5563', fontSize: 15, margin: 0 }}>
            Top collegiate Raas teams from across the country compete for the Gotham title
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
          gap: 16,
        }}>
          {TEAMS.map((team) => (
            <div key={team.abbr} style={{
              background: '#16161f',
              border: '1px solid #2a2a3a',
              borderRadius: 18,
              padding: '28px 20px 24px',
              textAlign: 'center',
              transition: 'border-color 0.2s',
            }}>
              <div style={{
                width: 52, height: 52, borderRadius: 14,
                margin: '0 auto 16px',
                background: 'rgba(245,197,24,0.1)',
                border: '1px solid rgba(245,197,24,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 900, color: '#f5c518',
                letterSpacing: '0.04em',
              }}>
                {team.abbr}
              </div>
              <p style={{ fontWeight: 800, fontSize: 14, margin: '0 0 5px', color: '#f1f5f9', lineHeight: 1.3 }}>{team.name}</p>
              <p style={{ fontSize: 12, color: '#4b5563', margin: 0 }}>{team.city}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Show Details strip */}
      <div style={{ borderTop: '1px solid #1e1e2a', borderBottom: '1px solid #1e1e2a', background: '#111118' }}>
        <div style={{ maxWidth: 1080, margin: '0 auto', padding: '36px 24px', display: 'flex', justifyContent: 'center', gap: '48px', flexWrap: 'wrap' }}>
          {[
            { label: 'Date', value: 'February 28, 2026' },
            { label: 'Doors', value: '5:10 PM' },
            { label: 'Show', value: '6:00 PM' },
            { label: 'Venue', value: 'Dell Fine Arts Center' },
            { label: 'City', value: 'Austin, TX' },
          ].map(d => (
            <div key={d.label} style={{ textAlign: 'center' }}>
              <p style={{ fontSize: 11, color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.15em', margin: '0 0 4px' }}>{d.label}</p>
              <p style={{ fontSize: 15, fontWeight: 700, color: '#e2e8f0', margin: 0 }}>{d.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer style={{ padding: '28px 24px', textAlign: 'center' }}>
        <p style={{ color: '#2a2a3a', fontSize: 12, margin: 0 }}>
          © 2026 Raas Rodeo &nbsp;·&nbsp; A Night in Gotham &nbsp;·&nbsp; Dell Fine Arts Center, Austin TX
        </p>
      </footer>
    </div>
  )
}
