import { request } from './http';
import type { Paginated } from './http';
import type {
  DTOAuthUser,
  DTOBet,
  DTOEntry,
  DTOFavorite,
  DTOGame,
  DTOHealth,
  DTOHorse,
  DTOJockey,
  DTOMeeting,
  DTONotification,
  DTOPlaceBetInput,
  DTORaceNote,
  DTORaceDetail,
  DTORaceSummary,
  DTORacingClub,
  DTOResult,
  DTOTrainer,
  DTOVenue,
  DTOWagerPreset,
  DTOTipSheet,
} from './types';

/** Thin, typed wrappers over the public REST routes. */

type QueryValue = string | number | boolean | undefined;

function toQuery(params: Record<string, QueryValue>): string {
  const parts = Object.entries(params)
    .filter(([, value]) => value !== undefined)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
  return parts.length ? `?${parts.join('&')}` : '';
}

export function getHealth() {
  return request<DTOHealth>('/health/');
}

export function updateMe(input: Partial<Pick<DTOAuthUser, 'first_name' | 'last_name' | 'mobile_number' | 'avatar_url'>>) {
  return request<DTOAuthUser>('/me/', { method: 'PATCH', body: input, auth: true });
}

export function replaceMe(input: Pick<DTOAuthUser, 'first_name' | 'last_name' | 'mobile_number' | 'avatar_url'>) {
  return request<DTOAuthUser>('/me/', { method: 'PUT', body: input, auth: true });
}

export function listVenues(params: { search?: string } = {}) {
  return request<Paginated<DTOVenue>>(`/venues/${toQuery(params)}`);
}

export function getVenue(id: string | number) {
  return request<DTOVenue>(`/venues/${id}/`);
}

export function listJockeys(params: { search?: string } = {}) {
  return request<Paginated<DTOJockey>>(`/jockeys/${toQuery(params)}`);
}

export function getJockey(id: string | number) {
  return request<DTOJockey>(`/jockeys/${id}/`);
}

export function listTrainers(params: { search?: string } = {}) {
  return request<Paginated<DTOTrainer>>(`/trainers/${toQuery(params)}`);
}

export function getTrainer(id: string | number) {
  return request<DTOTrainer>(`/trainers/${id}/`);
}

export function listHorses(params: { search?: string } = {}) {
  return request<Paginated<DTOHorse>>(`/horses/${toQuery(params)}`);
}

export function getHorse(id: string | number) {
  return request<DTOHorse>(`/horses/${id}/`);
}

export function listRacingClubs(params: { search?: string } = {}) {
  return request<Paginated<DTORacingClub>>(`/racing-clubs/${toQuery(params)}`, { auth: true });
}

export function getRacingClub(id: string | number) {
  return request<DTORacingClub>(`/racing-clubs/${id}/`, { auth: true });
}

export function listMeetings(params: { date?: string; venue?: number } = {}) {
  // The integration guide describes a raw array; the running local API currently
  // returns the standard paginated envelope. Accept both payload shapes.
  return request<Paginated<DTOMeeting> | DTOMeeting[]>(`/meetings/${toQuery(params)}`);
}

export function listTips(params: { date?: string; page?: number; page_size?: number } = {}) {
  return request<Paginated<DTOTipSheet>>(`/tips/${toQuery(params)}`);
}

export function listRaces(
  params: { date?: string; status?: string; venue?: number; featured?: boolean; page?: number; page_size?: number } = {},
) {
  return request<Paginated<DTORaceSummary>>(`/races/${toQuery(params)}`);
}

export function getRace(id: string | number) {
  return request<DTORaceDetail>(`/races/${id}/`);
}

export function listRaceEntries(raceId: string | number) {
  return request<DTOEntry[]>(`/races/${raceId}/entries/`);
}

export function listEntries(params: { race?: number; horse?: number; page?: number; page_size?: number } = {}) {
  return request<Paginated<DTOEntry>>(`/entries/${toQuery(params)}`);
}

