/**
 * Wire types for the Django REST API.
 *
 * These mirror the backend payloads exactly (including snake_case and
 * decimal-as-string), so they stay isolated from the app's domain types in
 * `src/types`. Use the mappers in `adapters.ts` to cross the boundary.
 */

export interface DTOAuthUser {
  id: number | string;
  first_name: string;
  last_name: string;
  email: string;
  mobile_number: string | null;
  avatar_url: string | null;
  initials: string;
  role: string;
}

export interface DTOAuthResponse {
  access: string;
  token_type: string;
  user?: DTOAuthUser;
}

export type DTOCredentials =
  | { email: string; password: string }
  | { username: string; password: string };

export interface DTORegisterInput {
  first_name: string;
  last_name: string;
  email: string;
  mobile_number?: string;
  password: string;
  accept_terms: boolean;
}

export interface DTOCsrf {
  csrfToken: string;
}

export interface DTOHealth {
  status: string;
  database: string;
  api_version: string;
  time: string;
  data_notice?: string;
  betting_enabled?: boolean;
}

export interface DTOVenueSurface {
  surface: string;
  circumference_m: number;
}

export interface DTOVenue {
  id: number;
  name: string;
  tagline: string | null;
  description: string | null;
  city: string | null;
  province: string | null;
  country_code: string;
  hero_image_url: string | null;
  club_name: string | null;
  is_fictional: boolean;
  surfaces: DTOVenueSurface[];
  courses: {
    name: string;
    min_distance_m: number;
    max_distance_m: number;
    description: string | null;
  }[];
  facilities: { code: string; label: string }[];
}

export interface DTOMeeting {
  venue_id: number;
  venue_name: string;
  race_date: string;
  race_count: number;
  first_post_time: string;
}

export interface DTOTipSelection {
  race_number: number;
  tipster: string;
  raw_selection: string;
  horse_numbers: number[];
  race_id?: number | null;
  matched_entries?: { entry_id: number; horse_number: number; horse_name: string }[];
  note?: string | null;
}

export interface DTOTipSheet {
  id: number;
  title: string;
  race_date: string;
  compiler: string;
  source: string;
  disclaimer: string;
  tips: DTOTipSelection[];
}

export interface DTONotification extends Record<string, unknown> {
  id?: number | string;
  type?: string;
  title?: string;
  body?: string;
  deep_link?: string | null;
  is_read?: boolean;
  created_at?: string;
}

export interface DTORaceSummary {
  id: number;
  race_number: number;
  name: string;
  race_date: string;
  post_time: string;
  distance_m: number;
  surface: string;
  track_condition: string;
  status: string;
  entries_count: number;
  purse_amount: string;
  purse_currency: string;
  is_featured: boolean;
  is_live: boolean;
  hero_image_url: string | null;
  venue_name: string;
  club_name: string;
  is_demo: boolean;
}

export interface DTOEntry {
  id: number;
  race_id: number;
  horse_id: number;
  horse_number: number;
  badge_color: string | null;
  horse_name: string;
  horse_photo: string | null;
  jockey_name: string;
  trainer_name: string;
  owner_name: string;
  weight_kg: string | null;
  current_odds: string;
  status: string;
}

export interface DTOHorse {
  id: number;
  name?: string;
  registered_name?: string;
  photo_url?: string | null;
  [key: string]: unknown;
}

export interface DTOJockey {
  id: number;
  full_name: string;
  photo_url: string | null;
  weight_kg?: number | null;
  career_wins?: number;
  career_starts?: number;
  bio?: string | null;
  is_fictional?: boolean;
}

export interface DTOTrainer {
  id: number;
  full_name: string;
  photo_url?: string | null;
  bio?: string | null;
}

export interface DTORacingClub {
  id: number;
  name: string;
  [key: string]: unknown;
}

export interface DTORaceNote {
  id: number;
  race_id: number;
  author: string;
  content: string;
  is_flagged: boolean;
  created_at: string;
  updated_at: string;
  [key: string]: unknown;
}

export type DTOFavorite = Record<string, unknown> & { id?: string | number };
export type DTOWagerPreset = number | string | { amount: number | string; [key: string]: unknown };

export interface DTORaceDetail extends DTORaceSummary {
  description: string | null;
  age_restriction: string | null;
  entries: DTOEntry[];
}

export interface DTOPlacement {
  finish_position: number;
  horse_number: number;
  horse_name: string;
  jockey_name: string;
  final_odds: string;
}

export interface DTODividend {
  game: string;
  combination: string;
  dividend_amount: string | number;
  unit_stake: string | number;
}

export interface DTOResult {
  id: number;
  status: string;
  race: DTORaceSummary;
  winning_time: string | null;
  winning_time_ms: number | null;
  track_condition: string;
  posted_at: string;
  made_official_at: string | null;
  placements: DTOPlacement[];
  dividends: DTODividend[];
}

export interface DTOGame {
  id: number;
  code: string;
  name: string;
  short_description: string;
  selections_required: number;
  is_ordered: boolean;
  min_wager: string;
  max_wager: string;
}

export interface DTOBetRace {
  id: number;
  race_number: number;
  name: string;
  race_date: string;
}

export interface DTOBetSelection {
  leg_position: number;
  horse_number: number;
  horse_name: string;
  odds_snapshot: string;
}

export interface DTOBet {
  ticket_number: string;
  status: string;
  is_simulated: boolean;
  race: DTOBetRace;
  game: string;
  game_name: string;
  wager_amount: string;
  odds_snapshot: string;
  estimated_return: string | null;
  payout_amount: string | null;
  placed_at: string;
  settled_at: string | null;
  selections: DTOBetSelection[];
}

export interface DTOPlaceBetInput {
  race: number;
  game: string;
  entries: number[];
  wager_amount: string;
}
