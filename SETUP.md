# Raas Rodeo Platform — Setup Guide

## Stack
- **Frontend/Backend**: Next.js 15 (App Router)
- **Database/Auth**: Supabase (Postgres + Auth)
- **Payments**: Stripe Checkout + Webhooks
- **Email**: Resend
- **Styling**: Tailwind CSS v4
- **Deployment**: Vercel

---

## 1. Supabase Setup

1. Go to [supabase.com](https://supabase.com) → New Project
2. Once created, open **SQL Editor**
3. Paste the entire contents of `supabase-schema.sql` and run it
4. Go to **Project Settings → API** and copy:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role secret` key → `SUPABASE_SERVICE_ROLE_KEY`

### Create Admin User
In Supabase → **Authentication → Users → Invite user**
Create your first admin user with email/password.

---

## 2. Stripe Setup

1. Go to [dashboard.stripe.com](https://dashboard.stripe.com)
2. **Developers → API Keys** → copy:
   - Publishable key → `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - Secret key → `STRIPE_SECRET_KEY`
3. **Developers → Webhooks → Add endpoint**:
   - URL: `https://your-domain.vercel.app/api/webhooks/stripe`
   - Events to listen: `checkout.session.completed`
   - Copy **Signing secret** → `STRIPE_WEBHOOK_SECRET`

---

## 3. Resend Setup (Email)

1. Go to [resend.com](https://resend.com) → Create API Key
2. Copy key → `RESEND_API_KEY`
3. Set `EMAIL_FROM` to your verified domain email

---

## 4. Environment Variables

Copy `.env.local` and fill in all values:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app

RESEND_API_KEY=re_...
EMAIL_FROM=noreply@yourdomain.com

# Ticket prices in cents (2500 = $25.00)
NEXT_PUBLIC_PRICE_COMPETITOR=2500
NEXT_PUBLIC_PRICE_FF=3000
NEXT_PUBLIC_PRICE_PUBLIC=3500
```

---

## 5. Local Development

```bash
cd RodeoAutomation/rodeo-automation
npm install
npm run dev
```

Visit:
- Public site: http://localhost:3000
- Buy tickets: http://localhost:3000/tickets
- Staff login: http://localhost:3000/login
- Dashboard: http://localhost:3000/dashboard

### Local Stripe Webhooks
```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Forward webhooks to local
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

---

## 6. Deploy to Vercel

```bash
npm install -g vercel
vercel --prod
```

Or connect GitHub repo to Vercel and add all env vars in the Vercel dashboard.

---

## 7. Customize Teams

Edit the seed section in `supabase-schema.sql` or use the Teams page in the dashboard to add/edit teams.

---

## 8. Role Access Summary

| Role | Access |
|------|--------|
| Admin | Full dashboard access |
| Staff | Full ops (people, tickets, payments, tasks, outreach) |
| Liaison | Their team data only (configured in Supabase RLS) |
| Audience | No dashboard — public site only |

---

## What This Replaces

| Old Tool | Replaced By |
|----------|-------------|
| Google Sheets (ticket tracking) | Tickets page with live status |
| Google Forms (registration) | Public ticket purchase flow |
| Manual Venmo/Zelle reconciliation | Payments page with match/confirm workflow |
| Email blast spreadsheets | Outreach page with one-click send |
| Schedule coordination sheets | Logistics/Tasks page |
| Manual team roster tracking | People + Teams pages |
| Manual revenue tracking | Dashboard summary with live revenue |
