export interface Lead {
  id: string;
  name: string;
  category: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  phone: string | null;
  email: string | null;
  email_found_at: string | null;
  website: string | null;
  google_maps_url: string | null;
  google_rating: number | null;
  google_reviews: number | null;
  has_website: boolean | null;
  website_score: number | null;
  has_chat: boolean | null;
  has_booking: boolean | null;
  has_seo: boolean | null;
  needs: string[] | null;
  lead_score: number;
  analysis_notes: string | null;
  outreach_angle: string | null;
  outreach_draft: string | null;
  outreach_sent: boolean;
  site_proposal: string | null;
  last_sent_at: string | null;
  meeting_booked_at: string | null;
  stage: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Activity {
  id: string;
  type: string;
  content: string | null;
  created_at: string;
}

export interface BulkOp {
  action: string;
  total: number;
  done: number;
  errors: number;
}

export interface StageCounts {
  [stage: string]: number;
}
