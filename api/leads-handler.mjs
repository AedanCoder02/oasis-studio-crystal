import { neon } from '@neondatabase/serverless'

function db() {
  const url = (process.env.AP_NEON_URL ?? '').replace(/[?&]channel_binding=[^&]*/g, '')
  return neon(url)
}

const GOOGLE_API_KEY = () => process.env.GOOGLE_API_KEY ?? ''
const FIRECRAWL_KEY = () => process.env.FIRECRAWL_API_KEY ?? ''
const OPENROUTER_KEY = () => process.env.OPENROUTER_API_KEY ?? ''
const PLACES_KEY = () => process.env.GOOGLE_PLACES_API_KEY ?? process.env.GOOGLE_API_KEY ?? ''

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  })
}

async function handleMigrate() {
  const sql = db()
  await sql`CREATE TABLE IF NOT EXISTS leads (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), google_place_id TEXT UNIQUE, name TEXT NOT NULL, category TEXT, address TEXT, city TEXT, country TEXT, phone TEXT, email TEXT, website TEXT, google_maps_url TEXT, google_rating NUMERIC, google_reviews INTEGER, search_query TEXT, has_website BOOLEAN, website_score INTEGER, has_chat BOOLEAN, has_booking BOOLEAN, has_seo BOOLEAN, needs TEXT[], lead_score INTEGER DEFAULT 0, analysis_notes TEXT, outreach_angle TEXT, outreach_draft TEXT, outreach_sent BOOLEAN DEFAULT FALSE, outreach_sent_at TIMESTAMPTZ, stage TEXT NOT NULL DEFAULT 'scraped', notes TEXT, created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW())`
  await sql`CREATE TABLE IF NOT EXISTS lead_activities (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), lead_id UUID REFERENCES leads(id) ON DELETE CASCADE, type TEXT NOT NULL, content TEXT, meta JSONB, created_at TIMESTAMPTZ DEFAULT NOW())`
  await sql`CREATE INDEX IF NOT EXISTS idx_leads_stage ON leads(stage)`
  await sql`CREATE INDEX IF NOT EXISTS idx_leads_score ON leads(lead_score DESC)`
  await sql`CREATE INDEX IF NOT EXISTS idx_lead_activities_lead ON lead_activities(lead_id)`
  await sql`ALTER TABLE leads ADD COLUMN IF NOT EXISTS email_found_at TIMESTAMPTZ`
  await sql`ALTER TABLE leads ADD COLUMN IF NOT EXISTS last_sent_at TIMESTAMPTZ`
  await sql`ALTER TABLE leads ADD COLUMN IF NOT EXISTS meeting_booked_at TIMESTAMPTZ`
  await sql`ALTER TABLE leads ADD COLUMN IF NOT EXISTS site_proposal TEXT`
  return json({ ok: true })
}

async function handleList(body) {
  const sql = db()
  const { stage, minScore = 0 } = body ?? {}
  const rows = stage
    ? await sql`SELECT * FROM leads WHERE stage = ${stage} AND lead_score >= ${minScore} ORDER BY lead_score DESC, created_at DESC LIMIT 200`
    : await sql`SELECT * FROM leads WHERE lead_score >= ${minScore} ORDER BY lead_score DESC, created_at DESC LIMIT 200`
  const counts = await sql`SELECT stage, COUNT(*) AS count FROM leads GROUP BY stage`
  const stageCounts = {}
  for (const r of counts) stageCounts[r.stage] = parseInt(r.count)
  return json({ leads: rows, stageCounts })
}

async function handleGetLead(id) {
  const sql = db()
  const [lead] = await sql`SELECT * FROM leads WHERE id = ${id}`
  const activities = await sql`SELECT * FROM lead_activities WHERE lead_id = ${id} ORDER BY created_at ASC`
  return json({ lead: lead ?? null, activities })
}

