# Raas Rodeo Platform

A full operations platform for managing a Raas Rodeo event — built to replace a fragmented Google Sheets + manual email workflow. Handles everything from ticket sales and payment reconciliation to logistics scheduling and AI-assisted outreach.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Database & Auth | Supabase (Postgres + Auth) |
| Payments | Stripe Checkout + Webhooks |
| Email | Resend |
| Styling | Tailwind CSS v4 |
| AI | Anthropic Claude SDK |
| Deployment | Vercel |

---

## What This Replaces

| Old Tool | Replaced By |
|---|---|
| Google Sheets (ticket tracking) | Tickets page with live status |
| Google Forms (registration) | Public ticket purchase flow |
| Manual Venmo/Zelle reconciliation | Payments page with match/confirm workflow |
| Email blast spreadsheets | Outreach page with one-click send |
| Schedule coordination sheets | Logistics/Tasks page |
| Manual team roster tracking | People + Teams pages |
| Manual revenue tracking | Dashboard summary with live revenue |

---

## Project Structure

```
rodeo-automation/
├── app/
│   ├── page.tsx                  # Public landing page
│   ├── layout.tsx                # Root layout
│   ├── globals.css
│   ├── login/                    # Staff/admin login
│   ├── reset-password/           # Password reset flow
│   ├── tickets/                  # Public ticket purchase (Stripe Checkout)
│   ├── scan/                     # QR code ticket scanner
│   ├── dancer/                   # Dancer-facing portal
│   ├── portal/                   # Attendee self-service portal
│   ├── dashboard/                # Staff/admin ops dashboard
│   │   ├── page.tsx              # Summary stats
│   │   ├── people/               # People roster (CRUD)
│   │   ├── teams/                # Team management
│   │   ├── tickets/              # Ticket assignment & status
│   │   ├── payments/             # Payment reconciliation
│   │   ├── logistics/            # Task scheduling
│   │   ├── outreach/             # Email outreach
│   │   ├── event/                # Event details
│   │   ├── users/                # User account management
│   │   └── ai-planner/           # AI-assisted event planning
│   ├── api/
│   │   ├── auth/                 # Auth helpers
│   │   ├── dashboard/            # Dashboard data endpoints
│   │   ├── event/                # Event CRUD
│   │   ├── outreach/             # Email send via Resend
│   │   ├── portal/               # Attendee portal API
│   │   ├── scan/                 # QR scan + ticket check-in
│   │   ├── seed-demo/            # Demo data seeder
│   │   ├── stripe/               # Stripe Checkout session creation
│   │   ├── webhooks/             # Stripe webhook handler
│   │   └── ai-planner/           # Claude AI planning endpoint
│   └── stripe.ts                 # Stripe client init
├── components/                   # Shared UI components
├── lib/                          # Supabase client, utilities
├── types/                        # TypeScript type definitions
├── supabase/
│   └── migrations/               # DB migration files
├── supabase-schema.sql           # Full schema — run this to bootstrap DB
└── SETUP.md                      # Detailed setup instructions
```

---

## Database Schema

Six core tables in Supabase (Postgres):

### `teams`
Competition teams participating in the rodeo.
- `id`, `name`, `ticket_allocation` (default 20), `notes`

### `people`
Everyone associated with the event.
- `role_type`: `admin` | `staff` | `liaison` | `competitor` | `audience`
- `position`: Director, Finance Chair, Logistics Chair, Show Chair, Liaison, Competitor, Audience, etc.
- Business rule: competitors and liaisons **must** have a `team_id`; staff/admin/audience **must not**

### `tickets`
- `type`: `competitor` | `ff` (friends & family) | `public`
- `status`: `reserved` → `assigned` → `paid` → `picked_up`

### `payments`
- `amount` stored in **cents** (e.g., 2500 = $25.00)
- `method`: `stripe` | `venmo` | `zelle` | `team`
- `status`: `pending` | `confirmed`

### `tasks`
Logistics scheduling.
- `category`: `transport` | `food` | `show` | `hotel` | `logistics`
- `status`: `not_started` | `in_progress` | `done`
- Can be assigned to a person or an entire team

### `outreach`
Email tracking.
- `type`: `fundraising` | `reminder` | `confirmation`
- `status`: `not_sent` | `sent` | `responded`

**RLS:** All tables use Row-Level Security. API routes use the `service_role` key (bypasses RLS). The `teams` table allows anonymous reads for the public landing page.

---

## Role Access

| Role | Access |
|---|---|
| `admin` | Full dashboard access including user management |
| `staff` | Full ops: people, tickets, payments, tasks, outreach |
| `liaison` | Their team data only |
| `audience` | No dashboard — public site + attendee portal only |

---

## Key Flows

### Public Ticket Purchase
`/tickets` → Stripe Checkout → `api/webhooks/stripe` (on `checkout.session.completed`) → ticket marked `paid`, person record created/updated

### Staff Login
`/login` → Supabase Auth (email/password) → redirect to `/dashboard`

### QR Ticket Scan
`/scan` → reads QR code → `api/scan` → marks ticket `picked_up`

### Attendee Portal
`/portal` → attendees self-serve (view ticket, details)

### Payment Reconciliation
Dashboard → Payments → match Venmo/Zelle references to people → confirm payment manually

### Email Outreach
Dashboard → Outreach → select recipients → send via Resend API → status tracked per person

### AI Planner
Dashboard → AI Planner → Claude generates event plans, logistics suggestions, or outreach copy

---

## Local Development

```bash
cd RodeoAutomation/rodeo-automation
npm install
npm run dev
```

| URL | What it is |
|---|---|
| `http://localhost:3000` | Public landing page |
| `http://localhost:3000/tickets` | Public ticket purchase |
| `http://localhost:3000/login` | Staff login |
| `http://localhost:3000/dashboard` | Ops dashboard |
| `http://localhost:3000/portal` | Attendee portal |
| `http://localhost:3000/scan` | QR scanner |

### Local Stripe Webhooks
```bash
brew install stripe/stripe-cli/stripe
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

---

## Environment Variables

Create `.env.local` in the project root:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# App
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app

# Email (Resend)
RESEND_API_KEY=re_...
EMAIL_FROM=noreply@yourdomain.com

# Ticket prices in cents
NEXT_PUBLIC_PRICE_COMPETITOR=2500   # $25.00
NEXT_PUBLIC_PRICE_FF=3000           # $30.00
NEXT_PUBLIC_PRICE_PUBLIC=3500       # $35.00
```

---

## Database Setup (First Time)

1. Create a new project at [supabase.com](https://supabase.com)
2. Open **SQL Editor** and paste + run the full contents of `supabase-schema.sql`
3. Go to **Project Settings → API** and copy your keys into `.env.local`
4. Create your first admin user: **Authentication → Users → Invite user**

See `SETUP.md` for full step-by-step instructions including Stripe and Resend setup.

---

## Deployment

Connect the GitHub repo to [Vercel](https://vercel.com), add all environment variables in the Vercel dashboard, and deploy. The `main` branch auto-deploys on push.

---

## Demo Data

To seed realistic demo data, hit the `/api/seed-demo` endpoint or use the seed button in the dashboard. This populates teams, people, tickets, and payments for testing.
