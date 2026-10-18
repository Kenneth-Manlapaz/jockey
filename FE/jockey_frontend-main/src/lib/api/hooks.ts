import { useQuery } from '@tanstack/react-query';

import { api } from './client';

export const queryKeys = {
  onboarding: ['onboarding'] as const,
  home: ['home'] as const,
  meetingDays: ['meeting-days'] as const,
  races: (date?: string) => ['races', date ?? 'today'] as const,
  race: (id: string) => ['race', id] as const,
  results: ['results'] as const,
  result: (id: string) => ['result', id] as const,
  resultDetail: (id: string) => ['result-detail', id] as const,
  pool: ['pool'] as const,
  poolOverview: ['pool-overview'] as const,
  poolDividend: (id?: string) => ['pool-dividend', id ?? 'default'] as const,
  gameGuides: ['game-guides'] as const,
  gameGuide: (id: string) => ['game-guide', id] as const,
  jockeyPHGuide: ['jockeyph-guide'] as const,
  raceGames: (id: string) => ['race-games', id] as const,
  rewards: ['rewards'] as const,
  profile: ['profile'] as const,
  featured: ['featured'] as const,
};

export function useOnboardingSlides() {
  return useQuery({ queryKey: queryKeys.onboarding, queryFn: api.getOnboardingSlides });
}

export function useHome() {
  return useQuery({ queryKey: queryKeys.home, queryFn: api.getHome });
}

export function useMeetingDays() {
  return useQuery({ queryKey: queryKeys.meetingDays, queryFn: api.getMeetingDays });
}

export function useRaces(date?: string) {
  return useQuery({ queryKey: queryKeys.races(date), queryFn: () => api.getRaces(date) });
}

export function useRace(id: string) {
  return useQuery({ queryKey: queryKeys.race(id), queryFn: () => api.getRace(id), enabled: !!id });
}

export function useResults() {
  return useQuery({ queryKey: queryKeys.results, queryFn: api.getResults });
}

export function useResult(id: string) {
  return useQuery({
    queryKey: queryKeys.result(id),
    queryFn: () => api.getResult(id),
    enabled: !!id,
  });
}

export function useResultDetail(id: string) {
  return useQuery({
    queryKey: queryKeys.resultDetail(id),
    queryFn: () => api.getResultDetail(id),
    enabled: !!id,
  });
}

export function usePool(id?: string) {
  return useQuery({ queryKey: queryKeys.pool, queryFn: () => api.getPool(id) });
}

export function usePoolOverview() {
  return useQuery({ queryKey: queryKeys.poolOverview, queryFn: api.getPoolOverview });
}

export function usePoolDividend(id?: string) {
  return useQuery({ queryKey: queryKeys.poolDividend(id), queryFn: () => api.getPoolDividend(id) });
}

export function useGameGuides() {
  return useQuery({ queryKey: queryKeys.gameGuides, queryFn: api.getGameGuides });
}

export function useGameGuide(id: string) {
  return useQuery({
    queryKey: queryKeys.gameGuide(id),
    queryFn: () => api.getGameGuide(id),
    enabled: !!id,
  });
}

export function useJockeyPHGuide() {
  return useQuery({ queryKey: queryKeys.jockeyPHGuide, queryFn: api.getJockeyPHGuide });
}

export function useRaceGames(id: string) {
  return useQuery({
    queryKey: queryKeys.raceGames(id),
    queryFn: () => api.getRaceGames(id),
    enabled: !!id,
  });
}

export function useRewards() {
  return useQuery({ queryKey: queryKeys.rewards, queryFn: api.getRewards });
}

export function useProfile() {
  return useQuery({ queryKey: queryKeys.profile, queryFn: api.getProfile });
}

export function useFeaturedContenders() {
  return useQuery({ queryKey: queryKeys.featured, queryFn: api.getFeaturedContenders });
}
