import type { Lead, Activity } from './leads.types';

const API = '/api/leads'

async function post(path: string, body?: unknown) {
  const res = await fetch(`${API}/${path}`, {
    method: 'POST',
    headers: body !== undefined ? { 'Content-Type': 'application/json' } : {},
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || `HTTP ${res.status}`)
  }
  return res.json()
}

export const runMigrations = (_: { data: undefined }) => post('migrate')

export const getLeads = ({ data }: { data: { stage?: string; minScore?: number } }) =>
  post('list', data) as Promise<{ leads: Lead[]; stageCounts: Record<string, number> }>

export const getLead = ({ data }: { data: { id: string } }) =>
  post(`${data.id}/get`) as Promise<{ lead: Lead | null; activities: Activity[] }>

export const scrapeLeads = ({ data }: { data: { location: string; keyword: string; max: number; noWebsiteOnly: boolean; minRating: number } }) =>
  post('scrape', data) as Promise<{ created: number; skipped: number; total: number; filtered_out: number; debugError?: string | null }>

export const analyzeLead = ({ data }: { data: { id: string } }) =>
  post(`${data.id}/analyze`) as Promise<{ lead: Lead }>

export const enrichLead = ({ data }: { data: { id: string } }) =>
  post(`${data.id}/enrich`) as Promise<{ lead: Lead; found: boolean; email?: string }>

export const draftOutreach = ({ data }: { data: { id: string } }) =>
  post(`${data.id}/draft`) as Promise<{ lead: Lead; draft: string }>

export const updateLead = ({ data }: { data: { id: string; fields: Record<string, unknown> } }) =>
  post(`${data.id}/update`, data.fields) as Promise<{ lead: Lead }>

export const addActivity = ({ data }: { data: { leadId: string; type: string; content?: string } }) =>
  post(`${data.leadId}/activity`, { type: data.type, content: data.content }) as Promise<{ activity: Activity }>

export const generateProposal = ({ data }: { data: { id: string } }) =>
  post(`${data.id}/proposal`) as Promise<{ html: string }>
