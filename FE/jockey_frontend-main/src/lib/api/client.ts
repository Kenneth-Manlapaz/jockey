import { USE_MOCK_API } from '@/lib/config';
import { formatTicketNumber } from '@/lib/format';
import * as mock from '@/mocks/data';
import type { AuthUser, BetSelection, BetTicket, JockeyPHGuide, MarketType } from '@/types';

import { realApi } from './real';

const LATENCY_MS = 250;

function delay(ms = LATENCY_MS) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** A single bet to place: one cart line, priced at `stake`. */
export interface PlaceBetInput {
  raceId: string;
  raceNumber: number;
  raceName: string;
  market: MarketType;
  stake: number;
  runners: BetSelection[];
}

export interface RaceGameOption {
  id: string | number;
  code: string;
  name: string;
  short_description: string;
  selections_required: number;
  is_ordered: boolean;
}

/** Combined decimal odds for a set of selections (product). */
function combinedOdds(runners: BetSelection[]) {
  return runners.reduce((acc, runner) => acc * runner.odds, 1);
}

/** Human-readable selection label, e.g. `1 Golden Victory · 2 Silver Comet`. */
function selectionLabel(runners: BetSelection[]) {
  return runners.map((r) => `${r.runnerNumber} ${r.horse}`).join(' · ');
}

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

interface SignUpInput {
  firstName: string;
  lastName: string;
  email: string;
  mobile: string;
}

/** Builds the mock account payload from sign-up details. */
function buildUser(input: SignUpInput): AuthUser {
  const now = new Date();
  return {
    id: `user-${now.getTime()}`,
    firstName: input.firstName,
    lastName: input.lastName,
    email: input.email,
    mobile: input.mobile,
    initials: `${input.firstName.charAt(0)}${input.lastName.charAt(0)}`.toUpperCase(),
    memberSince: `MEMBER SINCE ${MONTHS[now.getMonth()]} ${now.getFullYear()}`,
    balance: 5000,
    currency: '₱',
  };
}

/**
 * Mock API client.
 *
 * Shapes mirror the (future) backend contract so swapping to a real HTTP
 * client is a single-file change — every screen consumes this module only.
 */
const mockApi = {
  async signIn({ email }: { email: string; password: string }): Promise<AuthUser> {
    await delay(400);
    return { ...mock.demoUser, email };
  },

  async signUp(input: SignUpInput): Promise<AuthUser> {
    await delay(400);
    return buildUser(input);
  },

  async getOnboardingSlides() {
    await delay();
    return mock.onboardingSlides;
  },

  async getHome() {
    await delay();
    return mock.homeData;
  },

  async getMeetingDays() {
    await delay();
    return mock.meetingDays;
  },

  async getRaces(date?: string) {
    await delay();
    if (!date) return mock.homeData.todayRaces;
    return mock.meetingDays.find((d) => d.date === date)?.races ?? [];
  },

  async getRace(id: string) {
    await delay();
    return mock.homeData.todayRaces.find((r) => r.id === id) ?? null;
  },

  async getResults() {
    await delay();
    return mock.resultSummaries;
  },

  async getResult(id: string) {
    await delay();
    return mock.resultSummaries.find((r) => r.id === id) ?? null;
  },

  async getResultDetail(id: string) {
    await delay();
    return mock.resultDetails[id] ?? mock.resultDetails['res-1'];
  },

  async getPool(id?: string) {
    await delay();
    return mock.pools.find((p) => p.id === id) ?? mock.pool;
  },

  async getPoolOverview() {
    await delay();
    return mock.poolOverview;
  },

  async getPoolDividend(id?: string) {
    await delay();
    return (id ? mock.poolDividends[id] : undefined) ?? mock.poolDividends['pool-place-r3'];
  },

  async getGameGuides() {
    await delay();
    return mock.gameGuides;
  },

  async getWagerPresets() {
    await delay();
    return [20, 50, 100, 200];
  },

  async getGameGuide(id: string) {
    await delay();
    return mock.gameGuides.find((guide) => guide.id === id) ?? null;
  },

  async getJockeyPHGuide(): Promise<JockeyPHGuide> {
    await delay();
    return mock.jockeyPHGuide;
  },

  async getRaceGames(_raceId: string): Promise<RaceGameOption[]> {
    await delay();
    return mock.gameGuides.slice(0, 5).map((guide, index) => ({
      id: index + 1,
      code: guide.title.replace(/\s+/g, '_'),
      name: guide.title,
      short_description: guide.description,
      selections_required: index < 2 ? 1 : index < 4 ? 2 : 3,
      is_ordered: index !== 3,
      min_wager: '20.00',
      max_wager: '10000.00',
    }));
  },

  async getRewards() {
    await delay();
    return mock.rewards;
  },

  async getProfile() {
    await delay();
    return mock.profile;
  },

  async getFeaturedContenders() {
    await delay();
    return mock.featuredContenders;
  },

  async getFavorites() {
    await delay();
    return mock.featuredContenders;
  },

  async getNotifications() {
    await delay();
    return [];
  },

  async markAllNotificationsRead() {
    await delay();
    return { success: true };
  },

  async getBets(): Promise<BetTicket[]> {
    await delay();
    return [];
  },

  async placeBets(inputs: PlaceBetInput[]): Promise<BetTicket[]> {
    await delay(400);
    const placedAt = new Date();
    return inputs.map((item, index) => ({
      id: `bet-${placedAt.getTime()}-${index}`,
      raceId: item.raceId,
      ticketNumber: formatTicketNumber(placedAt, index + 1),
      raceLabel: `Race ${item.raceNumber} · ${item.raceName}`,
      raceName: item.raceName,
      raceNumber: item.raceNumber,
      market: item.market,
      selection: selectionLabel(item.runners),
      runnerNumber: item.runners[0]?.runnerNumber,
      stake: item.stake,
      odds: combinedOdds(item.runners),
      placedAt: placedAt.toISOString(),
      status: 'Pending',
    }));
  },
};

/**
 * Data seam. Real API mode is the default; set `EXPO_PUBLIC_USE_MOCK_API=true`
 * to opt into fixtures. Resources without a documented server endpoint still
 * use the demo implementation until that API contract exists.
 */
export const api = USE_MOCK_API ? mockApi : { ...mockApi, ...realApi };

export type Api = typeof api;

/** Canonical market types shared by betting UI. */
export const markets = mock.markets;
