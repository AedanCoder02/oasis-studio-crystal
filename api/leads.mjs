import { neon } from '@neondatabase/serverless'

function db() {
  const url = (process.env.AP_NEON_URL ?? '').replace(/[?&]channel_binding=[^&]*/g, '')
  return neon(url)
}

const GOOGLE_API_KEY = () => process.env.GOOGLE_API_KEY ?? ''
const FIRECRAWL_KEY  = () => process.env.FIRECRAWL_API_KEY ?? ''
const OPENROUTER_KEY = () => process.env.OPENROUTER_API_KEY ?? ''
// Pick whichever key is a Maps Platform key (AIza prefix) for Places API
const PLACES_KEY = () => {
  const k1 = process.env.GOOGLE_PLACES_API_KEY ?? ''
  const k2 = process.env.GOOGLE_API_KEY ?? ''
  if (k1.startsWith('AIza')) return k1
  if (k2.startsWith('AIza')) return k2
  return k1 || k2
}

function ok(data)         { return { data, status: 200 } }
function err(msg, status) { return { data: { error: msg }, status } }

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
  return ok({ ok: true })
}

async function handleList(body) {
  const sql = db()
  const { stage, minScore = 0 } = body ?? {}
  const rows = stage
    ? await sql`SELECT * FROM leads WHERE stage=${stage} AND lead_score>=${minScore} ORDER BY lead_score DESC,created_at DESC LIMIT 200`
    : await sql`SELECT * FROM leads WHERE lead_score>=${minScore} ORDER BY lead_score DESC,created_at DESC LIMIT 200`
  const counts = await sql`SELECT stage,COUNT(*) AS count FROM leads GROUP BY stage`
  const stageCounts = {}
  for (const r of counts) stageCounts[r.stage] = parseInt(r.count)
  return ok({ leads: rows, stageCounts })
}

async function handleGetLead(id) {
  const sql = db()
  const [lead] = await sql`SELECT * FROM leads WHERE id=${id}`
  const activities = await sql`SELECT * FROM lead_activities WHERE lead_id=${id} ORDER BY created_at ASC`
  return ok({ lead: lead ?? null, activities })
}

async function handleScrape(body) {
  const sql = db()
  const { location, keyword, max = 20, noWebsiteOnly = false, minRating = 0 } = body
  const key = PLACES_KEY()
  if (!key) return err('GOOGLE_PLACES_API_KEY not set', 503)

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
  if (!res.ok) return err(`Places API: ${await res.text()}`, 502)
  const apiData = await res.json()
  const places = apiData.places ?? []

  const parts = location.split(',').map(p => p.trim())
  const city    = parts[0] ?? location
  const country = parts[parts.length - 1] ?? ''

  const filtered = places.filter(p => {
    if (noWebsiteOnly && p.websiteUri) return false
    if (minRating > 0 && p.rating != null && p.rating < minRating) return false
    return true
  })

  let created = 0, skipped = 0
  for (const place of filtered) {
    const name     = place.displayName?.text ?? 'Unknown'
    const address  = place.formattedAddress ?? place.shortFormattedAddress ?? ''
    const phone    = place.internationalPhoneNumber ?? place.nationalPhoneNumber ?? null
    const website  = place.websiteUri ?? null
    const rating   = place.rating ?? null
    const reviews  = place.userRatingCount ?? null
    const mapsUrl  = place.googleMapsUri ?? null
    const cats     = (place.types ?? []).filter(t => !['establishment','point_of_interest'].includes(t))
    const category = place.primaryType ?? cats[0] ?? keyword
    let score = 30
    if (!website) score += 40
    if (reviews && reviews < 20) score += 15
    if (rating && rating < 4.0) score += 10
    score = Math.min(score, 85)
    const [lead] = await sql`
      INSERT INTO leads (google_place_id,name,category,address,city,country,phone,website,google_maps_url,google_rating,google_reviews,has_website,lead_score,search_query,stage)
      VALUES (${place.id},${name},${category},${address},${city},${country},${phone},${website},${mapsUrl},${rating},${reviews},${!!website},${score},${textQuery},'scraped')
      ON CONFLICT (google_place_id) DO NOTHING RETURNING id`
    if (lead) created++; else skipped++
  }
  return ok({ created, skipped, total: places.length, filtered_out: places.length - filtered.length })
}

