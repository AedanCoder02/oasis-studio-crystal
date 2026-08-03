import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { neon } from '@neondatabase/serverless';
import type { Lead, Activity } from './leads.types';

function db() {
  return neon(process.env.AP_NEON_URL!);
}

// ── Migrations ──────────────────────────────────────────────────────────────

export const runMigrations = createServerFn({ method: 'POST' })
  .handler(async () => {
    const sql = db();
    await sql`
      CREATE TABLE IF NOT EXISTS leads (
        id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        google_place_id TEXT UNIQUE,
        name            TEXT NOT NULL,
        category        TEXT,
        address         TEXT,
        city            TEXT,
        country         TEXT,
        phone           TEXT,
        email           TEXT,
        website         TEXT,
        google_maps_url TEXT,
        google_rating   NUMERIC,
        google_reviews  INTEGER,
        search_query    TEXT,
        has_website     BOOLEAN,
        website_score   INTEGER,
        has_chat        BOOLEAN,
        has_booking     BOOLEAN,
        has_seo         BOOLEAN,
        needs           TEXT[],
        lead_score      INTEGER DEFAULT 0,
        analysis_notes  TEXT,
        outreach_angle  TEXT,
        outreach_draft  TEXT,
        outreach_sent   BOOLEAN DEFAULT FALSE,
        outreach_sent_at TIMESTAMPTZ,
        stage           TEXT NOT NULL DEFAULT 'scraped',
        notes           TEXT,
        created_at      TIMESTAMPTZ DEFAULT NOW(),
        updated_at      TIMESTAMPTZ DEFAULT NOW()
      )
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS lead_activities (
        id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        lead_id   UUID REFERENCES leads(id) ON DELETE CASCADE,
        type      TEXT NOT NULL,
        content   TEXT,
        meta      JSONB,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_leads_stage ON leads(stage)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_leads_score ON leads(lead_score DESC)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_lead_activities_lead ON lead_activities(lead_id)`;
    // v2 columns
    await sql`ALTER TABLE leads ADD COLUMN IF NOT EXISTS email_found_at   TIMESTAMPTZ`;
    await sql`ALTER TABLE leads ADD COLUMN IF NOT EXISTS last_sent_at      TIMESTAMPTZ`;
    await sql`ALTER TABLE leads ADD COLUMN IF NOT EXISTS meeting_booked_at TIMESTAMPTZ`;
    await sql`ALTER TABLE leads ADD COLUMN IF NOT EXISTS site_proposal     TEXT`;
    return { ok: true };
  });

// ── Read ─────────────────────────────────────────────────────────────────────

export const getLeads = createServerFn({ method: 'POST' })
  .inputValidator(z.object({
    stage:    z.string().optional(),
    minScore: z.number().optional(),
  }))
  .handler(async ({ data }) => {
    const sql = db();
    const { stage, minScore = 0 } = data;
    const rows = stage
      ? await sql`SELECT * FROM leads WHERE stage = ${stage} AND lead_score >= ${minScore} ORDER BY lead_score DESC, created_at DESC LIMIT 200`
      : await sql`SELECT * FROM leads WHERE lead_score >= ${minScore} ORDER BY lead_score DESC, created_at DESC LIMIT 200`;
    const counts = await sql`SELECT stage, COUNT(*) AS count FROM leads GROUP BY stage`;
    const stageCounts: Record<string, number> = {};
    for (const row of counts) stageCounts[row.stage] = parseInt(row.count as string);
    return { leads: rows as Lead[], stageCounts };
  });

export const getLead = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ id: z.string().uuid() }))
  .handler(async ({ data }) => {
    const sql = db();
    const [lead] = await sql`SELECT * FROM leads WHERE id = ${data.id}`;
    const activities = await sql`SELECT * FROM lead_activities WHERE lead_id = ${data.id} ORDER BY created_at ASC`;
    return { lead: lead as Lead | null, activities: activities as Activity[] };
  });

// ── Scrape ───────────────────────────────────────────────────────────────────