async function handleScrape(body) {
  const sql = db()
  const { location, keyword, max = 20, noWebsiteOnly = false, minRating = 0 } = body
  const key = PLACES_KEY()
  if (!key) return json({ error: 'GOOGLE_PLACES_API_KEY not set' }, 503)

  const textQuery = `${keyword} in ${location}`
  const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': key,
      'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.shortFormattedAddress,places.nationalPhoneNumber,places.internationalPhoneNumber,places.websiteUri,places.types,places.rating,places.userRatingCount,places.googleMapsUri,places.primaryType',
    },
    body: JSON.stringify({ textQuery, maxResultCount: Math.min(max, 20) }),
  })
  if (!res.ok) return json({ error: `Places API: ${await res.text()}` }, 502)
  const apiData = await res.json()
  const places = apiData.places ?? []

  const parts = location.split(',').map(p => p.trim())
  const city = parts[0] ?? location
  const country = parts[parts.length - 1] ?? ''

  const filtered = places.filter(p => {
    if (noWebsiteOnly && p.websiteUri) return false
    if (minRating > 0 && p.rating != null && p.rating < minRating) return false
    return true
  })

  let created = 0, skipped = 0
  for (const place of filtered) {
    const name = place.displayName?.text ?? 'Unknown'
    const address = place.formattedAddress ?? place.shortFormattedAddress ?? ''
    const phone = place.internationalPhoneNumber ?? place.nationalPhoneNumber ?? null
    const website = place.websiteUri ?? null
    const rating = place.rating ?? null
    const reviews = place.userRatingCount ?? null
    const mapsUrl = place.googleMapsUri ?? null
    const cats = (place.types ?? []).filter(t => !['establishment','point_of_interest'].includes(t))
    const category = place.primaryType ?? cats[0] ?? keyword
    let score = 30
    if (!website) score += 40
    if (reviews && reviews < 20) score += 15
    if (rating && rating < 4.0) score += 10
    score = Math.min(score, 85)
    const [lead] = await sql`INSERT INTO leads (google_place_id,name,category,address,city,country,phone,website,google_maps_url,google_rating,google_reviews,has_website,lead_score,search_query,stage) VALUES (${place.id},${name},${category},${address},${city},${country},${phone},${website},${mapsUrl},${rating},${reviews},${!!website},${score},${textQuery},'scraped') ON CONFLICT (google_place_id) DO NOTHING RETURNING id`
    if (lead) created++; else skipped++
  }
  return json({ created, skipped, total: places.length, filtered_out: places.length - filtered.length })
}

