export type RaceStatus = 'upcoming' | 'ongoing' | 'completed' | 'cancelled' | 'postponed';
export type ResultStatus = 'official' | 'provisional' | 'cancelled';
export type MarketType =
  | 'WIN'
  | 'PLACE'
  | 'FORECAST'
  | 'TRIFECTA'
  | 'REVERSE_FORECAST'
  | 'BOX_TRIFECTA'
  | 'MULTI_RACE'
  | (string & {});
export type ContenderKind = 'horse' | 'jockey';

export interface Runner {
  id: string;
  horseId?: string;
  number: number;
  horse: string;
  jockey: string;
  trainer?: string;
  /** Recent finishing positions, most recent first (e.g. "1-3-2-5"). */
  form?: string;
  odds: number;
  /** Carried weight in kilograms (e.g. 56). */
  weightKg?: number;
  /** Silks colour for the runner's number badge. */
  silkColor?: string;
  photoUrl?: string;
  owner?: string;
  status?: string;
}

/** How many runners a market needs selected, and the design's helper copy. */
export interface MarketRequirement {
  min: number;
  /** Variable-count markets (e.g. multi-race) use 0 and rely on the hint. */
  hint: string;
}

export interface Race {
  id: string;
  number: number;
  name: string;
  venue: string;
  distanceM: number;
  entries: number;
  postTime: string;
  status: RaceStatus;
  runners?: Runner[];
  raceDate?: string;
  heroImageUrl?: string;
  surface?: string;
  trackCondition?: string;
  clubName?: string;
  description?: string;
  purseAmount?: number;
  isFeatured?: boolean;
  isLive?: boolean;
  isDemo?: boolean;
}

export interface MeetingDay {
  date: string;
  day: string;
  weekday: string;
  raceCount: number;
  races: Race[];
}

export interface ResultSummary {
  id: string;
  raceId?: string;
  raceNumber: number;
  status: ResultStatus;
  winner: { horse: string; jockey: string };
  venue: string;
  postTime: string;
  distanceM: number;
  time: string;
}

export interface PodiumEntry {
  place: number;
  number: number;
  horse: string;
  jockey: string;
  image?: string;
  silkColor?: string;
}

export interface ResultDividend {
  market: MarketType;
  selection: string;
  amount: number;
  unitStake?: number;
}

/** Full official-result payload for the results detail screen. */
export interface ResultDetail extends ResultSummary {
  raceId?: string;
  raceName: string;
  dateLabel: string;
  trackCondition: string;
  podium: PodiumEntry[];
  dividends: ResultDividend[];
  summary: string;
}

export interface PoolBreakdownItem {
  label: string;
  percent: number;
  color: string;
}

/** Condensed pool row shown in the Totalizer overview. */
export interface PoolSummary {
  id: string;
  market: MarketType;
  totalPool: number;
  estimatedDividend: number;
  perUnit: number;
}

/** Race-level totalizer overview: sales across every pool on the card. */
export interface PoolOverview {
  raceId: string;
  raceLabel: string;
  venue: string;
  postTime: string;
  poolSales: number;
  pools: PoolSummary[];
}

export interface Promo {
  eyebrow: string;
  title: string;
  description: string;
}

export type QuickLinkIcon = 'totalizer' | 'games' | 'guide';

export interface QuickLink {
  id: string;
  icon: QuickLinkIcon;
  label: string;
  sublabel: string;
}

export interface Pool {
  id: string;
  market: MarketType;
  raceLabel: string;
  totalPool: number;
  totalSales: number;
  refunds: number;
  deductions: number;
  distributable: number;
  estimatedDividend: number;
  finalDividend: number | null;
  perUnit: number;
  breakdown: PoolBreakdownItem[];
}

/** Sample pari-mutuel pool snapshot shown on the Pool & Dividend screen. */
export interface PoolDividend {
  id: string;
  market: MarketType;
  raceLabel: string;
  totalPool: number;
  salesUnits: number;
  winningUnits: number;
  dividendPerUnit: number;
  perUnit: number;
  distribution: PoolBreakdownItem[];
}

export interface FeaturedContender {
  id: string;
  kind: ContenderKind;
  name: string;
  image?: string;
}

export interface Profile {
  firstName: string;
  lastName: string;
  email: string;
  initials: string;
  memberSince: string;
  balance: number;
  currency: string;
}

/** Signed-in account. Mocked today; mirrors the future Django user payload. */
export interface AuthUser extends Profile {
  id: string;
  mobile?: string;
}

export type BetStatus = 'Pending' | 'Won' | 'Lost' | 'Void';

/** A runner the user has tapped into the bet slip. */
export interface BetSelection {
  raceId: string;
  raceLabel: string;
  runnerNumber: number;
  horse: string;
  jockey: string;
  odds: number;
  entryId: string;
}

/** A selection staged in the bet cart before it becomes a ticket. */
export interface CartItem {
  id: string;
  raceId: string;
  raceNumber: number;
  raceName: string;
  raceDateLabel?: string;
  postTime?: string;
  market: MarketType;
  /** Optional per-ticket wager, matching the review flow. */
  stake?: number;
  runners: BetSelection[];
}

/** A placed (demo) bet. Mirrors the future backend ticket payload. */
export interface BetTicket {
  id: string;
  raceId?: string;
  ticketNumber: string;
  raceLabel: string;
  raceName: string;
  raceNumber: number;
  market: MarketType;
  selection: string;
  runnerNumber?: number;
  stake: number;
  odds: number;
  placedAt: string;
  status: BetStatus;
  payoutAmount?: number;
}

export interface HomeData {
  dateLabel: string;
  greetingName: string;
  liveRace: Race;
  liveSeries: string;
  todayRaces: Race[];
  latestResults: ResultSummary[];
  promo: Promo;
  quickLinks: QuickLink[];
  featured: FeaturedContender[];
}

/** A single entry in the Games & Guide learn hub. */
export interface GameGuide {
  id: string;
  number: number;
  title: string;
  description: string;
  selectionHint: string;
}

/** Historical race-sheet content, currently supplied by the mock API seam. */
export interface JockeyPHGuide {
  venue: string;
  location: string;
  dateLabel: string;
  printedPricePhp: number;
  pools: { name: string; races: string }[];
  singleRaceOptions: string[];
  sampleRaces: {
    number: number;
    postTime: string;
    distanceM: number;
    bettingEvents: string[];
    group: string;
    tipsters: { code: 'B' | 'W' | 'Y'; picks: string }[];
    entries: {
      gate: string;
      horse: string;
      ageSexClass?: string;
      recentTime?: string;
      trainer?: string;
      jockey?: string;
      weight?: string;
      owner?: string;
      tipsterStar?: boolean;
    }[];
    announcements?: string[];
  }[];
  selectionFactors: { title: string; detail: string }[];
  tipDataNeeded: { field: string; reason: string }[];
  historicalNotice: string;
}

/** A redeemable perk in the demo rewards programme. */
export interface Reward {
  id: string;
  title: string;
  description: string;
  pointsCost: number;
  tag?: string;
}

/** Demo rewards programme payload: current points balance + catalogue. */
export interface RewardProgram {
  points: number;
  rewards: Reward[];
}

export interface OnboardingSlide {
  id: string;
  eyebrow: string;
  title: string;
  highlight: string;
  description: string;
  image?: string;
}