export const scrapeLeads = createServerFn({ method: 'POST' })
  .inputValidator(z.object({
    location:      z.string().min(1),
    keyword:       z.string().min(1),
    max:           z.number().int().min(1).max(20).default(20),
    noWebsiteOnly: z.boolean().default(false),
    minRating:     z.number().default(0),
  }))
  .handler(async ({ data }) => {
    try {
    const sql = db();
    const PLACES_KEY = process.env.GOOGLE_PLACES_API_KEY ?? process.env.GOOGLE_API_KEY ?? '';
    if (!PLACES_KEY) return { created: 0, skipped: 0, total: 0, filtered_out: 0, debugError: 'GOOGLE_PLACES_API_KEY not set' };

    const textQuery = `${data.keyword} in ${data.location}`;
    const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': PLACES_KEY,
        'X-Goog-FieldMask': [
          'places.id','places.displayName','places.formattedAddress',
          'places.shortFormattedAddress','places.nationalPhoneNumber',
          'places.internationalPhoneNumber','places.websiteUri','places.types',
          'places.rating','places.userRatingCount','places.googleMapsUri','places.primaryType',
        ].join(','),
      },
      body: JSON.stringify({ textQuery, maxResultCount: Math.min(data.max, 20) }),
    });
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Places API error: ${errText}`);
    }
    const apiData = await res.json();
    const places: any[] = apiData.places ?? [];

    const locationParts = data.location.split(',').map((p: string) => p.trim());
    const city    = locationParts[0] ?? data.location;
    const country = locationParts[locationParts.length - 1] ?? '';

    const filtered = places.filter(p => {
      if (data.noWebsiteOnly && p.websiteUri) return false;
      if (data.minRating > 0 && p.rating != null && p.rating < data.minRating) return false;
      return true;
    });

    let created = 0, skipped = 0;
    for (const place of filtered) {
      const name     = place.displayName?.text ?? 'Unknown';
      const address  = place.formattedAddress ?? place.shortFormattedAddress ?? '';
      const phone    = place.internationalPhoneNumber ?? place.nationalPhoneNumber ?? null;
      const website  = place.websiteUri ?? null;
      const rating   = place.rating ?? null;
      const reviews  = place.userRatingCount ?? null;
      const mapsUrl  = place.googleMapsUri ?? null;
      const cats     = (place.types ?? []).filter((t: string) => !['establishment','point_of_interest'].includes(t));
      const category = place.primaryType ?? cats[0] ?? data.keyword;
      let roughScore = 30;
      if (!website)               roughScore += 40;
      if (reviews && reviews < 20) roughScore += 15;
      if (rating  && rating  < 4.0) roughScore += 10;
      roughScore = Math.min(roughScore, 85);

      const [lead] = await sql`
        INSERT INTO leads (google_place_id,name,category,address,city,country,phone,website,google_maps_url,google_rating,google_reviews,has_website,lead_score,search_query,stage)
        VALUES (${place.id},${name},${category},${address},${city},${country},${phone},${website},${mapsUrl},${rating},${reviews},${!!website},${roughScore},${textQuery},'scraped')
        ON CONFLICT (google_place_id) DO NOTHING
        RETURNING id
      `;
      if (lead) created++; else skipped++;
    }

    return { created, skipped, total: places.length, filtered_out: places.length - filtered.length, debugError: null };
    } catch (e: any) {
      return { created: 0, skipped: 0, total: 0, filtered_out: 0, debugError: String(e?.message ?? e) };
    }
  });

// ── Analysis ─────────────────────────────────────────────────────────────────

export const analyzeLead = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ id: z.string().uuid() }))
  .handler(async ({ data }) => {
    const sql = db();
    const FIRECRAWL_KEY  = process.env.FIRECRAWL_API_KEY ?? '';
    const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY ?? '';
    const [lead] = await sql`SELECT * FROM leads WHERE id = ${data.id}`;
    if (!lead) throw new Error('Lead not found');

    let websiteContent = '';
    let hasWebsite = !!lead.website;
    if (lead.website && FIRECRAWL_KEY) {
      try {
        const fcRes = await fetch('https://api.firecrawl.dev/v1/scrape', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${FIRECRAWL_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: lead.website, formats: ['markdown'], onlyMainContent: true, timeout: 15000 }),
        });
        if (fcRes.ok) {
          const fcData = await fcRes.json();
          websiteContent = fcData.data?.markdown ?? '';
          hasWebsite = websiteContent.length > 50;
        }
      } catch { /* continue */ }
    }
    if (!hasWebsite) websiteContent = `[No website found for ${lead.name}]`;

    const ANALYZE_PROMPT = `You are a digital agency analyst. The agency sells: website rebuilds, SEO, chatbot/live chat, booking automation, social media setup.\n\nBusiness: "${lead.name}" — ${lead.category ?? ''} — ${lead.city ?? ''}\nWebsite content (scraped):\n---\n${websiteContent.slice(0, 4000)}\n---\n\nAnalyze and return ONLY valid JSON (no markdown):\n{\n  "website_score": <0-100>,\n  "has_chat": <bool>,\n  "has_booking": <bool>,\n  "has_seo": <bool>,\n  "is_mobile_friendly": <bool>,\n  "needs": <array: "website_rebuild"|"seo"|"chatbot"|"automation"|"booking"|"social_media">,\n  "lead_score": <0-100>,\n  "analysis_notes": "<2-3 sentences>",\n  "outreach_angle": "<one-sentence hook>"\n}`;

    let analysis: any = null;
    if (OPENROUTER_KEY) {
      try {
        const aiRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${OPENROUTER_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ model: 'anthropic/claude-sonnet-4-6', messages: [{ role: 'user', content: ANALYZE_PROMPT }], temperature: 0.2, max_tokens: 600 }),
        });
        if (aiRes.ok) {
          const aiData = await aiRes.json();
          const raw = aiData.choices?.[0]?.message?.content ?? '{}';
          analysis = JSON.parse(raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim());
        }
      } catch { /* fallback */ }
    }
    if (!analysis) {
      analysis = {
        website_score: hasWebsite ? 30 : 0, has_chat: false, has_booking: false, has_seo: false,
        needs: hasWebsite ? ['seo','chatbot'] : ['website_rebuild','seo','chatbot'],
        lead_score: hasWebsite ? 55 : 90,
        analysis_notes: hasWebsite ? `${lead.name} has a website but may need modernization.` : `${lead.name} has no website — strong opportunity.`,
        outreach_angle: hasWebsite ? `We noticed ${lead.name}'s site could benefit from improvements.` : `${lead.name} doesn't have a website yet — we'd love to change that.`,
      };
    }

    const [updated] = await sql`
      UPDATE leads SET has_website=${hasWebsite}, website_score=${analysis.website_score??null}, has_chat=${analysis.has_chat??false}, has_booking=${analysis.has_booking??false}, has_seo=${analysis.has_seo??false}, needs=${analysis.needs??[]}, lead_score=${analysis.lead_score??50}, analysis_notes=${analysis.analysis_notes??null}, outreach_angle=${analysis.outreach_angle??null}, stage='analyzed', updated_at=NOW() WHERE id=${data.id} RETURNING *
    `;
    await sql`INSERT INTO lead_activities (lead_id,type,content,meta) VALUES (${data.id},'analyzed','Website analysis completed',${JSON.stringify({score:analysis.lead_score,needs:analysis.needs})}::jsonb)`;
    return { lead: updated as Lead };
  });

