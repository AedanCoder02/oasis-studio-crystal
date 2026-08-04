import { createFileRoute } from '@tanstack/react-router';
import { useState, useEffect, useCallback, Fragment } from 'react';
import { runMigrations, getLeads, getLead, scrapeLeads, analyzeLead, enrichLead, draftOutreach, updateLead, addActivity, generateProposal } from '../lib/api/leads.functions';
import type { Lead, Activity, BulkOp, StageCounts } from '../lib/api/leads.types';

export const Route = createFileRoute('/admin')({
  component: AdminGate,
});

const SESSION_KEY = 'oas_admin_auth';
const TOKEN_KEY   = 'oas_admin_token';

function AdminGate() {
  const [authed, setAuthed] = useState(() => sessionStorage.getItem(SESSION_KEY) === '1');
  if (!authed) return <LoginScreen onSuccess={() => setAuthed(true)} />;
  return <AdminPage />;
}

function LoginScreen({ onSuccess }: { onSuccess: () => void }) {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${window.location.origin}/api/leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'auth', password }),
      });
      const data = await res.json();
      if (res.ok && data.token) {
        sessionStorage.setItem(TOKEN_KEY, data.token);
        sessionStorage.setItem(SESSION_KEY, '1');
        onSuccess();
      } else {
        setError('Invalid credentials.');
      }
    } catch {
      setError('Connection error. Try again.');
    }
    setLoading(false);
  }

  const inp: React.CSSProperties = {
    ...({ fontFamily: "'Inter', ui-sans-serif, sans-serif" } as const),
    width: '100%', boxSizing: 'border-box',
    background: 'oklch(0.95 0.015 75 / 0.06)',
    border: '1px solid oklch(0.95 0.015 75 / 0.12)',
    borderRadius: 8, padding: '11px 14px',
    color: 'oklch(0.95 0.015 75)', fontSize: 14, outline: 'none',
  };

  return (
    <main style={{ position: 'relative', zIndex: 1, minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Inter', ui-sans-serif, sans-serif" }}>
      <form onSubmit={handleSubmit} style={{ width: 360, background: 'oklch(0.28 0.015 65 / 0.7)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '1px solid oklch(0.95 0.015 75 / 0.1)', borderRadius: 16, padding: '40px 36px', boxShadow: '0 1px 0 0 oklch(1 0 0 / 0.08) inset, 0 20px 60px -10px oklch(0 0 0 / 0.5)' }}>
        <div style={{ marginBottom: 32, textAlign: 'center' }}>
          <div style={{ fontSize: 10, letterSpacing: '0.22em', color: 'oklch(0.7 0.015 70)', marginBottom: 6 }}>OASIS STUDIO</div>
          <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: 24, color: 'oklch(0.95 0.015 75)', letterSpacing: '0.02em' }}>Admin Access</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ display: 'block', fontSize: 11, letterSpacing: '0.1em', color: 'oklch(0.7 0.015 70)', marginBottom: 6 }}>EMAIL</label>
            <input type="email" value={email} onChange={e => { setEmail(e.target.value); setError(''); }} required autoFocus style={inp} placeholder="your@email.com" />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11, letterSpacing: '0.1em', color: 'oklch(0.7 0.015 70)', marginBottom: 6 }}>PASSWORD</label>
            <input type="password" value={password} onChange={e => { setPassword(e.target.value); setError(''); }} required style={inp} placeholder="••••••••" />
          </div>

          {error && <div style={{ fontSize: 12, color: 'oklch(0.6 0.2 25)', letterSpacing: '0.04em' }}>{error}</div>}

          <button type="submit" disabled={loading} style={{ marginTop: 8, width: '100%', padding: '12px', background: loading ? 'oklch(0.78 0.09 65 / 0.3)' : 'oklch(0.78 0.09 65 / 0.2)', border: '1px solid oklch(0.78 0.09 65 / 0.5)', borderRadius: 8, color: 'oklch(0.78 0.09 65)', fontSize: 13, fontFamily: "'Inter', sans-serif", letterSpacing: '0.1em', cursor: loading ? 'wait' : 'pointer', transition: 'all 0.15s' }}>
            {loading ? '...' : 'ENTER'}
          </button>
        </div>
      </form>
    </main>
  );
}

const INTER = { fontFamily: "'Inter', ui-sans-serif, sans-serif" } as const;
const MONO  = { fontFamily: "'JetBrains Mono','Fira Mono','Courier New',monospace" } as const;

const GLASS: React.CSSProperties = {
  background: 'oklch(0.28 0.015 65 / 0.6)',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  border: '1px solid oklch(0.95 0.015 75 / 0.1)',
  boxShadow: '0 1px 0 0 oklch(1 0 0 / 0.08) inset, 0 8px 32px -8px oklch(0 0 0 / 0.4)',
};

const STAGES: Record<string, { label: string; color: string; bg: string }> = {
  scraped:        { label: 'SCRAPED',   color: 'oklch(0.7 0.015 70)',          bg: 'oklch(0.95 0.015 75 / 0.05)' },
  analyzed:       { label: 'ANALYZED',  color: 'oklch(0.78 0.09 65)',          bg: 'oklch(0.78 0.09 65 / 0.08)'  },
  contacted:      { label: 'CONTACTED', color: '#f0b429',                      bg: 'rgba(240,180,41,0.08)'        },
  replied:        { label: 'REPLIED',   color: '#a78bfa',                      bg: 'rgba(167,139,250,0.08)'       },
  meeting_booked: { label: 'MEETING',   color: '#34d399',                      bg: 'rgba(52,211,153,0.08)'        },
  proposal:       { label: 'PROPOSAL',  color: '#60a5fa',                      bg: 'rgba(96,165,250,0.08)'        },
  negotiating:    { label: 'NEGOT.',    color: '#fb923c',                      bg: 'rgba(251,146,60,0.08)'        },
  closed:         { label: 'CLOSED',    color: '#4ade80',                      bg: 'rgba(74,222,128,0.08)'        },
  lost:           { label: 'LOST',      color: '#f87171',                      bg: 'rgba(248,113,113,0.08)'       },
};

function scoreColor(s: number) {
  if (s >= 80) return '#4ade80';
  if (s >= 60) return '#f0b429';
  if (s >= 40) return '#fb923c';
  return 'oklch(0.7 0.015 70)';
}

