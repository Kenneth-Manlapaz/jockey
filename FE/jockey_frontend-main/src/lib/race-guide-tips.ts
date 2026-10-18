import type { JockeyPHGuide } from '@/types';

export interface RaceTipPick {
  gate: string;
  horse: string;
  ageSexClass?: string;
  recentTime?: string;
  jockey?: string;
  weight?: string;
  trainer?: string;
  owner?: string;
  tipsterCodes: string[];
  tipsterCount: number;
  tipsterTotal: number;
  averageTipPosition: number;
}

/**
 * Demo-only tip heuristic: surfaces runners repeated across the sheet's B/W/Y
 * picks, then orders ties by their average position. It does not predict results.
 */
export function generateRaceTips(race: JockeyPHGuide['sampleRaces'][number], limit = 3): RaceTipPick[] {
  const ranks = new Map<string, number[]>();

  for (const tipster of race.tipsters) {
    const picks = tipster.picks.match(/[0-9]+[A-Z]?/gi) ?? [];
    picks.forEach((gate, index) => {
      const key = gate.toUpperCase();
      ranks.set(key, [...(ranks.get(key) ?? []), index + 1]);
    });
  }

  return [...ranks.entries()]
    .filter(([, positions]) => positions.length > 1)
    .map(([gate, positions]) => {
      const entry = race.entries.find((runner) => runner.gate.toUpperCase() === gate);
      return {
      gate,
      horse: entry?.horse ?? `Gate ${gate}`,
      ageSexClass: entry?.ageSexClass,
      recentTime: entry?.recentTime,
      jockey: entry?.jockey,
      weight: entry?.weight,
      trainer: entry?.trainer,
      owner: entry?.owner,
      tipsterCodes: race.tipsters.filter((tipster) => (tipster.picks.match(/[0-9]+[A-Z]?/gi) ?? []).some((pick) => pick.toUpperCase() === gate)).map((tipster) => tipster.code),
      tipsterCount: positions.length,
      tipsterTotal: race.tipsters.length,
      averageTipPosition: positions.reduce((total, position) => total + position, 0) / positions.length,
    };})
    .sort((a, b) => b.tipsterCount - a.tipsterCount || a.averageTipPosition - b.averageTipPosition || a.gate.localeCompare(b.gate))
    .slice(0, limit);
}