async function handleAnalyze(id) {
  const sql = db()
  const fc = FIRECRAWL_KEY()
  const or = OPENROUTER_KEY()
  const [lead] = await sql`SELECT * FROM leads WHERE id = ${id}`
  if (!lead) return json({ error: 'not found' }, 404)

  let websiteContent = ''
  let hasWebsite = !!lead.website
  if (lead.website && fc) {
    try {
      const r = await fetch('https://api.firecrawl.dev/v1/scrape', { method: 'POST', headers: { 'Authorization': `Bearer ${fc}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ url: lead.website, formats: ['markdown'], onlyMainContent: true, timeout: 15000 }) })
      if (r.ok) { const d = await r.json(); websiteContent = d.data?.markdown ?? ''; hasWebsite = websiteContent.length > 50 }
    } catch {}
  }
  if (!hasWebsite) websiteContent = `[No website for ${lead.name}]`

  const prompt = `You are a digital agency analyst. Analyze this business for upsell opportunities.\nBusiness: "${lead.name}" — ${lead.category ?? ''} — ${lead.city ?? ''}\nWebsite content:\n---\n${websiteContent.slice(0, 4000)}\n---\nReturn ONLY valid JSON (no markdown):\n{"website_score":<0-100>,"has_chat":<bool>,"has_booking":<bool>,"has_seo":<bool>,"needs":["website_rebuild"|"seo"|"chatbot"|"automation"|"booking"|"social_media"],"lead_score":<0-100>,"analysis_notes":"<2-3 sentences>","outreach_angle":"<one sentence>"}`

  let analysis = null
  if (or) {
    try {
      const r = await fetch('https://openrouter.ai/api/v1/chat/completions', { method: 'POST', headers: { 'Authorization': `Bearer ${or}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ model: 'anthropic/claude-sonnet-4-6', messages: [{ role: 'user', content: prompt }], temperature: 0.2, max_tokens: 600 }) })
      if (r.ok) { const d = await r.json(); const raw = d.choices?.[0]?.message?.content ?? '{}'; analysis = JSON.parse(raw.replace(/```json\n?/g,'').replace(/```\n?/g,'').trim()) }
    } catch {}
  }
  if (!analysis) analysis = { website_score: hasWebsite ? 30 : 0, has_chat: false, has_booking: false, has_seo: false, needs: hasWebsite ? ['seo','chatbot'] : ['website_rebuild','seo','chatbot'], lead_score: hasWebsite ? 55 : 90, analysis_notes: `${lead.name} ${hasWebsite ? 'has a website but may need improvements' : 'has no website — strong opportunity'}.`, outreach_angle: `${lead.name} ${hasWebsite ? 'could benefit from digital improvements' : 'does not have a website yet'}.` }

  const [updated] = await sql`UPDATE leads SET has_website=${hasWebsite},website_score=${analysis.website_score??null},has_chat=${analysis.has_chat??false},has_booking=${analysis.has_booking??false},has_seo=${analysis.has_seo??false},needs=${analysis.needs??[]},lead_score=${analysis.lead_score??50},analysis_notes=${analysis.analysis_notes??null},outreach_angle=${analysis.outreach_angle??null},stage='analyzed',updated_at=NOW() WHERE id=${id} RETURNING *`
  await sql`INSERT INTO lead_activities (lead_id,type,content,meta) VALUES (${id},'analyzed','Website analysis completed',${JSON.stringify({score:analysis.lead_score,needs:analysis.needs})}::jsonb)`
  return json({ lead: updated })
}

