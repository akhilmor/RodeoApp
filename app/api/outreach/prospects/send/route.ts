import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

const FUNDRAISING_EMAIL = (name: string, custom?: string) => `
<div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;padding:0;color:#1a1a1a;background:#ffffff;">
  <!-- Header banner -->
  <div style="background:#0a0a0f;padding:28px 32px;border-radius:12px 12px 0 0;">
    <p style="color:#f5c518;font-size:11px;font-family:sans-serif;letter-spacing:3px;text-transform:uppercase;margin:0 0 6px 0">A Night in Gotham</p>
    <h1 style="color:#ffffff;font-size:22px;margin:0;font-weight:700">Raas Rodeo 2026</h1>
    <p style="color:#6b7280;font-size:13px;margin:6px 0 0 0;font-family:sans-serif">February 28, 2026 · Dell Fine Arts Center, Austin TX</p>
  </div>

  <div style="padding:32px;background:#ffffff;border-radius:0 0 12px 12px;border:1px solid #e5e7eb;border-top:none;">
    <p>Dear ${name},</p>

    <p>My name is Akhil, and I'm reaching out on behalf of <strong>Raas Rodeo 2026: A Night in Gotham</strong> — a premier competitive college Raas dance showcase at the <strong>Dell Fine Arts Center in Austin</strong> on <strong>February 28, 2026</strong>, bringing together 8 top South Asian college dance teams from across the country.</p>

    <p>This is one of Austin's largest South Asian cultural events, drawing 500+ attendees from the local community and beyond. We're looking for local businesses and organizations who'd like to support the next generation of South Asian cultural performers.</p>

    <p style="font-weight:600;margin-bottom:8px">Why sponsor A Night in Gotham?</p>
    <ul style="padding-left:20px;line-height:1.8">
      <li>Reach 500+ engaged South Asian attendees</li>
      <li>Logo placement on event programs, banners, and social media</li>
      <li>Recognition from stage on show night</li>
      <li>Direct connection to the Austin South Asian community</li>
    </ul>

    ${custom ? `<p>${custom}</p>` : ''}

    <p>Sponsorship tiers start at $250. We'd love to have you as a partner for this year's show. Simply reply to this email if you're interested or have questions.</p>

    <p>Thank you for supporting our community.</p>

    <p style="margin-bottom:0">Warm regards,<br>
    <strong>Akhil Morusupalli</strong><br>
    <span style="color:#6b7280;font-size:13px">Raas Rodeo 2026 — Operations Board</span></p>

    <div style="margin-top:24px;padding-top:20px;border-top:1px solid #f3f4f6;">
      <p style="color:#9ca3af;font-size:11px;font-family:sans-serif;margin:0">Raas Rodeo 2026: A Night in Gotham · Dell Fine Arts Center · Austin, Texas · Feb 28, 2026</p>
    </div>
  </div>
</div>
`

export async function POST(req: NextRequest) {
  const supabase = await createServiceClient()
  const { prospect_ids, custom_message, subject_override, send_to_all_with_email } = await req.json()

  let prospects: { id: string; business_name: string; contact_name: string | null; email: string | null }[] = []

  if (send_to_all_with_email) {
    const { data } = await supabase
      .from('prospects')
      .select('id, business_name, contact_name, email')
      .not('email', 'is', null)
      .eq('status', 'new')
    prospects = data || []
  } else if (prospect_ids?.length) {
    const { data } = await supabase
      .from('prospects')
      .select('id, business_name, contact_name, email')
      .in('id', prospect_ids)
    prospects = data || []
  }

  const withEmail = prospects.filter(p => p.email)
  if (withEmail.length === 0) {
    return NextResponse.json({ error: 'No prospects with emails found' }, { status: 400 })
  }

  let sent = 0
  let failed = 0

  for (const p of withEmail) {
    try {
      const recipientName = p.contact_name || p.business_name

      await resend.emails.send({
        from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
        to: p.email!,
        subject: subject_override || 'Sponsorship Opportunity — Raas Rodeo 2026: A Night in Gotham (Austin, Feb 28)',
        html: FUNDRAISING_EMAIL(recipientName, custom_message),
      })

      await supabase
        .from('prospects')
        .update({ status: 'contacted', last_contacted_at: new Date().toISOString() })
        .eq('id', p.id)

      sent++
    } catch {
      failed++
    }
  }

  return NextResponse.json({ sent, failed, total: withEmail.length })
}
