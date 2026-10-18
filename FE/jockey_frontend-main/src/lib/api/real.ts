import { toAuthUser, toBetTicket, toGameGuide, toRace, toResultDetail, toResultSummary } from './adapters';
import { getMe, login, register } from './auth';
import {
  createFavorite,
  deleteFavorite,
  createRaceNote,
  deleteRaceNote,
  getGame,
  getHealth,
  getEntry,
  getHorse,
  getJockey,
  getRace,
  getRaceResult as getRaceResultEndpoint,
  getRaceNote,
  getResult,
  getNotificationUnreadCount,
  getRacingClub,
  getTrainer,
  getVenue,
  getWagerPresets,
  listBets,
  listFavorites,
  listGames,
  listHorses,
  listEntries,
  listJockeys,
  listMeetings,
  listNotifications,
  listRaceGames,
  listRaces,
  listRaceEntries,
  listRaceNotes,
  listRacingClubs,
  listResults,
  listTips,
  listTrainers,
  listVenues,
  markAllNotificationsRead,
  markNotificationRead,
  placeBet,
  replaceMe,
  settleRace,
  updateMe,
  updateRaceNote,
} from './endpoints';
import { ApiError } from './errors';
import { setAccessToken } from '@/lib/auth/tokens';
import { toMeetingDay } from './mappers';
import type { HomeData } from '@/types';
import * as mock from '@/mocks/data';

import type { PlaceBetInput } from './client';

/**
 * Real client for the API-backed screens. Features without matching API routes
 * continue to use their demo implementations in `client.ts`.
 */

async function nullOnNotFound<T>(run: () => Promise<T>): Promise<T | null> {
  try {
    return await run();
  } catch (error) {
    if (error instanceof ApiError && error.code === 'not_found') return null;
    throw error;
  }
}

async function allPages<T>(load: (page: number) => Promise<{ count: number; results: T[] }>) {
  const first = await load(1);
  const rows = [...first.results];
  const pageCount = Math.ceil(first.count / Math.max(first.results.length, 1));
  for (let page = 2; page <= pageCount; page += 1) rows.push(...(await load(page)).results);
  return rows;
}

function localDateLabel(date?: string) {
  if (!date) return new Date().toLocaleDateString('en-PH', { weekday: 'long', day: 'numeric', month: 'long' }).toUpperCase();
  const [year, month, day] = date.slice(0, 10).split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('en-PH', {
    weekday: 'long', day: 'numeric', month: 'long',
  }).toUpperCase();
}

function paginatedItems<T>(value: { results: T[] } | T[]): T[] {
  return Array.isArray(value) ? value : value.results;
}