async function handleEnrich(id) {
  const sql = db()
  const fc = FIRECRAWL_KEY()
  const [lead] = await sql`SELECT * FROM leads WHERE id = ${id}`
  if (!lead) return json({ error: 'not found' }, 404)
  if (lead.email) return json({ lead, found: false, source: 'existing' })
  if (!lead.website) return json({ error: 'no website' }, 400)

  const EMAIL_RE = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g
  const SKIP = ['example.com','yourdomain.com','sentry.io','wixpress.com','squarespace.com','wordpress.com','google.com','facebook.com']
  const base = lead.website.replace(/\/$/, '')
  let found = null
  for (const path of ['/','contact','contact-us','contacto','about']) {
    if (!fc) break
    try {
      const r = await fetch('https://api.firecrawl.dev/v1/scrape', { method: 'POST', headers: { 'Authorization': `Bearer ${fc}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ url: `${base}/${path}`.replace('//', '/').replace(':/', '://'), formats: ['markdown'], onlyMainContent: false, timeout: 12000 }) })
      if (r.ok) { const d = await r.json(); const text = d.data?.markdown ?? ''; const matches = (text.match(EMAIL_RE) ?? []).filter(e => !SKIP.some(s => e.endsWith('@' + s))); if (matches.length) { found = matches[0]; break } }
    } catch {}
  }
  if (!found) { await sql`INSERT INTO lead_activities (lead_id,type,content) VALUES (${id},'enrich_failed','Email not found')`; return json({ lead, found: false }) }
  const [updated] = await sql`UPDATE leads SET email=${found},email_found_at=NOW(),updated_at=NOW() WHERE id=${id} RETURNING *`
  await sql`INSERT INTO lead_activities (lead_id,type,content) VALUES (${id},'enriched',${`Email: ${found}`})`
  return json({ lead: updated, found: true, email: found })
}

async function handleDraft(id) {
  const sql = db()
  const gk = GOOGLE_API_KEY()
  if (!gk) return json({ error: 'GOOGLE_API_KEY not set' }, 503)
  const [lead] = await sql`SELECT * FROM leads WHERE id = ${id}`
  if (!lead) return json({ error: 'not found' }, 404)

  const country = (lead.country ?? '').toLowerCase()
  const signOff = country.includes('spain')||country.includes('mexico')||country.includes('colombia') ? 'El equipo de Oasis Studio'
    : country.includes('italy') ? 'Il team di Oasis Studio'
    : country.includes('france') ? "L'équipe Oasis Studio"
    : country.includes('germany') ? 'Das Team von Oasis Studio'
    : country.includes('portugal')||country.includes('brazil') ? 'A equipa Oasis Studio'
    : 'The Oasis Studio Team'
  const langHint = lead.country ? `Write in the primary language of ${lead.country}. Spain→Spanish, Italy→Italian, France→French, Germany→German, default English.` : 'Write in English.'
  const gaps = []
  if (!lead.has_website) gaps.push('no website')
  if ((lead.needs??[]).includes('seo')) gaps.push('no SEO')
  if ((lead.needs??[]).includes('chatbot')) gaps.push('no live chat')
  if ((lead.needs??[]).includes('booking')) gaps.push('no online booking')

  const prompt = `You are writing a cold outreach email on behalf of Oasis Studio — a boutique digital studio. LANGUAGE: ${langHint}\nLEAD: ${lead.name}, ${lead.category?.replace(/_/g,' ')}, ${[lead.city,lead.country].filter(Boolean).join(', ')}. ${lead.has_website===false?'No website.':''} ${lead.google_rating?`${lead.google_rating}/5 stars.`:''} ${lead.analysis_notes??''}\nGaps: ${gaps.join(', ')||'digital presence'}\nVOICE: "we/us/our". Warm, professional. No bullet points. 4 paragraphs. 160-200 words.\nSIGN-OFF: ${signOff}\nSUBJECT: intriguing, specific.\nOUTPUT:\nSUBJECT: <subject>\n---\n<body>`

  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${gk}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: prompt }] }], generationConfig: { maxOutputTokens: 2000, temperature: 0.7 } }) })
  const d = await r.json()
  if (!r.ok) return json({ error: `Gemini: ${d.error?.message}` }, 502)
  const draft = d.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
  const [updated] = await sql`UPDATE leads SET outreach_draft=${draft},updated_at=NOW() WHERE id=${id} RETURNING *`
  await sql`INSERT INTO lead_activities (lead_id,type,content) VALUES (${id},'draft_generated','Outreach email drafted')`
  return json({ lead: updated, draft })
}

async function handleUpdate(id, body) {
  const sql = db()
  const { stage, outreach_sent, notes } = body ?? {}
  if (stage !== undefined) await sql`UPDATE leads SET stage=${stage},updated_at=NOW() WHERE id=${id}`
  if (outreach_sent !== undefined) await sql`UPDATE leads SET outreach_sent=${outreach_sent},outreach_sent_at=${outreach_sent?new Date().toISOString():null},stage=CASE WHEN stage='analyzed' THEN 'contacted' ELSE stage END,updated_at=NOW() WHERE id=${id}`
  if (notes !== undefined) await sql`UPDATE leads SET notes=${notes},updated_at=NOW() WHERE id=${id}`
  const [updated] = await sql`SELECT * FROM leads WHERE id=${id}`
  return json({ lead: updated })
}

async function handleActivity(id, body) {
  const sql = db()
  const { type, content } = body ?? {}
  const [row] = await sql`INSERT INTO lead_activities (lead_id,type,content) VALUES (${id},${type},${content??null}) RETURNING *`
  return json({ activity: row })
}

async function handleProposal(id) {
  const sql = db()
  const gk = GOOGLE_API_KEY()
  if (!gk) return json({ error: 'GOOGLE_API_KEY not set' }, 503)
  const [lead] = await sql`SELECT * FROM leads WHERE id = ${id}`
  if (!lead) return json({ error: 'not found' }, 404)

  const PALETTE = { restaurant:'deep burgundy (#2D0A0A) bg, cream (#F5F0E8) text, gold (#C9A84C) accents', cafe:'warm espresso (#1A0F0A) bg, ivory text, amber accents', health:'deep navy bg, white text, teal accents', dental:'slate bg, white text, sky blue accents', boat:'deep ocean navy bg, white text, ocean blue accents', yacht:'deep ocean navy bg, white text, gold accents', hotel:'charcoal bg, white text, warm gold accents', spa:'deep plum bg, cream text, rose gold accents', fitness:'near-black bg, white text, electric blue accents' }
  const cat = (lead.category ?? '').toLowerCase()
  let palette = 'dark slate (#0D1117) bg, white text, violet (#8B5CF6) accents'
  for (const [k,v] of Object.entries(PALETTE)) { if (cat.includes(k)) { palette = v; break } }
  const needs = lead.needs ?? []
  let cta = 'Get in Touch'
  if (needs.includes('booking')||cat.includes('restaurant')) cta = 'Reserve a Table'
  if (cat.includes('clinic')||cat.includes('dental')) cta = 'Book an Appointment'
  if (cat.includes('boat')||cat.includes('yacht')) cta = 'Explore Our Fleet'
  const rating = lead.google_rating ? `${lead.google_rating}/5 · ${lead.google_reviews??'?'} reviews` : null

  const prompt = `CRITICAL: Output ONLY valid HTML starting with <!DOCTYPE html>. No markdown, no explanation.\nGenerate a complete, self-contained HTML website proposal for: ${lead.name} (${cat}) in ${[lead.city,lead.country].filter(Boolean).join(', ')}.\nLANGUAGE: Write ALL text in language of ${lead.country??'the business'}. Spain→Spanish, Italy→Italian, France→French, Germany→German, default English.\nDESIGN: ${palette}. Georgia serif headings, system sans body. Editorial luxury, mobile responsive, no external deps.\nSECTIONS: 1) Proposal banner "✦ Website preview for ${lead.name} — proposed by Oasis Studio" 2) Nav 3) Hero full viewport, name large (clamp(3rem,8vw,7rem)), tagline, CTA "${cta}"${rating?`, "${rating}"`:''}  4) About two-column + stats 5) Services/menu 3 cards 6) Contact with phone 7) Footer "Website by Oasis Studio"\nAll styles in <style> block. CSS custom properties. Card hover effects. Start with <!DOCTYPE html>.`

  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${gk}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: prompt }] }], generationConfig: { maxOutputTokens: 8000, temperature: 0.8 } }) })
  const d = await r.json()
  if (!r.ok) return json({ error: `Gemini: ${d.error?.message}` }, 502)
  let html = d.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
  html = html.replace(/^```html\n?/i,'').replace(/\n?```$/i,'')
  const di = html.search(/<!DOCTYPE/i)
  if (di > 0) html = html.slice(di)
  html = html.trim()
  try { await sql`UPDATE leads SET site_proposal=${html},updated_at=NOW() WHERE id=${id}` } catch {}
  await sql`INSERT INTO lead_activities (lead_id,type,content) VALUES (${id},'note','Site proposal generated')`
  return json({ html })
}

export default async function handler(request) {
  if (request.method === 'OPTIONS') return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST,OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' } })
  let body = null
  try { body = await request.json() } catch {}

  // Vercel rewrites the URL before invoking the function, so path-based routing
  // is unreliable. Use action + id in the request body instead.
  const { action, id, ...data } = body ?? {}

  try {
    if (action === 'migrate') return await handleMigrate()
    if (action === 'list') return await handleList(data)
    if (action === 'scrape') return await handleScrape(data)
    if (action === 'get' && id) return await handleGetLead(id)
    if (action === 'analyze' && id) return await handleAnalyze(id)
    if (action === 'enrich' && id) return await handleEnrich(id)
    if (action === 'draft' && id) return await handleDraft(id)
    if (action === 'update' && id) return await handleUpdate(id, data)
    if (action === 'activity' && id) return await handleActivity(id, data)
    if (action === 'proposal' && id) return await handleProposal(id)
    return json({ error: `unknown action: ${action}` }, 400)
  } catch (e) {
    console.error('Leads API error:', e)
    return json({ error: e.message }, 500)
  }
}
