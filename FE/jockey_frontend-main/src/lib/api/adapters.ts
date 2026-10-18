import { formatTime } from '@/lib/format';
import type {
  AuthUser,
  BetStatus,
  BetTicket,
  GameGuide,
  MarketType,
  PodiumEntry,
  Race,
  RaceStatus,
  ResultDetail,
  ResultDividend,
  ResultStatus,
  ResultSummary,
  Runner,
} from '@/types';

import type {
  DTOAuthUser,
  DTOBet,
  DTODividend,
  DTOEntry,
  DTOGame,
  DTOPlacement,
  DTORaceDetail,
  DTORaceSummary,
  DTOResult,
} from './types';

/**
 * Maps backend payloads to the app's domain types. Kept pure so both the real
 * client and the tests can exercise them without a network.
 */

const RACE_STATUSES: RaceStatus[] = ['upcoming', 'ongoing', 'completed', 'cancelled', 'postponed'];
const BET_STATUSES: Record<string, BetStatus> = {
  pending: 'Pending',
  won: 'Won',
  lost: 'Lost',
  void: 'Void',
};

function toRaceStatus(status: string): RaceStatus {
  return RACE_STATUSES.includes(status as RaceStatus) ? (status as RaceStatus) : 'upcoming';
}

/** Preserve backend game codes even when the client has no special UI for them. */
function toMarket(game: string): MarketType {
  return game.toUpperCase() as MarketType;
}

/** Tolerant: anything unrecognised falls back to `Pending`. */
function toBetStatus(status: string): BetStatus {
  return BET_STATUSES[status.toLowerCase()] ?? 'Pending';
}

function capitalize(value: string): string {
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : value;
}

/**
 * The backend user has no wallet or join date, so those UI fields get neutral
 * placeholders until a billing/profile endpoint exists.
 */
export function toAuthUser(dto: DTOAuthUser): AuthUser {
  return {
    id: String(dto.id),
    firstName: dto.first_name,
    lastName: dto.last_name,
    email: dto.email,
    mobile: dto.mobile_number ?? undefined,
    initials: dto.initials,
    memberSince: '',
    balance: 0,
    currency: '₱',
  };
}

export function toRunner(entry: DTOEntry): Runner {
  return {
    id: String(entry.id),
    horseId: String(entry.horse_id),
    number: entry.horse_number,
    horse: entry.horse_name,
    jockey: entry.jockey_name,
    trainer: entry.trainer_name || undefined,
    odds: Number(entry.current_odds),
    weightKg: entry.weight_kg != null ? Number(entry.weight_kg) : undefined,
    silkColor: entry.badge_color ?? undefined,
    photoUrl: entry.horse_photo ?? undefined,
    owner: entry.owner_name || undefined,
    status: entry.status,
  };
}

export function toRace(dto: DTORaceSummary | DTORaceDetail): Race {
  const entries = 'entries' in dto ? dto.entries : undefined;
  return {
    id: String(dto.id),
    number: dto.race_number,
    name: dto.name,
    venue: dto.venue_name,
    distanceM: dto.distance_m,
    entries: dto.entries_count,
    postTime: formatTime(dto.post_time),
    status: toRaceStatus(dto.status),
    runners: entries?.map(toRunner),
    raceDate: dto.race_date,
    heroImageUrl: dto.hero_image_url ?? undefined,
    surface: dto.surface,
    trackCondition: dto.track_condition,
    clubName: dto.club_name,
    description: 'description' in dto ? dto.description ?? undefined : undefined,
    purseAmount: Number(dto.purse_amount),
    isFeatured: dto.is_featured,
    isLive: dto.is_live,
    isDemo: dto.is_demo,
  };
}

function winnerFrom(placements: DTOPlacement[]) {
  const first = placements.find((placement) => placement.finish_position === 1) ?? placements[0];
  return { horse: first?.horse_name ?? '', jockey: first?.jockey_name ?? '' };
}

export function toResultSummary(dto: DTOResult): ResultSummary {
  return {
    id: String(dto.id),
    raceId: String(dto.race.id),
    raceNumber: dto.race.race_number,
    status: dto.status as ResultStatus,
    winner: winnerFrom(dto.placements),
    venue: dto.race.venue_name,
    postTime: formatTime(dto.race.post_time),
    distanceM: dto.race.distance_m,
    time: dto.winning_time ?? '',
  };
}

function toPodium(placement: DTOPlacement): PodiumEntry {
  return {
    place: placement.finish_position,
    number: placement.horse_number,
    horse: placement.horse_name,
    jockey: placement.jockey_name,
  };
}

function toDividend(dividend: DTODividend): ResultDividend {
  return {
    market: dividend.game as MarketType,
    selection: dividend.combination,
    amount: Number(dividend.dividend_amount),
    unitStake: Number(dividend.unit_stake),
  };
}

export function toResultDetail(dto: DTOResult): ResultDetail {
  return {
    ...toResultSummary(dto),
    raceId: String(dto.race.id),
    raceName: dto.race.name,
    dateLabel: `RACE ${dto.race.race_number} · ${dto.race.race_date}`,
    trackCondition: capitalize(dto.track_condition),
    podium: dto.placements.map(toPodium),
    dividends: dto.dividends.map(toDividend),
    summary: '',
  };
}

function selectionFrom(dto: DTOBet): { label: string; runnerNumber?: number } {
  const selections = dto.selections ?? [];
  const label = selections.map((s) => `${s.horse_number} ${s.horse_name}`.trim()).join(' · ');
  return { label, runnerNumber: selections[0]?.horse_number };
}

export function toBetTicket(dto: DTOBet): BetTicket {
  const { label, runnerNumber } = selectionFrom(dto);
  return {
    id: dto.ticket_number,
    raceId: String(dto.race.id),
    ticketNumber: dto.ticket_number,
    raceLabel: `Race ${dto.race.race_number} · ${dto.race.name}`,
    raceName: dto.race.name,
    raceNumber: dto.race.race_number,
    market: toMarket(dto.game),
    selection: label,
    runnerNumber,
    stake: Number(dto.wager_amount),
    odds: Number(dto.odds_snapshot),
    placedAt: dto.placed_at,
    status: toBetStatus(dto.status),
    payoutAmount: dto.payout_amount == null ? undefined : Number(dto.payout_amount),
  };
}

export function toGameGuide(dto: DTOGame, index: number): GameGuide {
  const count = dto.selections_required;
  return {
    id: String(dto.id),
    number: index + 1,
    title: dto.code.replace(/_/g, ' '),
    description: dto.short_description,
    selectionHint: `Select ${count} horse${count === 1 ? '' : 's'}`,
  };
}