async function handleAnalyze(id) {
  const sql = db()
  const [lead] = await sql`SELECT * FROM leads WHERE id=${id}`
  if (!lead) return err('not found', 404)
  const fc = FIRECRAWL_KEY(), or = OPENROUTER_KEY()
  let content = '', hasWebsite = !!lead.website
  if (lead.website && fc) {
    try {
      const r = await fetch('https://api.firecrawl.dev/v1/scrape', { method: 'POST', headers: { 'Authorization': `Bearer ${fc}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ url: lead.website, formats: ['markdown'], onlyMainContent: true, timeout: 15000 }) })
      if (r.ok) { const d = await r.json(); content = d.data?.markdown ?? ''; hasWebsite = content.length > 50 }
    } catch {}
  }
  if (!hasWebsite) content = `[No website for ${lead.name}]`
  const prompt = `Analyze this business for digital upsell opportunities.\nBusiness: "${lead.name}" — ${lead.category??''} — ${lead.city??''}\nContent:\n---\n${content.slice(0,4000)}\n---\nReturn ONLY valid JSON:\n{"website_score":<0-100>,"has_chat":<bool>,"has_booking":<bool>,"has_seo":<bool>,"needs":["website_rebuild"|"seo"|"chatbot"|"automation"|"booking"|"social_media"],"lead_score":<0-100>,"analysis_notes":"<2-3 sentences>","outreach_angle":"<one sentence>"}`
  let analysis = null
  if (or) {
    try {
      const r = await fetch('https://openrouter.ai/api/v1/chat/completions', { method: 'POST', headers: { 'Authorization': `Bearer ${or}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ model: 'anthropic/claude-sonnet-4-6', messages: [{ role: 'user', content: prompt }], temperature: 0.2, max_tokens: 600 }) })
      if (r.ok) { const d = await r.json(); analysis = JSON.parse(d.choices?.[0]?.message?.content?.replace(/```json\n?/g,'').replace(/```\n?/g,'').trim() ?? '{}') }
    } catch {}
  }
  if (!analysis) analysis = { website_score: hasWebsite?30:0, has_chat: false, has_booking: false, has_seo: false, needs: hasWebsite?['seo','chatbot']:['website_rebuild','seo','chatbot'], lead_score: hasWebsite?55:90, analysis_notes: `${lead.name} ${hasWebsite?'has a website but may need improvements':'has no website — strong opportunity'}.`, outreach_angle: `${lead.name} ${hasWebsite?'could benefit from improvements':'does not have a website yet'}.` }
  const [updated] = await sql`UPDATE leads SET has_website=${hasWebsite},website_score=${analysis.website_score??null},has_chat=${analysis.has_chat??false},has_booking=${analysis.has_booking??false},has_seo=${analysis.has_seo??false},needs=${analysis.needs??[]},lead_score=${analysis.lead_score??50},analysis_notes=${analysis.analysis_notes??null},outreach_angle=${analysis.outreach_angle??null},stage='analyzed',updated_at=NOW() WHERE id=${id} RETURNING *`
  await sql`INSERT INTO lead_activities (lead_id,type,content) VALUES (${id},'analyzed','Website analysis completed')`
  return ok({ lead: updated })
}