export const enrichLead = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ id: z.string().uuid() }))
  .handler(async ({ data }) => {
    const sql = db();
    const FIRECRAWL_KEY = process.env.FIRECRAWL_API_KEY ?? '';
    const [lead] = await sql`SELECT * FROM leads WHERE id = ${data.id}`;
    if (!lead) throw new Error('Lead not found');
    if (lead.email) return { lead: lead as Lead, found: false, source: 'existing' };
    if (!lead.website) throw new Error('No website to enrich from');

    const EMAIL_RE = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;
    const SKIP_DOMAINS = ['example.com','yourdomain.com','domain.com','sentry.io','wixpress.com','squarespace.com','wordpress.com','google.com','facebook.com'];
    const base = lead.website.replace(/\/$/, '');
    const paths = ['/','contact','contact-us','contacto','contacta','about','about-us'];
    let foundEmail: string | null = null;

    for (const path of paths) {
      if (!FIRECRAWL_KEY) break;
      try {
        const res = await fetch('https://api.firecrawl.dev/v1/scrape', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${FIRECRAWL_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: `${base}/${path}`.replace('//', '/').replace(':/', '://'), formats: ['markdown'], onlyMainContent: false, timeout: 12000 }),
        });
        if (res.ok) {
          const d = await res.json();
          const text = d.data?.markdown ?? '';
          const matches = (text.match(EMAIL_RE) ?? []).filter((e: string) => !SKIP_DOMAINS.some(dom => e.endsWith('@' + dom)));
          if (matches.length) { foundEmail = matches[0]; break; }
        }
      } catch { /* try next */ }
    }

    if (!foundEmail) {
      await sql`INSERT INTO lead_activities (lead_id,type,content) VALUES (${data.id},'enrich_failed','Email enrichment: no email found on website')`;
      return { lead: lead as Lead, found: false };
    }
    const [updated] = await sql`UPDATE leads SET email=${foundEmail}, email_found_at=NOW(), updated_at=NOW() WHERE id=${data.id} RETURNING *`;
    await sql`INSERT INTO lead_activities (lead_id,type,content) VALUES (${data.id},'enriched',${`Email found: ${foundEmail}`})`;
    return { lead: updated as Lead, found: true, email: foundEmail };
  });

