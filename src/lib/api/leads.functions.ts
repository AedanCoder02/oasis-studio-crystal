import type { Lead, Activity } from './leads.types';

async function call(action: string, payload?: Record<string, unknown>) {
  const res = await fetch('/api/leads', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, ...payload }),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || `HTTP ${res.status}`)
  }
  return res.json()
}

export const runMigrations = (_: { data: undefined }) =>
  call('migrate')

export const getLeads = ({ data }: { data: { stage?: string; minScore?: number } }) =>
  call('list', data) as Promise<{ leads: Lead[]; stageCounts: Record<string, number> }>

export const getLead = ({ data }: { data: { id: string } }) =>
  call('get', { id: data.id }) as Promise<{ lead: Lead | null; activities: Activity[] }>

export const scrapeLeads = ({ data }: { data: { location: string; keyword: string; max: number; noWebsiteOnly: boolean; minRating: number } }) =>
  call('scrape', data) as Promise<{ created: number; skipped: number; total: number; filtered_out: number; debugError?: string | null }>

export const analyzeLead = ({ data }: { data: { id: string } }) =>
  call('analyze', { id: data.id }) as Promise<{ lead: Lead }>

export const enrichLead = ({ data }: { data: { id: string } }) =>
  call('enrich', { id: data.id }) as Promise<{ lead: Lead; found: boolean; email?: string }>

export const draftOutreach = ({ data }: { data: { id: string } }) =>
  call('draft', { id: data.id }) as Promise<{ lead: Lead; draft: string }>

export const updateLead = ({ data }: { data: { id: string; fields: Record<string, unknown> } }) =>
  call('update', { id: data.id, ...data.fields }) as Promise<{ lead: Lead }>

export const addActivity = ({ data }: { data: { leadId: string; type: string; content?: string } }) =>
  call('activity', { id: data.leadId, type: data.type, content: data.content }) as Promise<{ activity: Activity }>

export const generateProposal = ({ data }: { data: { id: string } }) =>
  call('proposal', { id: data.id }) as Promise<{ html: string }>