export function getEntry(id: string | number) {
  return request<DTOEntry>(`/entries/${id}/`);
}

export function listResults(params: { date?: string; status?: string; page?: number; page_size?: number } = {}) {
  return request<Paginated<DTOResult>>(`/results/${toQuery(params)}`);
}

export function getResult(id: string | number) {
  return request<DTOResult>(`/results/${id}/`);
}

export function getRaceResult(raceId: string | number) {
  return request<DTOResult>(`/races/${raceId}/results/`);
}

export function listGames() {
  return request<DTOGame[]>('/games/');
}

export function listRaceGames(raceId: string | number) {
  return request<DTOGame[]>(`/races/${raceId}/games/`);
}

export function getWagerPresets() {
  return request<DTOWagerPreset[]>('/games/wager_presets/');
}

export function getGame(id: string | number) {
  return request<DTOGame>(`/games/${id}/`);
}

export function listBets(params: { status?: string; page?: number; page_size?: number } = {}) {
  return request<Paginated<DTOBet>>(`/bets/${toQuery(params)}`, { auth: true });
}

export function getBet(ticketNumber: string | number) {
  return request<DTOBet>(`/bets/${ticketNumber}/`, { auth: true });
}

/**
 * Places a single simulated bet with the authenticated bearer token. The
 * optional idempotency key lets a retry reuse an existing ticket.
 */
export function placeBet(input: DTOPlaceBetInput, idempotencyKey?: string) {
  return request<DTOBet>('/bets/', {
    method: 'POST',
    body: input,
    auth: true,
    headers: idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : undefined,
  });
}

export function settleRace(raceId: string | number) {
  return request<{ won: number; lost: number; payout_total: string | number }>(`/races/${raceId}/settle/`, {
    method: 'POST',
    auth: true,
  });
}

export function listRaceNotes(raceId: string | number) {
  return request<Paginated<DTORaceNote> | DTORaceNote[]>(`/race-notes/${toQuery({ race_id: Number(raceId) })}`, { auth: true });
}

export function getRaceNote(id: string | number) {
  return request<DTORaceNote>(`/race-notes/${id}/`, { auth: true });
}

export function createRaceNote(input: { race_id: number; author: string; content: string; is_flagged?: boolean }) {
  return request<DTORaceNote>('/race-notes/', { method: 'POST', body: input, auth: true });
}

export function updateRaceNote(id: string | number, input: Partial<Pick<DTORaceNote, 'author' | 'content' | 'is_flagged'>>) {
  return request<DTORaceNote>(`/race-notes/${id}/`, { method: 'PUT', body: input, auth: true });
}

export function deleteRaceNote(id: string | number) {
  return request<void>(`/race-notes/${id}/`, { method: 'DELETE', auth: true, parse: 'none' });
}

export function listFavorites(params: { type?: string } = {}) {
  return request<Paginated<DTOFavorite> | DTOFavorite[]>(`/favorites/${toQuery(params)}`, { auth: true });
}

export function createFavorite(input: Record<string, unknown>) {
  return request<DTOFavorite>('/favorites/', { method: 'POST', body: input, auth: true });
}

export function deleteFavorite(id: string | number) {
  return request<void>(`/favorites/${id}/`, { method: 'DELETE', auth: true, parse: 'none' });
}

export function listNotifications() {
  return request<Paginated<DTONotification> | DTONotification[]>('/notifications/', { auth: true });
}

export function getNotificationUnreadCount() {
  return request<{ unread: number }>('/notifications/unread_count/', { auth: true });
}

export function markNotificationRead(id: string | number) {
  return request<void>(`/notifications/${id}/read/`, { method: 'POST', auth: true, parse: 'none' });
}

export function markAllNotificationsRead() {
  return request<unknown>('/notifications/read_all/', { method: 'POST', auth: true });
}