// ── Outreach ──────────────────────────────────────────────────────────────────

export const draftOutreach = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ id: z.string().uuid() }))
  .handler(async ({ data }) => {
    const sql = db();
    const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY ?? '';
    if (!GOOGLE_API_KEY) throw new Error('GOOGLE_API_KEY not set');
    const [lead] = await sql`SELECT * FROM leads WHERE id = ${data.id}`;
    if (!lead) throw new Error('Lead not found');

    const SERVICE_LABELS: Record<string, string> = { website_rebuild:'professional website design & development', seo:'SEO optimization', chatbot:'a live chat or AI chatbot', automation:'workflow automation', booking:'an online booking system', social_media:'social media management' };
    const needs = lead.needs ?? [];
    const gaps: string[] = [];
    if (lead.has_website === false) gaps.push('no website');
    if (needs.includes('seo')) gaps.push('no SEO presence');
    if (needs.includes('chatbot')) gaps.push('no live chat');
    if (needs.includes('booking')) gaps.push('no online booking');
    if (needs.includes('social_media')) gaps.push('no social media');

    const country = (lead.country ?? '').toLowerCase();
    const signOff = country.includes('spain')||country.includes('español')||country.includes('mexico')||country.includes('colombia')||country.includes('argentina') ? 'El equipo de Oasis Studio'
      : country.includes('italy')||country.includes('italia') ? 'Il team di Oasis Studio'
      : country.includes('france')||country.includes('francia') ? "L'équipe Oasis Studio"
      : country.includes('germany')||country.includes('deutschland') ? 'Das Team von Oasis Studio'
      : country.includes('portugal')||country.includes('brazil')||country.includes('brasil') ? 'A equipa Oasis Studio'
      : 'The Oasis Studio Team';

    const langHint = lead.country
      ? `Write the ENTIRE email in the primary language of ${lead.country}. Spain/Spanish-speaking → Spanish. Italy → Italian. France → French. Germany → German. Portugal/Brazil → Portuguese. Default to English.`
      : 'Write in English.';

    const prompt = `You are writing a cold outreach email on behalf of Oasis Studio — a boutique digital studio helping local businesses grow through websites, SEO, chat automation, and digital integrations.\n\nLANGUAGE: ${langHint}\n\nLEAD CONTEXT:\nBusiness: ${lead.name}\nType: ${lead.category?.replace(/_/g,' ')}\nLocation: ${[lead.city,lead.country].filter(Boolean).join(', ')}\n${lead.has_website===false?'Website: none':`Website: ${lead.website??'unknown'}`}\n${lead.google_rating?`Google: ${lead.google_rating}/5 · ${lead.google_reviews??'?'} reviews`:''}\n${lead.analysis_notes?`Analysis: ${lead.analysis_notes}`:''}\nGaps: ${gaps.join(', ')}\n\nVOICE: Write as "we/us/our". Warm, professional, human. No bullet points. No lists. 4 paragraphs: (1) open with something genuine about their reputation, (2) digital opportunity referencing their specific gaps, (3) introduce Oasis Studio, (4) soft close. 160–200 words.\n\nSIGN-OFF: ${signOff}\n\nSUBJECT: intriguing, specific to them.\n\nOUTPUT format:\nSUBJECT: <subject>\n---\n<body>`;

    void SERVICE_LABELS;

    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${GOOGLE_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: prompt }] }], generationConfig: { maxOutputTokens: 2000, temperature: 0.7 } }),
    });
    const d = await res.json();
    if (!res.ok) throw new Error(`Gemini ${res.status}: ${d.error?.message ?? ''}`);
    const draft = d.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    if (!draft) throw new Error('Draft generation returned empty');

    const [updated] = await sql`UPDATE leads SET outreach_draft=${draft}, updated_at=NOW() WHERE id=${data.id} RETURNING *`;
    await sql`INSERT INTO lead_activities (lead_id,type,content) VALUES (${data.id},'draft_generated','Outreach email draft generated')`;
    return { lead: updated as Lead, draft };
  });