export const realApi = {
  getHealth,

  async signIn(input: { email: string; password: string }) {
    const response = await login(input);
    setAccessToken(response.access);
    return toAuthUser(response.user ?? (await getMe()));
  },

  async signUp(input: { firstName: string; lastName: string; email: string; mobile: string; password: string }) {
    const response = await register({
      first_name: input.firstName,
      last_name: input.lastName,
      email: input.email,
      mobile_number: input.mobile || undefined,
      password: input.password,
      accept_terms: true,
    });
    setAccessToken(response.access);
    return toAuthUser(response.user ?? (await getMe()));
  },

  async getHome(): Promise<HomeData> {
    const [races, results, meetings] = await Promise.all([
      allPages((page) => listRaces({ page, page_size: 100 })),
      allPages((page) => listResults({ page, page_size: 100 })),
      listMeetings(),
    ]);
    const meetingRows = paginatedItems(meetings);
    const featuredRace = races.find((race) => race.is_live)
      ?? races.find((race) => race.is_featured)
      ?? races.find((race) => race.status === 'upcoming')
      ?? races[0];
    const race = featuredRace ? toRace(featuredRace) : mock.homeData.liveRace;
    return {
      ...mock.homeData,
      dateLabel: localDateLabel(meetingRows[0]?.race_date ?? races[0]?.race_date),
      liveRace: race,
      liveSeries: featuredRace?.club_name || featuredRace?.venue_name || mock.homeData.liveSeries,
      todayRaces: races.map(toRace),
      latestResults: results.map(toResultSummary),
    };
  },

  async getMeetingDays() {
    const meetings = paginatedItems(await listMeetings());
    return Promise.all(meetings.map(async (meeting) => {
      const races = await allPages((page) => listRaces({
        date: meeting.race_date,
        venue: meeting.venue_id,
        page,
        page_size: 100,
      }));
      return toMeetingDay(meeting, races.map(toRace));
    }));
  },

  async getRaces(date?: string) {
    const races = await allPages((page) => listRaces({ date, page, page_size: 100 }));
    return races.map(toRace);
  },

  getRace(id: string) {
    return nullOnNotFound(async () => toRace(await getRace(id)));
  },

  getRaceEntries: listRaceEntries,
  getEntry,
  getEntries: async (filters: { race?: number; horse?: number } = {}) => paginatedItems(await listEntries(filters)),
  getRaceResult: async (raceId: string) => nullOnNotFound(async () => toResultDetail(await getRaceResultEndpoint(raceId))),

  async getResults() {
    const results = await allPages((page) => listResults({ page, page_size: 100 }));
    return results.map(toResultSummary);
  },

  async getTips(date?: string) {
    return allPages((page) => listTips({ date, page, page_size: 100 }));
  },

  getResult(id: string) {
    return nullOnNotFound(async () => toResultSummary(await getResult(id)));
  },

  async getResultDetail(id: string) {
    return toResultDetail(await getResult(id));
  },

  async getGameGuides() {
    const games = await listGames();
    return games.map((game, index) => toGameGuide(game, index));
  },

  getGameGuide(id: string) {
    return nullOnNotFound(async () => toGameGuide(await getGame(id), 0));
  },

  async getBets() {
    const bets = await allPages((page) => listBets({ page, page_size: 100 }));
    return bets.map(toBetTicket);
  },

  placeBets(inputs: PlaceBetInput[]) {
    return Promise.all(inputs.map((item) => placeOneBet(item)));
  },

  async getProfile() {
    const user = toAuthUser(await getMe());
    return {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      initials: user.initials,
      memberSince: user.memberSince,
      balance: user.balance,
      currency: user.currency,
    };
  },

  updateProfile: updateMe,
  replaceProfile: replaceMe,

  getVenues: async (search?: string) => paginatedItems(await listVenues({ search })),
  getVenue: (id: string) => nullOnNotFound(() => getVenue(id)),
  getJockeys: async (search?: string) => paginatedItems(await listJockeys({ search })),
  getJockey: (id: string) => nullOnNotFound(() => getJockey(id)),
  getTrainers: async (search?: string) => paginatedItems(await listTrainers({ search })),
  getTrainer: (id: string) => nullOnNotFound(() => getTrainer(id)),
  getHorses: async (search?: string) => paginatedItems(await listHorses({ search })),
  getHorse: (id: string) => nullOnNotFound(() => getHorse(id)),
  getRacingClubs: async (search?: string) => paginatedItems(await listRacingClubs({ search })),
  getRacingClub: (id: string) => getRacingClub(id),
  getRaceGames: (raceId: string) => listRaceGames(raceId),
  getWagerPresets,
  getRaceNotes: async (raceId: string) => paginatedItems(await listRaceNotes(raceId)),
  getRaceNote,
  createRaceNote,
  updateRaceNote,
  deleteRaceNote,
  getFavorites: async (type?: string) => paginatedItems(await listFavorites({ type })),
  createFavorite,
  deleteFavorite,
  getNotifications: () => listNotifications(),
  getNotificationUnreadCount,
  markNotificationRead,
  markAllNotificationsRead: async () => markAllNotificationsRead(),
  settleRace,
};

function numericId(value: string): number {
  return Number(value.replace(/\D/g, '')) || 0;
}

async function placeOneBet(item: PlaceBetInput) {
  const dto = await placeBet(
    {
      race: numericId(item.raceId),
      game: item.market,
      entries: item.runners.map((runner) => Number(runner.entryId)),
      wager_amount: item.stake.toFixed(2),
    },
    `place-${item.raceId}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  );
  return toBetTicket(dto);
}