async function handleEnrich(id) {
  const sql = db()
  const [lead] = await sql`SELECT * FROM leads WHERE id=${id}`
  if (!lead) return err('not found', 404)
  if (lead.email) return ok({ lead, found: false })
  if (!lead.website) return err('no website', 400)
  const fc = FIRECRAWL_KEY()
  const EMAIL_RE = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g
  const SKIP = ['example.com','sentry.io','wixpress.com','squarespace.com','wordpress.com','google.com']
  const base = lead.website.replace(/\/$/, '')
  let found = null
  for (const path of ['/','contact','contact-us','contacto','about']) {
    if (!fc) break
    try {
      const r = await fetch('https://api.firecrawl.dev/v1/scrape', { method: 'POST', headers: { 'Authorization': `Bearer ${fc}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ url: `${base}/${path}`.replace('//','/').replace(':/',  '://'), formats: ['markdown'], onlyMainContent: false, timeout: 12000 }) })
      if (r.ok) { const d = await r.json(); const matches = (d.data?.markdown??'').match(EMAIL_RE)?.filter(e => !SKIP.some(s => e.endsWith('@'+s))) ?? []; if (matches.length) { found = matches[0]; break } }
    } catch {}
  }
  if (!found) { await sql`INSERT INTO lead_activities (lead_id,type,content) VALUES (${id},'enrich_failed','Email not found')`; return ok({ lead, found: false }) }
  const [updated] = await sql`UPDATE leads SET email=${found},email_found_at=NOW(),updated_at=NOW() WHERE id=${id} RETURNING *`
  await sql`INSERT INTO lead_activities (lead_id,type,content) VALUES (${id},'enriched',${`Email: ${found}`})`
  return ok({ lead: updated, found: true, email: found })
}

async function handleDraft(id) {
  const sql = db()
  const gk = GOOGLE_API_KEY()
  if (!gk) return err('GOOGLE_API_KEY not set', 503)
  const [lead] = await sql`SELECT * FROM leads WHERE id=${id}`
  if (!lead) return err('not found', 404)

  const BOOKING_URL = process.env.BOOKING_URL ?? ''
  const BASE_URL = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://oasis-studio-crystal.vercel.app'
  const proposalUrl = lead.site_proposal ? `${BASE_URL}/api/leads?preview=${id}` : null

  const country = (lead.country??'').toLowerCase()
  const signOff = country.includes('spain')||country.includes('mexico')||country.includes('colombia')||country.includes('argentina')?'El equipo de Oasis Studio'
    :country.includes('italy')||country.includes('italia')?'Il team di Oasis Studio'
    :country.includes('france')||country.includes('francia')?"L'équipe Oasis Studio"
    :country.includes('germany')||country.includes('deutschland')?'Das Team von Oasis Studio'
    :country.includes('portugal')||country.includes('brazil')||country.includes('brasil')?'A equipa Oasis Studio'
    :'The Oasis Studio Team'

  const langHint = lead.country
    ? `Write the ENTIRE email — every sentence, proposal link mention, and sign-off — in the primary language of ${lead.country}. Spain/Spanish-speaking → Spanish. Italy → Italian. France → French. Germany → German. Portugal/Brazil → Portuguese. UK/US/Australia → English. Default to English if unsure.`
    : 'Write in English.'

  const gaps = []
  if (lead.has_website === false) gaps.push('no website')
  if ((lead.needs??[]).includes('seo')) gaps.push('no SEO presence')
  if ((lead.needs??[]).includes('chatbot')) gaps.push('no live chat or automated contact')
  if ((lead.needs??[]).includes('booking')) gaps.push('no online booking or reservation system')
  if ((lead.needs??[]).includes('social_media')) gaps.push('no social media presence')

  const rating = lead.google_rating ? `${lead.google_rating}/5 stars · ${lead.google_reviews??'?'} Google reviews` : null

  const context = [
    `Business: ${lead.name}`,
    `Type: ${lead.category?.replace(/_/g,' ')}`,
    `Location: ${[lead.city,lead.country].filter(Boolean).join(', ')}`,
    lead.has_website === false ? 'Website: none' : `Website: ${lead.website??'unknown'}`,
    rating ? `Google reputation: ${rating}` : null,
    lead.analysis_notes ? `Digital analysis: ${lead.analysis_notes}` : null,
    gaps.length ? `Current digital gaps (opportunities): ${gaps.join(', ')}` : null,
    proposalUrl ? `Site preview prepared for them: ${proposalUrl}` : null,
  ].filter(Boolean).join('\n')

  const prompt = `You are writing a cold outreach email on behalf of Oasis Studio — a boutique digital studio that helps local businesses grow through beautifully crafted websites, SEO, chat automation, and smart digital integrations.

LANGUAGE: ${langHint}

--- LEAD CONTEXT ---
${context}
--- END CONTEXT ---

VOICE & TONE:
- Write as a team: "we", "us", "our" — never "I".
- You genuinely admire what they've built. Lead with that. Make them feel seen, not sold to.
- Frame digital gaps as natural next steps for a business at their level — never as failures.
- Warm, knowledgeable, and professional. Human — not corporate. No jargon.
- No bullet points or numbered lists. Flowing paragraphs only.
- Never open with "We hope", "We noticed", "My name is", or "We came across your business".

STRUCTURE — 4 paragraphs:
- Paragraph 1 (2 sentences): open with something genuine and specific about their reputation or what makes them stand out. Reference their rating, city, or category.
- Paragraph 2 (2-3 sentences): acknowledge the digital opportunity. Reference their specific gaps (${gaps.length?gaps.join(', '):'digital presence'}) as the natural next step. Be specific.
- Paragraph 3 (2 sentences): introduce Oasis Studio as the right partner.${proposalUrl?` Then include the site preview naturally in the SAME language: translate and include "We've put together a website preview for ${lead.name} so you can see what's possible — take a look: ${proposalUrl}"`:''}
- Paragraph 4 (1-2 sentences): soft, warm close. Invite them to a short conversation.${BOOKING_URL?` Include this booking link: ${BOOKING_URL}`:''}

LENGTH: 160-200 words. Substantial enough to feel considered, short enough to be read.

SIGN-OFF: Use exactly: ${signOff}

SUBJECT LINE: intriguing and specific to them — about their potential, not what they're missing.

OUTPUT — return exactly this format, nothing else:
SUBJECT: <subject line>
---
<paragraph 1>

<paragraph 2>

<paragraph 3>

<paragraph 4>

${signOff}`.trim()

  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${gk}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: prompt }] }], generationConfig: { maxOutputTokens: 2000, temperature: 0.7 } }) })
  const d = await r.json()
  if (!r.ok) return err(`Gemini: ${d.error?.message}`, 502)
  const draft = d.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
  const [updated] = await sql`UPDATE leads SET outreach_draft=${draft},updated_at=NOW() WHERE id=${id} RETURNING *`
  await sql`INSERT INTO lead_activities (lead_id,type,content) VALUES (${id},'draft_generated','Outreach email drafted')`
  return ok({ lead: updated, draft })
}

async function handleUpdate(id, body) {
  const sql = db()
  const { stage, outreach_sent, notes } = body ?? {}
  if (stage !== undefined) await sql`UPDATE leads SET stage=${stage},updated_at=NOW() WHERE id=${id}`
  if (outreach_sent !== undefined) await sql`UPDATE leads SET outreach_sent=${outreach_sent},outreach_sent_at=${outreach_sent?new Date().toISOString():null},stage=CASE WHEN stage='analyzed' THEN 'contacted' ELSE stage END,updated_at=NOW() WHERE id=${id}`
  if (notes !== undefined) await sql`UPDATE leads SET notes=${notes},updated_at=NOW() WHERE id=${id}`
  const [updated] = await sql`SELECT * FROM leads WHERE id=${id}`
  return ok({ lead: updated })
}

async function handleActivity(id, body) {
  const sql = db()
  const { type, content } = body ?? {}
  const [row] = await sql`INSERT INTO lead_activities (lead_id,type,content) VALUES (${id},${type},${content??null}) RETURNING *`
  return ok({ activity: row })
}

async function handleProposal(id) {
  const sql = db()
  const gk = GOOGLE_API_KEY()
  if (!gk) return err('GOOGLE_API_KEY not set', 503)
  const [lead] = await sql`SELECT * FROM leads WHERE id=${id}`
  if (!lead) return err('not found', 404)
  const cat = (lead.category??'').toLowerCase()
  const PALETTE = { restaurant:'deep burgundy (#2D0A0A) bg, cream text, gold accents', cafe:'warm espresso bg, ivory text, amber accents', health:'deep navy bg, white text, teal accents', dental:'slate bg, white text, sky blue accents', boat:'ocean navy bg, white text, ocean blue accents', yacht:'ocean navy bg, white text, gold accents', hotel:'charcoal bg, white text, warm gold accents', spa:'deep plum bg, cream text, rose gold accents', fitness:'near-black bg, white text, electric blue accents' }
  let palette = 'dark slate (#0D1117) bg, white text, violet accents'
  for (const [k,v] of Object.entries(PALETTE)) { if (cat.includes(k)) { palette = v; break } }
  const needs = lead.needs ?? []
  const cta = needs.includes('booking')||cat.includes('restaurant')?'Reserve a Table':cat.includes('clinic')||cat.includes('dental')?'Book an Appointment':cat.includes('boat')||cat.includes('yacht')?'Explore Our Fleet':'Get in Touch'
  const rating = lead.google_rating?`${lead.google_rating}/5 · ${lead.google_reviews??'?'} reviews`:null
  const prompt = `Output ONLY valid HTML starting with <!DOCTYPE html>. No markdown.\nWebsite proposal for: ${lead.name} (${cat}) in ${[lead.city,lead.country].filter(Boolean).join(', ')}.\nLanguage: primary language of ${lead.country??'business country'}.\nDesign: ${palette}. Georgia serif headings, system sans body. Mobile responsive, no external deps.\nSections: 1) Banner "✦ Website preview for ${lead.name} — proposed by Oasis Studio" 2) Nav 3) Hero full viewport, name clamp(3rem,8vw,7rem), tagline, CTA "${cta}"${rating?`, "${rating}"`:''}  4) About + 3 stats 5) Services 3 cards 6) Contact 7) Footer "Website by Oasis Studio"\nAll styles in <style>. Card hover effects. Start with <!DOCTYPE html>.`
  // 4000 tokens keeps generation under Vercel's 10s function timeout
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${gk}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: prompt }] }], generationConfig: { maxOutputTokens: 4000, temperature: 0.8 } }) })
  const d = await r.json()
  if (!r.ok) return err(`Gemini: ${d.error?.message}`, 502)
  let html = d.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
  html = html.replace(/^```html\n?/i,'').replace(/\n?```$/i,'')
  const di = html.search(/<!DOCTYPE/i)
  if (di > 0) html = html.slice(di)
  html = html.trim()
  try { await sql`UPDATE leads SET site_proposal=${html},updated_at=NOW() WHERE id=${id}` } catch {}
  await sql`INSERT INTO lead_activities (lead_id,type,content) VALUES (${id},'note','Site proposal generated')`
  return ok({ html })
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  if (req.method === 'OPTIONS') { res.status(204).end(); return }

  // GET ?preview=ID — serve stored site proposal HTML publicly (for email links)
  if (req.method === 'GET') {
    const url = new URL(req.url, 'http://localhost')
    const id = url.searchParams.get('preview')
    if (id) {
      const sql = db()
      const [lead] = await sql`SELECT site_proposal FROM leads WHERE id=${id}`
      if (!lead?.site_proposal) {
        res.status(404).send('<html><body style="background:#050508;color:#e8e8e8;font-family:monospace;padding:40px">No proposal generated yet.</body></html>')
        return
      }
      res.setHeader('Content-Type', 'text/html; charset=utf-8')
      res.setHeader('Cache-Control', 'no-store')
      res.status(200).send(lead.site_proposal)
      return
    }
    res.status(400).json({ error: 'missing ?preview=ID' })
    return
  }

  res.setHeader('Content-Type', 'application/json')

  let body = {}
  try {
    const chunks = []
    for await (const chunk of req) chunks.push(chunk)
    body = JSON.parse(Buffer.concat(chunks).toString())
  } catch {}

  const { action, id, ...data } = body

  const dispatch = () => {
    if (action === 'migrate') return handleMigrate()
    if (action === 'list')    return handleList(data)
    if (action === 'scrape')  return handleScrape(data)
    if (action === 'get'      && id) return handleGetLead(id)
    if (action === 'analyze'  && id) return handleAnalyze(id)
    if (action === 'enrich'   && id) return handleEnrich(id)
    if (action === 'draft'    && id) return handleDraft(id)
    if (action === 'update'   && id) return handleUpdate(id, data)
    if (action === 'activity' && id) return handleActivity(id, data)
    if (action === 'proposal' && id) return handleProposal(id)
return Promise.resolve(err(`unknown action: ${action}`, 400))
  }

  try {
    const result = await dispatch()
    res.status(result.status).json(result.data)
  } catch (e) {
    console.error('Leads API error:', e)
    res.status(500).json({ error: e.message })
  }
}