export const updateLead = createServerFn({ method: 'POST' })
  .inputValidator(z.object({
    id: z.string().uuid(),
    fields: z.record(z.string(), z.unknown()),
  }))
  .handler(async ({ data }) => {
    const sql = db();
    const allowed = ['stage','outreach_sent','notes','meeting_booked_at'] as const;
    const updates = Object.fromEntries(Object.entries(data.fields).filter(([k]) => allowed.includes(k as any)));
    if (!Object.keys(updates).length) throw new Error('No valid fields to update');

    if (updates.stage !== undefined) {
      await sql`UPDATE leads SET stage=${updates.stage as string}, updated_at=NOW() WHERE id=${data.id}`;
    }
    if (updates.outreach_sent !== undefined) {
      const sentAt = updates.outreach_sent ? new Date().toISOString() : null;
      await sql`UPDATE leads SET outreach_sent=${updates.outreach_sent as boolean}, outreach_sent_at=${sentAt}, stage=CASE WHEN stage='analyzed' THEN 'contacted' ELSE stage END, updated_at=NOW() WHERE id=${data.id}`;
    }
    const [updated] = await sql`SELECT * FROM leads WHERE id=${data.id}`;
    return { lead: updated as Lead };
  });

export const addActivity = createServerFn({ method: 'POST' })
  .inputValidator(z.object({
    leadId:  z.string().uuid(),
    type:    z.string(),
    content: z.string().optional(),
  }))
  .handler(async ({ data }) => {
    const sql = db();
    const [row] = await sql`INSERT INTO lead_activities (lead_id,type,content) VALUES (${data.leadId},${data.type},${data.content ?? null}) RETURNING *`;
    return { activity: row as Activity };
  });

// ── Proposal ──────────────────────────────────────────────────────────────────

