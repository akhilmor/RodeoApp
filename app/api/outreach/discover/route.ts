import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

const GOOGLE_API_KEY = process.env.GOOGLE_PLACES_API_KEY

// Search queries targeting Austin Indian/South Asian orgs with donation potential
const SEARCH_PRESETS: Record<string, string[]> = {
  indian_businesses: [
    'Indian restaurant Austin Texas',
    'Indian grocery store Austin Texas',
    'Desi restaurant Austin Texas',
    'South Asian restaurant Austin Texas',
    'Halal restaurant Austin Texas',
  ],
  community_orgs: [
    'Indian cultural association Austin Texas',
    'Hindu temple Austin Texas',
    'Indian community center Austin Texas',
    'South Asian community Austin Texas',
    'TANA Telugu association Austin Texas',
    'India association Austin Texas',
  ],
  donors: [
    'Indian owned business Austin Texas',
    'South Asian professional Austin Texas',
    'Indian doctor Austin Texas',
    'Indian lawyer Austin Texas',
    'Desi business Austin Texas',
  ],
  local_sponsors: [
    'Austin community foundation',
    'Austin arts sponsor',
    'Austin event sponsor company',
    'Austin philanthropist organization',
    'Austin corporate giving program',
  ],
}

async function searchGooglePlaces(query: string): Promise<PlaceResult[]> {
  if (!GOOGLE_API_KEY) return []

  const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${GOOGLE_API_KEY}`
  const res = await fetch(url)
  if (!res.ok) return []
  const data = await res.json()
  return (data.results || []).slice(0, 10)
}

async function getPlaceDetails(placeId: string): Promise<PlaceDetails | null> {
  if (!GOOGLE_API_KEY) return null

  const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,formatted_address,formatted_phone_number,website,types&key=${GOOGLE_API_KEY}`
  const res = await fetch(url)
  if (!res.ok) return null
  const data = await res.json()
  return data.result || null
}

async function scrapeEmailFromWebsite(website: string): Promise<string | null> {
  try {
    const urls = [
      website,
      website.replace(/\/$/, '') + '/contact',
      website.replace(/\/$/, '') + '/contact-us',
      website.replace(/\/$/, '') + '/about',
    ]

    for (const url of urls) {
      try {
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), 5000)
        const res = await fetch(url, {
          signal: controller.signal,
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; RaasRodeoBot/1.0)' },
        })
        clearTimeout(timeout)

        if (!res.ok) continue
        const html = await res.text()

        // Extract mailto links first (most reliable)
        const mailtoMatch = html.match(/mailto:([a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,})/i)
        if (mailtoMatch) return mailtoMatch[1]

        // Extract email patterns from text
        const emailMatch = html.match(/\b([a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,})\b/g)
        if (emailMatch) {
          // Filter out common false positives
          const filtered = emailMatch.filter(e =>
            !e.includes('example.com') &&
            !e.includes('sentry.io') &&
            !e.includes('@2x') &&
            !e.includes('.png') &&
            !e.includes('.jpg') &&
            !e.endsWith('.js') &&
            !e.includes('schema.org') &&
            !e.includes('w3.org')
          )
          if (filtered.length > 0) return filtered[0]
        }
      } catch {
        continue
      }
    }
  } catch {
    // ignore
  }
  return null
}

function inferCategory(types: string[], name: string): string {
  const n = name.toLowerCase()
  const t = types.join(' ').toLowerCase()

  if (n.includes('temple') || n.includes('mandir') || t.includes('place_of_worship')) return 'Temple / Religious Org'
  if (n.includes('restaurant') || n.includes('kitchen') || n.includes('dhaba') || t.includes('restaurant')) return 'Indian Restaurant'
  if (n.includes('grocery') || n.includes('market') || n.includes('bazaar') || t.includes('grocery')) return 'Indian Grocery'
  if (n.includes('association') || n.includes('foundation') || n.includes('community') || n.includes('council')) return 'Cultural Organization'
  if (t.includes('doctor') || t.includes('dentist') || t.includes('physician') || t.includes('health')) return 'Medical Practice'
  if (t.includes('lawyer') || t.includes('attorney') || t.includes('law')) return 'Law Firm'
  if (t.includes('school') || t.includes('university') || t.includes('education')) return 'Education'
  return 'Business'
}

type PlaceResult = {
  place_id: string
  name: string
  formatted_address?: string
  types?: string[]
}

type PlaceDetails = {
  name: string
  formatted_address?: string
  formatted_phone_number?: string
  website?: string
  types?: string[]
}

export async function POST(req: NextRequest) {
  if (!GOOGLE_API_KEY) {
    return NextResponse.json({ error: 'GOOGLE_PLACES_API_KEY not configured' }, { status: 400 })
  }

  const supabase = await createServiceClient()
  const { preset = 'indian_businesses', custom_query } = await req.json()

  const queries = custom_query
    ? [custom_query]
    : (SEARCH_PRESETS[preset] || SEARCH_PRESETS.indian_businesses)

  const newProspects: {
    business_name: string
    location: string
    phone: string | null
    website: string | null
    email: string | null
    category: string
    source: string
    google_place_id: string
    status: string
  }[] = []

  // Get existing place IDs to avoid duplicates
  const { data: existing } = await supabase
    .from('prospects')
    .select('google_place_id')
  const existingIds = new Set((existing || []).map(e => e.google_place_id).filter(Boolean))

  for (const query of queries) {
    const places = await searchGooglePlaces(query)

    for (const place of places) {
      if (existingIds.has(place.place_id)) continue

      const details = await getPlaceDetails(place.place_id)
      if (!details) continue

      const website = details.website || null
      let email: string | null = null

      if (website) {
        email = await scrapeEmailFromWebsite(website)
      }

      const category = inferCategory(details.types || place.types || [], details.name || place.name)

      newProspects.push({
        business_name: details.name || place.name,
        location: details.formatted_address || place.formatted_address || '',
        phone: details.formatted_phone_number || null,
        website,
        email,
        category,
        source: 'google_places',
        google_place_id: place.place_id,
        status: 'new',
      })

      existingIds.add(place.place_id)
    }

    // Rate limit between queries
    await new Promise(r => setTimeout(r, 300))
  }

  if (newProspects.length === 0) {
    return NextResponse.json({ added: 0, message: 'No new prospects found' })
  }

  const { data: inserted, error } = await supabase
    .from('prospects')
    .insert(newProspects)
    .select()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    added: inserted?.length || 0,
    with_email: newProspects.filter(p => p.email).length,
    prospects: inserted,
  })
}