function relTime(ts: string) {
  const diff = Date.now() - new Date(ts).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const NICHE_PRESETS = [
  { label: 'Restaurants',       value: 'restaurants' },
  { label: 'Cafes & Bars',      value: 'cafes and bars' },
  { label: 'Dental Clinics',    value: 'dental clinics' },
  { label: 'Hair Salons',       value: 'hair salons' },
  { label: 'Yoga & Fitness',    value: 'yoga and fitness studios' },
  { label: 'Hotels & B&B',      value: 'hotels and bed and breakfast' },
  { label: 'Boat & Yacht Charter', value: 'boat and yacht charter' },
  { label: 'Real Estate',       value: 'real estate agencies' },
  { label: 'Veterinary',        value: 'veterinary clinics' },
  { label: 'Spas & Wellness',   value: 'spas and wellness centers' },
  { label: 'Law Firms',         value: 'law firms' },
  { label: 'Auto Repair',       value: 'auto repair shops' },
];

const COUNTRY_PRESETS = [
  { label: 'ES', value: 'Spain' },
  { label: 'IT', value: 'Italy' },
  { label: 'FR', value: 'France' },
  { label: 'DE', value: 'Germany' },
  { label: 'PT', value: 'Portugal' },
  { label: 'UK', value: 'United Kingdom' },
  { label: 'US', value: 'United States' },
  { label: 'MX', value: 'Mexico' },
];

const NEEDS_LABELS: Record<string, string> = {
  website_rebuild: 'WEBSITE', seo: 'SEO', chatbot: 'CHAT',
  automation: 'AUTO', booking: 'BOOK', social_media: 'SOCIAL',
};
const NEEDS_COLORS: Record<string, string> = {
  website_rebuild: '#f87171', seo: '#fb923c', chatbot: '#a78bfa',
  automation: '#60a5fa', booking: '#4ade80', social_media: '#f0b429',
};

const FUNNEL_STAGES = ['scraped','analyzed','contacted','meeting_booked','closed'] as const;

function AdminPage() {
  const [leads, setLeads]             = useState<Lead[]>([]);
  const [stageCounts, setStageCounts] = useState<StageCounts>({});
  const [stageFilter, setStageFilter] = useState('all');
  const [minScore]                    = useState(0);
  const [ready, setReady]             = useState(false);

  // Inject mobile-responsive styles once
  useEffect(() => {
    const s = document.createElement('style');
    s.id = 'admin-mobile-css';
    s.textContent = `
      @media (max-width: 768px) {
        .admin-body { flex-direction: column !important; }
        .admin-left { width: 100% !important; max-height: 55vh !important; border-right: none !important; border-bottom: 1px solid oklch(0.95 0.015 75 / 0.08) !important; }
        .admin-right { flex: 1 !important; min-height: 0 !important; }
        .admin-stats { display: none !important; }
        .admin-topbar { flex-wrap: wrap; gap: 6px; }
        .admin-back-btn { display: inline-block !important; }
      }
    `;
    if (!document.getElementById('admin-mobile-css')) document.head.appendChild(s);
    return () => { document.getElementById('admin-mobile-css')?.remove(); };
  }, []);

  // Scrape state
  const [location, setLocation]         = useState('');
  const [keyword, setKeyword]           = useState('');
  const [scraping, setScraping]         = useState(false);
  const [scrapeMsg, setScrapeMsg]       = useState('');
  const [showScrape, setShowScrape]     = useState(false);
  const [scrapeMax, setScrapeMax]       = useState(20);
  const [noWebsiteOnly, setNoWebsite]   = useState(false);
  const [minRating, setMinRating]       = useState(0);

  // Lead detail state
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [activities, setActivities]     = useState<Activity[]>([]);

  // Action state
  const [analyzing, setAnalyzing]           = useState<string | null>(null);
  const [enriching, setEnriching]           = useState<string | null>(null);
  const [drafting, setDrafting]             = useState<string | null>(null);
  const [savingStage, setSavingStage]       = useState(false);
  const [noteInput, setNoteInput]           = useState('');
  const [noteSuccess, setNoteSuccess]       = useState(false);
  const [showDraft, setShowDraft]           = useState(false);
  const [copyMsg, setCopyMsg]               = useState('');
  const [draftMsg, setDraftMsg]             = useState<Record<string, string>>({});
  const [generatingProposal, setGenProposal] = useState<string | null>(null);
  const [proposalMsg, setProposalMsg]       = useState<Record<string, string>>({});
  const [bulkOp, setBulkOp]                 = useState<BulkOp | null>(null);

  const loadLeads = useCallback(async () => {
    const res = await getLeads({ data: { stage: stageFilter !== 'all' ? stageFilter : undefined, minScore } });
    setLeads(res.leads);
    setStageCounts(res.stageCounts);
  }, [stageFilter, minScore]);

  useEffect(() => {
    const bail = setTimeout(() => setReady(true), 12000); // never hang longer than 12s
    runMigrations({ data: undefined })
      .then(() => { clearTimeout(bail); setReady(true); loadLeads(); })
      .catch((err) => { clearTimeout(bail); console.error('DB init failed:', err); setReady(true); });
    return () => clearTimeout(bail);
  }, []);

  useEffect(() => { if (ready) loadLeads(); }, [loadLeads, ready]);

  const loadDetail = useCallback(async (lead: Lead) => {
    setSelectedLead(lead);
    try {
      const res = await getLead({ data: { id: lead.id } });
      if (res.lead) setSelectedLead(res.lead);
      setActivities(res.activities ?? []);
    } catch { /* silent */ }
  }, []);

  const totalLeads = leads.length;
  const hotLeads   = leads.filter(l => l.lead_score >= 80).length;
  const avgScore   = totalLeads ? Math.round(leads.reduce((s, l) => s + l.lead_score, 0) / totalLeads) : 0;
  const contacted  = (stageCounts['contacted'] ?? 0) + (stageCounts['replied'] ?? 0) + (stageCounts['proposal'] ?? 0);

  const stageOrder = ['all','scraped','analyzed','contacted','replied','meeting_booked','proposal','negotiating','closed','lost'];

  async function handleScrape() {
    if (!location.trim() || !keyword.trim()) return;
    setScraping(true); setScrapeMsg('');
    try {
      const data = await scrapeLeads({ data: { location: location.trim(), keyword: keyword.trim(), max: scrapeMax, noWebsiteOnly, minRating } });
      if (data.debugError) { setScrapeMsg(`Debug error: ${data.debugError}`); setScraping(false); return; }
      const filteredNote = data.filtered_out > 0 ? ` · ${data.filtered_out} filtered` : '';
      setScrapeMsg(`Found ${data.total}${filteredNote} — ${data.created} new, ${data.skipped} already in CRM`);
      if (data.created > 0) setStageFilter('scraped');
      await loadLeads();
    } catch (e: any) {
      setScrapeMsg(`Error: ${e.message}`);
    }
    setScraping(false);
  }

  async function handleAnalyze(lead: Lead) {
    setAnalyzing(lead.id);
    try {
      const res = await analyzeLead({ data: { id: lead.id } });
      if (res.lead) {
        setLeads(ls => ls.map(l => l.id === lead.id ? res.lead : l));
        await loadDetail(res.lead);
      }
    } catch { /* silent */ }
    setAnalyzing(null);
  }

  async function handleEnrich(lead: Lead) {
    setEnriching(lead.id);
    try {
      const res = await enrichLead({ data: { id: lead.id } });
      if (res.lead) {
        setLeads(ls => ls.map(l => l.id === lead.id ? res.lead : l));
        setSelectedLead(res.lead);
      }
    } catch { /* silent */ }
    setEnriching(null);
  }

  async function handleDraft(lead: Lead) {
    setDrafting(lead.id); setDraftMsg(m => ({ ...m, [lead.id]: '' }));
    try {
      const res = await draftOutreach({ data: { id: lead.id } });
      if (res.lead) { setLeads(ls => ls.map(l => l.id === lead.id ? res.lead : l)); setSelectedLead(res.lead); setShowDraft(true); }
    } catch (e: any) { setDraftMsg(m => ({ ...m, [lead.id]: e.message })); }
    setDrafting(null);
  }

  async function handleStageChange(lead: Lead, stage: string) {
    setSavingStage(true);
    try {
      const res = await updateLead({ data: { id: lead.id, fields: { stage } } });
      if (res.lead) { setLeads(ls => ls.map(l => l.id === lead.id ? res.lead : l)); setSelectedLead(res.lead); await loadLeads(); }
    } catch { /* silent */ }
    setSavingStage(false);
  }

  async function handleMarkSent(lead: Lead) {
    try {
      const res = await updateLead({ data: { id: lead.id, fields: { outreach_sent: true } } });
      if (res.lead) {
        setLeads(ls => ls.map(l => l.id === lead.id ? res.lead : l));
        setSelectedLead(res.lead);
        await addActivity({ data: { leadId: lead.id, type: 'email_sent', content: 'Outreach email marked as sent' } });
        await loadDetail(res.lead);
        await loadLeads();
      }
    } catch { /* silent */ }
  }

  async function handleNote(lead: Lead) {
    if (!noteInput.trim()) return;
    try {
      await addActivity({ data: { leadId: lead.id, type: 'note', content: noteInput.trim() } });
      setNoteInput(''); setNoteSuccess(true); setTimeout(() => setNoteSuccess(false), 2000);
      await loadDetail(lead);
    } catch { /* silent */ }
  }

  function copyDraft(text: string) {
    navigator.clipboard.writeText(text).then(() => { setCopyMsg('Copied!'); setTimeout(() => setCopyMsg(''), 1500); });
  }

  async function handleProposal(lead: Lead) {
    setGenProposal(lead.id); setProposalMsg(m => ({ ...m, [lead.id]: '' }));
    // Open window synchronously before any await — browsers only allow this from a direct click handler
    const win = window.open('', '_blank');
    if (win) {
      win.document.body.style.cssText = 'background:#050508;color:#e8e8e8;font-family:monospace;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;font-size:14px;letter-spacing:.1em';
      const msg = win.document.createElement('p');
      msg.textContent = `◈ Generating preview for ${lead.name}...`;
      win.document.body.appendChild(msg);
    }
    try {
      // Direct fetch — same pattern as CAIDE-OS, avoids wrapper swallowing error details
      const base = window.location.origin;
      const token = sessionStorage.getItem('oas_admin_token') ?? '';
      const res = await fetch(`${base}/api/leads`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ action: 'proposal', id: lead.id }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        const msg = data.error ?? `HTTP ${res.status}`;
        if (win) {
          win.document.body.style.cssText = 'background:#1a0505;color:#f87171;font-family:monospace;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;font-size:16px;letter-spacing:.05em;padding:40px;box-sizing:border-box;text-align:center';
          const errP = win.document.createElement('p');
          errP.textContent = `Error: ${msg}`;
          win.document.body.replaceChildren(errP);
        }
        setProposalMsg(m => ({ ...m, [lead.id]: msg.slice(0, 200) }));
      } else {
        // Navigate the already-open window to the stable GET URL — same as CAIDE-OS
        if (win) win.location.href = `${base}/api/leads/${lead.id}/proposal`;
        await loadDetail(lead);
      }
    } catch (e: any) {
      const msg = String(e.message).slice(0, 200);
      if (win) {
        win.document.body.style.cssText = 'background:#1a0505;color:#f87171;font-family:monospace;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;font-size:16px;letter-spacing:.05em;padding:40px;box-sizing:border-box;text-align:center';
        const errP = win.document.createElement('p');
        errP.textContent = `Error: ${msg}`;
        win.document.body.replaceChildren(errP);
      }
      setProposalMsg(m => ({ ...m, [lead.id]: msg }));
    }
    setGenProposal(null);
  }

  async function handleBulk(action: 'enrich' | 'analyze' | 'draft') {
    const targets = leads.filter(l => {
      if (action === 'enrich')  return !!l.website && !l.email;
      if (action === 'analyze') return l.stage === 'scraped';
      if (action === 'draft')   return (l.stage === 'analyzed' || l.stage === 'scraped') && !l.outreach_draft;
      return false;
    });
    if (!targets.length) return;
    setBulkOp({ action, total: targets.length, done: 0, errors: 0 });
    const fns = { enrich: enrichLead, analyze: analyzeLead, draft: draftOutreach } as const;
    for (let i = 0; i < targets.length; i += 3) {
      await Promise.all(targets.slice(i, i + 3).map(async lead => {
        try {
          await fns[action]({ data: { id: lead.id } });
          setBulkOp(op => op ? { ...op, done: op.done + 1 } : null);
        } catch {
          setBulkOp(op => op ? { ...op, done: op.done + 1, errors: op.errors + 1 } : null);
        }
      }));
    }
    await loadLeads();
    setBulkOp(null);
  }

  // ── Inner components ────────────────────────────────────────────────────────

  function ScrapePanel() {
    const chipStyle = (active: boolean): React.CSSProperties => ({
      ...INTER, fontSize: 8, padding: '3px 8px', cursor: 'pointer',
      borderRadius: 4, letterSpacing: '0.06em', border: 'none',
      background: active ? 'oklch(0.78 0.09 65 / 0.2)' : 'oklch(0.95 0.015 75 / 0.04)',
      color:      active ? 'oklch(0.78 0.09 65)'       : 'oklch(0.7 0.015 70)',
      outline:    active ? '1px solid oklch(0.78 0.09 65 / 0.5)' : '1px solid oklch(0.95 0.015 75 / 0.1)',
    });
    const inputStyle: React.CSSProperties = {
      ...INTER, fontSize: 9,
      background: 'oklch(0.95 0.015 75 / 0.08)',
      border: '1px solid oklch(0.95 0.015 75 / 0.12)',
      borderRadius: 6,
      padding: '6px 10px',
      color: 'oklch(0.95 0.015 75)',
      outline: 'none',
    };

    return (
      <div style={{ ...GLASS, borderRadius: 8, padding: '14px 16px', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: showScrape ? 12 : 0 }}>
          <div style={{ ...INTER, fontSize: 9, color: 'oklch(0.78 0.09 65)', letterSpacing: '0.14em', fontWeight: 700 }}>◈ GOOGLE MAPS SCRAPER</div>
          <button onClick={() => setShowScrape(s => !s)} style={{ ...INTER, fontSize: 9, color: 'oklch(0.7 0.015 70)', background: 'none', border: 'none', cursor: 'pointer' }}>
            {showScrape ? '▴' : '▾'}
          </button>
        </div>

        {showScrape && (
          <>
            <div style={{ ...INTER, fontSize: 7, color: 'oklch(0.7 0.015 70)', letterSpacing: '0.1em', marginBottom: 5 }}>NICHE</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 10 }}>
              {NICHE_PRESETS.map(n => (
                <button key={n.value} style={chipStyle(keyword === n.value)} onClick={() => setKeyword(keyword === n.value ? '' : n.value)}>{n.label}</button>
              ))}
              <input value={NICHE_PRESETS.some(n => n.value === keyword) ? '' : keyword} onChange={e => setKeyword(e.target.value)}
                placeholder="Custom niche..." style={{ ...inputStyle, flex: '1 1 120px', fontSize: 8 }} />
            </div>

            <div style={{ ...INTER, fontSize: 7, color: 'oklch(0.7 0.015 70)', letterSpacing: '0.1em', marginBottom: 5 }}>LOCATION</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 10, alignItems: 'center' }}>
              {COUNTRY_PRESETS.map(c => {
                const active = location.toLowerCase().includes(c.value.toLowerCase());
                return (
                  <button key={c.value} style={chipStyle(active)} onClick={() => {
                    const city = location.split(',')[0].trim();
                    setLocation(city ? `${city}, ${c.value}` : c.value);
                  }}>{c.label}</button>
                );
              })}
              <input value={location} onChange={e => setLocation(e.target.value)} placeholder="City, Country"
                style={{ ...inputStyle, flex: '1 1 160px', fontSize: 9 }} />
            </div>

            <div style={{ ...INTER, fontSize: 7, color: 'oklch(0.7 0.015 70)', letterSpacing: '0.1em', marginBottom: 5 }}>FILTERS</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', marginBottom: 12 }}>
              <button onClick={() => setNoWebsite(v => !v)} style={chipStyle(noWebsiteOnly)}>{noWebsiteOnly ? '✓' : '○'} No website only</button>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ ...INTER, fontSize: 8, color: 'oklch(0.7 0.015 70)' }}>Min rating</span>
                {[0, 3.5, 4.0, 4.5].map(r => (
                  <button key={r} style={chipStyle(minRating === r)} onClick={() => setMinRating(r)}>{r === 0 ? 'OFF' : `${r}★`}</button>
                ))}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ ...INTER, fontSize: 8, color: 'oklch(0.7 0.015 70)' }}>Max</span>
                {[5, 10, 20].map(n => (
                  <button key={n} style={chipStyle(scrapeMax === n)} onClick={() => setScrapeMax(n)}>{n}</button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button onClick={handleScrape} disabled={scraping || !location.trim() || !keyword.trim()} style={{
                ...INTER, fontSize: 9, padding: '7px 18px', cursor: scraping ? 'wait' : 'pointer',
                background: scraping ? 'oklch(0.78 0.09 65 / 0.06)' : 'oklch(0.78 0.09 65 / 0.15)',
                border: '1px solid oklch(0.78 0.09 65 / 0.35)',
                color: scraping ? 'oklch(0.78 0.09 65 / 0.35)' : 'oklch(0.78 0.09 65)',
                borderRadius: 6, letterSpacing: '0.12em',
              }}>{scraping ? '◌ SCRAPING...' : '▶ SCRAPE'}</button>
              <div style={{ ...INTER, fontSize: 8, color: 'oklch(0.7 0.015 70 / 0.6)' }}>
                {keyword && location ? `"${keyword}" in ${location}` : 'Select niche + location'}
              </div>
            </div>
            {scrapeMsg && (
              <div style={{ ...INTER, fontSize: 8, color: scrapeMsg.startsWith('Error') ? '#f87171' : '#4ade80', marginTop: 7, letterSpacing: '0.06em' }}>
                {scrapeMsg}
              </div>
            )}
          </>
        )}
      </div>
    );
  }

  function AutomationBar() {
    const funnelData = FUNNEL_STAGES.map(s => ({ key: s, label: STAGES[s]?.label ?? s.toUpperCase(), color: STAGES[s]?.color ?? 'oklch(0.7 0.015 70)', count: stageCounts[s] ?? 0 }));
    const canEnrich  = leads.filter(l => !!l.website && !l.email).length;
    const canAnalyze = leads.filter(l => l.stage === 'scraped').length;
    const canDraft   = leads.filter(l => (l.stage==='analyzed'||l.stage==='scraped') && !l.outreach_draft).length;

    return (
      <div style={{ ...GLASS, borderRadius: 6, padding: '10px 14px', marginBottom: 10 }}>
        <div style={{ ...INTER, fontSize: 7, color: 'oklch(0.78 0.09 65 / 0.7)', letterSpacing: '0.16em', fontWeight: 700, marginBottom: 8 }}>◈ AUTOMATION PIPELINE</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 10, flexWrap: 'wrap' }}>
          {funnelData.map((f, i) => (
            <div key={f.key} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ ...MONO, fontSize: 15, fontWeight: 700, color: f.color, lineHeight: 1 }}>{f.count}</div>
                <div style={{ ...INTER, fontSize: 6, color: 'oklch(0.7 0.015 70)', letterSpacing: '0.1em', marginTop: 1 }}>{f.label}</div>
              </div>
              {i < funnelData.length - 1 && <span style={{ ...INTER, fontSize: 8, color: 'oklch(0.78 0.09 65 / 0.4)', margin: '0 2px' }}>→</span>}
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
          {[
            { action: 'enrich'  as const, label: '✉ ENRICH ALL',  count: canEnrich,  color: '#34d399' },
            { action: 'analyze' as const, label: '◎ ANALYZE ALL', count: canAnalyze, color: 'oklch(0.78 0.09 65)' },
            { action: 'draft'   as const, label: '◇ DRAFT ALL',   count: canDraft,   color: '#a78bfa' },
          ].map(({ action, label, count, color }) => (
            <button key={action} onClick={() => handleBulk(action)} disabled={count === 0 || !!bulkOp} style={{ ...INTER, fontSize: 7, padding: '4px 10px', cursor: count===0||bulkOp?'not-allowed':'pointer', background: count>0?`${color}18`:'transparent', border:`1px solid ${count>0?`${color}50`:'oklch(0.95 0.015 75 / 0.08)'}`, color: count>0?color:'oklch(0.7 0.015 70)', borderRadius: 4, letterSpacing: '0.08em' }}>
              {label} {count > 0 ? `(${count})` : ''}
            </button>
          ))}
        </div>
        {bulkOp && (
          <div style={{ marginTop: 8 }}>
            <div style={{ ...INTER, fontSize: 7, color: 'oklch(0.7 0.015 70)', marginBottom: 4 }}>
              {bulkOp.action.toUpperCase()} — {bulkOp.done}/{bulkOp.total}
              {bulkOp.errors > 0 && <span style={{ color: '#f87171' }}> · {bulkOp.errors} errors</span>}
            </div>
            <div style={{ background: 'oklch(0.95 0.015 75 / 0.06)', height: 3, borderRadius: 2 }}>
              <div style={{ width: `${Math.round((bulkOp.done/bulkOp.total)*100)}%`, height: '100%', borderRadius: 2, background: 'oklch(0.78 0.09 65)', transition: 'width 0.3s ease' }} />
            </div>
          </div>
        )}
      </div>
    );
  }

  function LeadCard({ lead }: { lead: Lead }) {
    const stage      = STAGES[lead.stage] ?? STAGES['scraped'];
    const isSelected = selectedLead?.id === lead.id;
    return (
      <div onClick={() => loadDetail(lead)} style={{
        borderLeft: `3px solid ${isSelected ? 'oklch(0.78 0.09 65)' : 'oklch(0.95 0.015 75 / 0.07)'}`,
        borderBottom: '1px solid oklch(0.95 0.015 75 / 0.05)',
        background: isSelected ? 'oklch(0.28 0.015 65 / 0.5)' : 'transparent',
        padding: '9px 12px 9px 10px', cursor: 'pointer', transition: 'all 0.1s',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 3 }}>
          <div style={{ ...INTER, fontSize: 11, fontWeight: 600, color: isSelected ? 'oklch(0.95 0.015 75)' : 'oklch(0.95 0.015 75 / 0.82)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', letterSpacing: '0.01em' }}>
            {lead.name}
          </div>
          <div style={{ ...MONO, fontSize: 15, fontWeight: 700, color: scoreColor(lead.lead_score), flexShrink: 0 }}>{lead.lead_score}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
          <div style={{ ...INTER, fontSize: 8, color: 'oklch(0.7 0.015 70)', letterSpacing: '0.04em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
            {[lead.category?.replace(/_/g, ' '), lead.city].filter(Boolean).join(' · ').toUpperCase()}
          </div>
          <div style={{ display: 'flex', gap: 4, flexShrink: 0, alignItems: 'center' }}>
            {lead.email         && <span style={{ fontSize: 9, color: '#34d399' }} title="Email found">✉</span>}
            {lead.outreach_sent && <span style={{ fontSize: 9, color: '#f0b429' }} title="Outreach sent">▶</span>}
            {lead.meeting_booked_at && <span style={{ fontSize: 9, color: '#4ade80' }} title="Call booked">★</span>}
            <span style={{ ...INTER, fontSize: 6, padding: '2px 5px', background: stage.bg, color: stage.color, borderRadius: 3, letterSpacing: '0.07em', whiteSpace: 'nowrap' }}>{stage.label}</span>
          </div>
        </div>
        {(lead.needs ?? []).length > 0 && (
          <div style={{ display: 'flex', gap: 3, marginTop: 5, flexWrap: 'wrap' }}>
            {(lead.needs ?? []).slice(0, 4).map(n => (
              <span key={n} style={{ ...INTER, fontSize: 6, padding: '1px 4px', background: `${NEEDS_COLORS[n] ?? '#888'}14`, color: NEEDS_COLORS[n] ?? '#888', borderRadius: 3, letterSpacing: '0.06em' }}>
                {NEEDS_LABELS[n] ?? n}
              </span>
            ))}
          </div>
        )}
      </div>
    );
  }

  function DetailPanel({ lead }: { lead: Lead }) {
    const stage = STAGES[lead.stage] ?? STAGES['scraped'];
    void stage;
    return (
      <div style={{ height: '100%', overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: 18, fontWeight: 400, color: 'oklch(0.95 0.015 75)', letterSpacing: '0.01em', marginBottom: 4 }}>{lead.name}</div>
            <div style={{ ...INTER, fontSize: 10, color: 'oklch(0.7 0.015 70)', letterSpacing: '0.04em' }}>
              {[lead.category, lead.address, lead.city, lead.country].filter(Boolean).join(' · ')}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ ...MONO, fontSize: 28, fontWeight: 700, color: scoreColor(lead.lead_score) }}>{lead.lead_score}</div>
            <button onClick={() => handleAnalyze(lead)} disabled={analyzing === lead.id}
              style={{ ...INTER, fontSize: 9, padding: '5px 13px', cursor: 'pointer', borderRadius: 6, background: 'oklch(0.78 0.09 65 / 0.15)', border: '1px solid oklch(0.78 0.09 65 / 0.35)', color: analyzing === lead.id ? 'oklch(0.78 0.09 65 / 0.35)' : 'oklch(0.78 0.09 65)', letterSpacing: '0.07em' }}>
              {analyzing === lead.id ? '...' : '◎ ANALYZE'}
            </button>
          </div>
        </div>

        {/* Contact */}
        <div style={{ ...GLASS, borderRadius: 8, padding: '12px 16px' }}>
          <div style={{ ...INTER, fontSize: 9, color: 'oklch(0.7 0.015 70)', letterSpacing: '0.12em', marginBottom: 10 }}>CONTACT</div>
          {lead.phone && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 7 }}>
              <span style={{ ...INTER, fontSize: 9, color: 'oklch(0.7 0.015 70)', width: 42 }}>TEL</span>
              <a href={`tel:${lead.phone}`} style={{ ...INTER, fontSize: 11, color: '#4ade80', textDecoration: 'none' }}>{lead.phone}</a>
            </div>
          )}
          {lead.email ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 7 }}>
              <span style={{ ...INTER, fontSize: 9, color: 'oklch(0.7 0.015 70)', width: 42 }}>EMAIL</span>
              <a href={`mailto:${lead.email}`} style={{ ...INTER, fontSize: 11, color: '#60a5fa', textDecoration: 'none' }}>{lead.email}</a>
            </div>
          ) : lead.website && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 7 }}>
              <span style={{ ...INTER, fontSize: 9, color: 'oklch(0.7 0.015 70)', width: 42 }}>EMAIL</span>
              <button onClick={() => handleEnrich(lead)} disabled={enriching === lead.id}
                style={{ ...INTER, fontSize: 9, padding: '3px 9px', cursor: 'pointer', borderRadius: 6, background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.25)', color: enriching === lead.id ? 'rgba(52,211,153,0.3)' : 'rgba(52,211,153,0.8)', letterSpacing: '0.07em' }}>
                {enriching === lead.id ? '◌ Searching...' : '✉ FIND EMAIL'}
              </button>
            </div>
          )}
          {lead.website && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 7 }}>
              <span style={{ ...INTER, fontSize: 9, color: 'oklch(0.7 0.015 70)', width: 42 }}>WEB</span>
              <a href={lead.website} target="_blank" rel="noreferrer" style={{ ...INTER, fontSize: 11, color: '#a78bfa', textDecoration: 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 320 }}>
                {lead.website.replace(/^https?:\/\//, '')}
              </a>
            </div>
          )}
          {lead.google_maps_url && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ ...INTER, fontSize: 9, color: 'oklch(0.7 0.015 70)', width: 42 }}>MAPS</span>
              <a href={lead.google_maps_url} target="_blank" rel="noreferrer" style={{ ...INTER, fontSize: 11, color: '#fb923c', textDecoration: 'none' }}>Open in Google Maps ↗</a>
            </div>
          )}
          {!lead.phone && !lead.email && !lead.website && !lead.google_maps_url && (
            <div style={{ ...INTER, fontSize: 10, color: 'oklch(0.7 0.015 70)' }}>No contact info available</div>
          )}
        </div>

        {/* Analysis */}
        {lead.analysis_notes && (
          <div style={{ background: 'oklch(0.78 0.09 65 / 0.06)', border: '1px solid oklch(0.78 0.09 65 / 0.15)', borderRadius: 8, padding: '14px 16px' }}>
            <div style={{ ...INTER, fontSize: 9, color: 'oklch(0.78 0.09 65 / 0.7)', letterSpacing: '0.12em', marginBottom: 9 }}>ANALYSIS</div>
            <div style={{ ...INTER, fontSize: 11, color: 'oklch(0.95 0.015 75 / 0.7)', lineHeight: 1.65 }}>{lead.analysis_notes}</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 10 }}>
              {(lead.needs ?? []).map(n => (
                <span key={n} style={{ ...INTER, fontSize: 9, padding: '3px 8px', background: `${NEEDS_COLORS[n] ?? '#888'}18`, color: NEEDS_COLORS[n] ?? '#888', borderRadius: 4, letterSpacing: '0.06em' }}>
                  {NEEDS_LABELS[n] ?? n}
                </span>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 6, marginTop: 12, flexWrap: 'wrap' }}>
              {[{ label: 'WEBSITE', val: lead.has_website }, { label: 'LIVE CHAT', val: lead.has_chat }, { label: 'BOOKING', val: lead.has_booking }, { label: 'SEO', val: lead.has_seo }].map(({ label, val }) => (
                <span key={label} style={{ ...INTER, fontSize: 9, padding: '4px 9px', borderRadius: 4, letterSpacing: '0.05em', background: val === null ? 'oklch(0.95 0.015 75 / 0.03)' : val ? 'rgba(74,222,128,0.1)' : 'rgba(248,113,113,0.08)', color: val === null ? 'oklch(0.7 0.015 70)' : val ? '#4ade80' : '#f87171', border: `1px solid ${val === null ? 'oklch(0.95 0.015 75 / 0.06)' : val ? 'rgba(74,222,128,0.3)' : 'rgba(248,113,113,0.2)'}` }}>
                  {val === null ? '– ' : val ? '✓ HAS ' : 'NO '}{label}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Stage selector */}
        <div>
          <div style={{ ...INTER, fontSize: 9, color: 'oklch(0.7 0.015 70)', letterSpacing: '0.12em', marginBottom: 7 }}>PIPELINE STAGE</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
            {Object.entries(STAGES).map(([key, val]) => (
              <button key={key} onClick={() => handleStageChange(lead, key)} disabled={savingStage} style={{ ...INTER, fontSize: 9, padding: '4px 10px', cursor: 'pointer', borderRadius: 4, letterSpacing: '0.06em', background: lead.stage === key ? val.bg : 'transparent', border: `1px solid ${lead.stage === key ? val.color : 'oklch(0.95 0.015 75 / 0.08)'}`, color: lead.stage === key ? val.color : 'oklch(0.7 0.015 70)' }}>
                {val.label}
              </button>
            ))}
          </div>
        </div>

        {/* Outreach */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <div style={{ ...INTER, fontSize: 9, color: 'oklch(0.7 0.015 70)', letterSpacing: '0.12em' }}>OUTREACH</div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <button onClick={() => handleDraft(lead)} disabled={drafting === lead.id} style={{ ...INTER, fontSize: 9, padding: '5px 11px', cursor: 'pointer', borderRadius: 6, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.25)', color: drafting === lead.id ? 'rgba(167,139,250,0.3)' : 'rgba(167,139,250,0.85)', letterSpacing: '0.06em' }}>
                {drafting === lead.id ? 'Generating...' : lead.outreach_draft ? '↺ REDRAFT' : '◇ DRAFT EMAIL'}
              </button>
              {lead.outreach_draft && !lead.outreach_sent && (
                <button onClick={() => handleMarkSent(lead)} style={{ ...INTER, fontSize: 9, padding: '5px 11px', cursor: 'pointer', borderRadius: 6, background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.25)', color: 'rgba(74,222,128,0.85)', letterSpacing: '0.06em' }}>✓ MARK SENT</button>
              )}
              {lead.outreach_sent && <span style={{ ...INTER, fontSize: 9, color: '#4ade80', letterSpacing: '0.06em' }}>✓ SENT</span>}
            </div>
          </div>
          {draftMsg[lead.id] && <div style={{ ...INTER, fontSize: 9, color: '#f87171', marginBottom: 6 }}>{draftMsg[lead.id].slice(0, 140)}</div>}
          {lead.outreach_draft ? (
            <>
              <button onClick={() => setShowDraft(d => !d)} style={{ ...INTER, fontSize: 9, color: 'oklch(0.7 0.015 70)', background: 'none', border: 'none', cursor: 'pointer', padding: '0 0 6px', letterSpacing: '0.06em' }}>
                {showDraft ? '▾ hide draft' : '▸ show draft'}
              </button>
              {showDraft && (
                <div style={{ position: 'relative' }}>
                  <pre style={{ ...INTER, fontSize: 10, color: 'oklch(0.95 0.015 75 / 0.7)', lineHeight: 1.75, background: 'oklch(0.95 0.015 75 / 0.03)', border: '1px solid oklch(0.95 0.015 75 / 0.07)', borderRadius: 6, padding: '12px 14px', whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: 0 }}>
                    {lead.outreach_draft}
                  </pre>
                  <button onClick={() => copyDraft(lead.outreach_draft!)} style={{ position: 'absolute', top: 7, right: 7, ...INTER, fontSize: 8, padding: '3px 8px', cursor: 'pointer', background: 'oklch(0.22 0.018 60 / 0.9)', border: '1px solid oklch(0.95 0.015 75 / 0.15)', color: 'oklch(0.7 0.015 70)', borderRadius: 4 }}>
                    {copyMsg || 'COPY'}
                  </button>
                </div>
              )}
              {showDraft && (() => {
                const lines = (lead.outreach_draft ?? '').split('\n');
                const subjLine = lines.find(l => l.startsWith('SUBJECT:'));
                const subject = subjLine ? subjLine.replace('SUBJECT:', '').trim() : 'Introduction from Oasis Studio';
                const bodyIdx = (lead.outreach_draft ?? '').indexOf('---\n');
                const body = bodyIdx >= 0 ? (lead.outreach_draft ?? '').slice(bodyIdx + 4) : (lead.outreach_draft ?? '');
                return (
                  <div style={{ marginTop: 8 }}>
                    <a href={`mailto:${lead.email ?? ''}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`} style={{ ...INTER, fontSize: 9, padding: '5px 12px', borderRadius: 6, textDecoration: 'none', background: 'rgba(96,165,250,0.1)', border: '1px solid rgba(96,165,250,0.3)', color: 'rgba(96,165,250,0.9)', letterSpacing: '0.06em' }}>
                      ✉ OPEN IN EMAIL
                    </a>
                  </div>
                );
              })()}
            </>
          ) : (
            <div style={{ ...INTER, fontSize: 10, color: 'oklch(0.7 0.015 70)', fontStyle: 'italic' }}>No draft yet. Analyze first, then Draft Email.</div>
          )}
        </div>

        {/* Site Proposal */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <div style={{ ...INTER, fontSize: 9, color: 'oklch(0.7 0.015 70)', letterSpacing: '0.12em' }}>SITE PROPOSAL</div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
              <button onClick={() => handleProposal(lead)} disabled={generatingProposal === lead.id} style={{ ...INTER, fontSize: 9, padding: '5px 11px', cursor: 'pointer', borderRadius: 6, background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.25)', color: generatingProposal === lead.id ? 'rgba(52,211,153,0.3)' : 'rgba(52,211,153,0.85)', letterSpacing: '0.06em' }}>
                {generatingProposal === lead.id ? 'Generating...' : '◈ GENERATE PREVIEW'}
              </button>
              {proposalMsg[lead.id] && <div style={{ ...INTER, fontSize: 8, color: '#f87171', maxWidth: 280 }}>{proposalMsg[lead.id].slice(0, 140)}</div>}
            </div>
          </div>
          <div style={{ ...INTER, fontSize: 9, color: 'oklch(0.7 0.015 70)', fontStyle: 'italic' }}>
            Generates a personalised website mockup — opens in a new tab.
          </div>
        </div>

        {/* Notes */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <div style={{ ...INTER, fontSize: 9, color: 'oklch(0.7 0.015 70)', letterSpacing: '0.12em' }}>LOG NOTE / CALL / REPLY</div>
            {noteSuccess && <span style={{ ...INTER, fontSize: 9, color: '#4ade80' }}>✓ Saved</span>}
          </div>
          <div style={{ display: 'flex', gap: 7 }}>
            <input value={noteInput} onChange={e => setNoteInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleNote(lead)}
              placeholder="e.g. Called — spoke to manager, follow up Friday"
              style={{ ...INTER, flex: 1, fontSize: 10, background: 'oklch(0.95 0.015 75 / 0.06)', border: '1px solid oklch(0.95 0.015 75 / 0.1)', borderRadius: 6, padding: '6px 10px', color: 'oklch(0.95 0.015 75)', outline: 'none' }} />
            <button onClick={() => handleNote(lead)} style={{ ...INTER, fontSize: 9, padding: '6px 12px', cursor: 'pointer', borderRadius: 6, background: 'oklch(0.78 0.09 65 / 0.12)', border: '1px solid oklch(0.78 0.09 65 / 0.3)', color: 'oklch(0.78 0.09 65)', letterSpacing: '0.07em' }}>ADD</button>
          </div>
        </div>

        {/* Activity Log */}
        <div>
          <div style={{ ...INTER, fontSize: 9, color: 'oklch(0.7 0.015 70)', letterSpacing: '0.12em', marginBottom: 10 }}>
            ACTIVITY TIMELINE {activities.length > 0 && <span style={{ color: 'oklch(0.7 0.015 70 / 0.5)' }}>({activities.length})</span>}
          </div>
          {activities.length === 0 ? (
            <div style={{ ...INTER, fontSize: 10, color: 'oklch(0.7 0.015 70 / 0.6)', fontStyle: 'italic' }}>No activity yet.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {[...activities].reverse().map((a, i) => {
                const ACT_LABELS: Record<string, string> = { stage_change:'Stage updated', analyzed:'Website analyzed', enriched:'Email found', enrich_failed:'Email not found', draft_generated:'Outreach email drafted', email_sent:'Outreach email sent', note:'', reply_received:'Reply received' };
                const ACT_COLORS: Record<string, string> = { stage_change:'#60a5fa', analyzed:'oklch(0.78 0.09 65)', enriched:'#34d399', enrich_failed:'#f87171', draft_generated:'#a78bfa', email_sent:'#f0b429', note:'oklch(0.7 0.015 70)', reply_received:'#4ade80' };
                const color = ACT_COLORS[a.type] ?? 'oklch(0.7 0.015 70)';
                const label = ACT_LABELS[a.type] ?? a.type.replace(/_/g,' ');
                return (
                  <div key={a.id} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', paddingBottom: 10, borderLeft: i < activities.length - 1 ? '1px solid oklch(0.95 0.015 75 / 0.07)' : 'none', marginLeft: 5, paddingLeft: 12, position: 'relative' }}>
                    <div style={{ position: 'absolute', left: -4, top: 3, width: 7, height: 7, borderRadius: '50%', background: color }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ ...INTER, fontSize: 10, color, fontWeight: 600 }}>{a.type === 'note' ? 'Note' : label}</div>
                      {a.content && <div style={{ ...INTER, fontSize: 10, color: 'oklch(0.95 0.015 75 / 0.6)', lineHeight: 1.55, marginTop: 2 }}>{a.content}</div>}
                      <div style={{ ...INTER, fontSize: 8, color: 'oklch(0.7 0.015 70 / 0.6)', marginTop: 3 }}>{relTime(a.created_at)}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {!lead.analysis_notes && (
          <div style={{ ...INTER, fontSize: 9, color: 'oklch(0.7 0.015 70 / 0.6)', letterSpacing: '0.08em' }}>
            Click ANALYZE to assess this lead's digital presence.
          </div>
        )}
      </div>
    );
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <main style={{ background: 'transparent', height: '100dvh', display: 'flex', flexDirection: 'column', position: 'relative', zIndex: 1, ...INTER }}>
      {/* Top bar */}
      <div className="admin-topbar" style={{ ...GLASS, padding: '10px 20px', borderBottom: '1px solid oklch(0.95 0.015 75 / 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div>
          <span style={{ ...INTER, fontSize: 9, letterSpacing: '0.2em', color: 'oklch(0.7 0.015 70)', marginRight: 14, textTransform: 'uppercase' }}>Oasis Studio · Admin</span>
          <span style={{ fontFamily: "'Instrument Serif', serif", fontSize: 20, fontWeight: 400, color: 'oklch(0.95 0.015 75)' }}>LEAD ACQUISITION</span>
        </div>
        <div className="admin-stats" style={{ display: 'flex', gap: 24 }}>
          {[
            { label: 'TOTAL', value: totalLeads, color: 'oklch(0.95 0.015 75 / 0.7)' },
            { label: 'HOT', value: hotLeads, color: '#4ade80' },
            { label: 'AVG', value: avgScore, color: scoreColor(avgScore) },
            { label: 'CONTACTED', value: contacted, color: '#f0b429' },
            { label: 'CLOSED', value: stageCounts['closed'] ?? 0, color: '#4ade80' },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ textAlign: 'center' }}>
              <div style={{ ...MONO, fontSize: 18, fontWeight: 700, color, lineHeight: 1 }}>{value}</div>
              <div style={{ ...INTER, fontSize: 7, color: 'oklch(0.7 0.015 70)', letterSpacing: '0.12em', marginTop: 1 }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Body */}
      <div className="admin-body" style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Left column — single scrollable container (same pattern as CAIDE-OS) */}
        <div className="admin-left" style={{ width: 280, flexShrink: 0, borderRight: '1px solid oklch(0.95 0.015 75 / 0.06)', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'oklch(0.22 0.018 60 / 0.3)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}>

          {/* Single scrollable body — ScrapePanel + AutomationBar + filter + lead cards all scroll together */}
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>

            {/* Scrape + automation */}
            <div style={{ padding: '10px 12px', borderBottom: '1px solid oklch(0.95 0.015 75 / 0.06)', flexShrink: 0 }}>
              {ready && <ScrapePanel />}
              {ready && <AutomationBar />}
            </div>

            {/* Stage filter */}
            <div style={{ padding: '8px 12px', borderBottom: '1px solid oklch(0.95 0.015 75 / 0.06)', display: 'flex', gap: 4, overflowX: 'auto', flexShrink: 0 }}>
              {stageOrder.map(s => {
                const active = stageFilter === s;
                const cnt = s === 'all' ? totalLeads : (stageCounts[s] ?? 0);
                return (
                  <button key={s} onClick={() => setStageFilter(s)} style={{
                    ...INTER, fontSize: 7, padding: '3px 7px', cursor: 'pointer', flexShrink: 0,
                    background: active ? 'oklch(0.78 0.09 65 / 0.2)' : 'transparent',
                    border: `1px solid ${active ? 'oklch(0.78 0.09 65 / 0.5)' : 'oklch(0.95 0.015 75 / 0.08)'}`,
                    color: active ? 'oklch(0.78 0.09 65)' : 'oklch(0.7 0.015 70)',
                    borderRadius: 4, letterSpacing: '0.08em',
                  }}>
                    {s === 'all' ? 'ALL' : (STAGES[s]?.label ?? s.toUpperCase())} {cnt > 0 ? `(${cnt})` : ''}
                  </button>
                );
              })}
            </div>

            {/* Lead cards */}
            <div style={{ padding: '6px 8px' }}>
              {!ready ? (
                <div style={{ textAlign: 'center', padding: '40px 12px', color: 'oklch(0.7 0.015 70)', fontSize: 9 }}>◌ Initialising database...</div>
              ) : leads.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 12px', color: 'oklch(0.7 0.015 70)', fontSize: 9 }}>No leads. Scrape Google Maps to start.</div>
              ) : (
                leads.map(l => <Fragment key={l.id}><LeadCard lead={l} /></Fragment>)
              )}
            </div>

          </div>
        </div>

        {/* Right column */}
        <div className="admin-right" style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {selectedLead ? (
            <>
              <div style={{ padding: '10px 20px', borderBottom: '1px solid oklch(0.95 0.015 75 / 0.06)', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0, background: 'oklch(0.28 0.015 65 / 0.3)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}>
                <button onClick={() => setSelectedLead(null)} style={{ ...INTER, fontSize: 10, color: 'oklch(0.7 0.015 70)', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 6px 2px 0', letterSpacing: '0.06em', display: 'none' }} className="admin-back-btn">← Back</button>
                <span style={{ ...INTER, fontSize: 11, color: 'oklch(0.7 0.015 70)', letterSpacing: '0.08em' }}>▸ {selectedLead.name}</span>
                <span style={{ ...INTER, fontSize: 10, color: STAGES[selectedLead.stage]?.color }}>· {STAGES[selectedLead.stage]?.label}</span>
              </div>
              <div style={{ flex: 1, overflow: 'hidden' }}><DetailPanel lead={selectedLead} /></div>
            </>
          ) : (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 10 }}>
              <div style={{ fontSize: 28, color: 'oklch(0.78 0.09 65 / 0.15)' }}>◈</div>
              <div style={{ ...INTER, fontSize: 9, color: 'oklch(0.7 0.015 70)', letterSpacing: '0.15em' }}>SELECT A LEAD TO VIEW DETAILS</div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