export const generateProposal = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ id: z.string().uuid() }))
  .handler(async ({ data }) => {
    const sql = db();
    const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY ?? '';
    if (!GOOGLE_API_KEY) throw new Error('GOOGLE_API_KEY not set');
    const [lead] = await sql`SELECT * FROM leads WHERE id = ${data.id}`;
    if (!lead) throw new Error('Lead not found');

    const PALETTE: Record<string, string> = { restaurant:'deep burgundy (#2D0A0A) background, cream (#F5F0E8) text, gold (#C9A84C) accents', cafe:'warm espresso (#1A0F0A) background, ivory (#FAF6F0) text, amber (#D4A853) accents', health:'deep navy (#0A1628) background, white text, teal (#2DD4BF) accents', dental:'slate (#0F1923) background, white text, sky blue (#38BDF8) accents', boat:'deep ocean navy (#060D1A) background, white text, ocean blue (#3B82F6) accents', yacht:'deep ocean navy (#060D1A) background, white text, gold (#C9A84C) accents', hotel:'charcoal (#0F0F0F) background, white text, warm gold (#C9A84C) accents', spa:'deep plum (#1A0A1A) background, cream text, rose gold (#C9A0A0) accents', fitness:'near-black (#0A0A0A) background, white text, electric blue (#3B82F6) accents' };
    const cat = (lead.category ?? '').toLowerCase();
    let palette = 'dark slate (#0D1117) background, white text, violet (#8B5CF6) accents';
    for (const [k, v] of Object.entries(PALETTE)) { if (cat.includes(k)) { palette = v; break; } }

    const needs = lead.needs ?? [];
    let cta = 'Get in Touch';
    if (needs.includes('booking') || cat.includes('restaurant')) cta = 'Reserve a Table';
    if (cat.includes('clinic') || cat.includes('dental')) cta = 'Book an Appointment';
    if (cat.includes('boat') || cat.includes('yacht')) cta = 'Explore Our Fleet';

    const rating = lead.google_rating ? `${lead.google_rating}/5 · ${lead.google_reviews ?? '?'} Google reviews` : null;

    const prompt = `CRITICAL INSTRUCTION: Output ONLY a valid HTML document. Start immediately with <!DOCTYPE html>. No explanation, markdown, or commentary.\n\nGenerate a complete, self-contained HTML website proposal page for: ${lead.name} (${cat}) in ${[lead.city,lead.country].filter(Boolean).join(', ')}.\n\nLANGUAGE: Write ALL text in the primary language of ${lead.country ?? 'the business location'}. Spain→Spanish, Italy→Italian, France→French, Germany→German, Portugal/Brazil→Portuguese, default English.\n\nDESIGN: ${palette}. Fonts: Georgia serif for headings, system sans-serif for body. Editorial luxury style. Mobile responsive.\n\nSECTIONS:\n1. Proposal banner: "✦ Website preview for ${lead.name} — proposed by Oasis Studio"\n2. Navigation: name left, links right\n3. Hero: full viewport, business name large (clamp(3rem,8vw,7rem)), tagline for ${lead.city??'the city'}, CTA "${cta}"${rating?`, social proof "${rating}"`:''}.\n4. About: two-column, story + 3 stat numbers\n5. Services/specialty section: 3 cards relevant to ${cat}\n6. Contact: phone, address, mailto link\n7. Footer: name + "Website by Oasis Studio"\n\nCRITICAL: All styles in single <style> block. CSS custom properties. Card hover effects. No external dependencies. Start with <!DOCTYPE html>.`;

    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${GOOGLE_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: prompt }] }], generationConfig: { maxOutputTokens: 8000, temperature: 0.8 } }),
    });
    const d = await res.json();
    if (!res.ok) throw new Error(`Gemini ${res.status}: ${d.error?.message ?? ''}`);
    let html = d.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    if (!html) throw new Error('Empty response from model');
    html = html.replace(/^```html\n?/i, '').replace(/\n?```$/i, '');
    const doctypeIdx = html.search(/<!DOCTYPE/i);
    if (doctypeIdx > 0) html = html.slice(doctypeIdx);
    html = html.trim();

    try { await sql`UPDATE leads SET site_proposal=${html}, updated_at=NOW() WHERE id=${data.id}`; } catch { /* column may not exist */ }
    await sql`INSERT INTO lead_activities (lead_id,type,content) VALUES (${data.id},'note','Site proposal preview generated')`;
    return { html };
  });
